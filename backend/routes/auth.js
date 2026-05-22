const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { randomToken, addMinutes, audit, asyncHandler } = require('../utils/helpers');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '8h';
const MAX_FAILED = Number(process.env.MAX_FAILED_ATTEMPTS || 5);
const LOCKOUT_MINUTES = Number(process.env.LOCKOUT_MINUTES || 15);
const SESSION_IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES || 30);

// Service 1: UserLoginService
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const ip = req.ip;

  const user = await queryOne('SELECT * FROM users WHERE email = ? AND is_active = TRUE', [email]);
  if (!user) {
    await audit(null, 'login', 'failed', `Unknown email: ${email}`, ip);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const creds = await queryOne('SELECT * FROM credentials WHERE login_id = ?', [user.login_id]);
  if (!creds) return res.status(401).json({ error: 'Invalid credentials' });

  // Service 4: Account Lockout Check
  if (creds.locked_until && new Date(creds.locked_until) > new Date()) {
    const minsLeft = Math.ceil((new Date(creds.locked_until) - new Date()) / 60000);
    await audit(user.login_id, 'login', 'locked', `Account locked; ${minsLeft}m left`, ip);
    return res.status(423).json({ error: `Account locked. Try again in ${minsLeft} minutes.` });
  }

  const ok = await bcrypt.compare(password, creds.password_hash);
  if (!ok) {
    const fail = creds.fail_count + 1;
    let lockUntil = null;
    if (fail >= MAX_FAILED) {
      lockUntil = addMinutes(new Date(), LOCKOUT_MINUTES);
    }
    await query(
      'UPDATE credentials SET fail_count=?, last_attempt=NOW(), locked_until=? WHERE login_id=?',
      [fail, lockUntil, user.login_id]
    );
    await audit(user.login_id, 'login', 'failed', `Attempt ${fail}`, ip);
    if (lockUntil) return res.status(423).json({ error: `Too many attempts. Account locked for ${LOCKOUT_MINUTES} minutes.` });
    return res.status(401).json({ error: 'Invalid credentials', attemptsLeft: MAX_FAILED - fail });
  }

  // reset failure count
  await query('UPDATE credentials SET fail_count=0, locked_until=NULL, last_attempt=NOW() WHERE login_id=?', [user.login_id]);

  const tokenPayload = { loginId: user.login_id, role: user.role, name: user.name, email: user.email };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  const expiresAt = addMinutes(new Date(), 60 * 8);
  await query(
    `INSERT INTO session_tracking (login_id, token, device_info, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [user.login_id, token, req.headers['user-agent'] || 'unknown', ip, expiresAt]
  );

  await audit(user.login_id, 'login', 'success', '', ip);

  // Fetch role-specific metadata
  let profile = {};
  if (user.role === 'student') {
    profile = await queryOne('SELECT roll_number, department, programme, year, hostel_id, room_number FROM students WHERE login_id=?', [user.login_id]) || {};
  }

  res.json({
    token,
    user: { ...tokenPayload, ...profile },
  });
}));

// Service 3: SessionManagementService
router.get('/sessions', authRequired, asyncHandler(async (req, res) => {
  const sessions = await query(
    'SELECT session_id, device_info, ip_address, created_at, last_activity, expires_at, revoked FROM session_tracking WHERE login_id=? ORDER BY created_at DESC',
    [req.user.loginId]
  );
  res.json(sessions);
}));

router.delete('/sessions/:id', authRequired, asyncHandler(async (req, res) => {
  await query('UPDATE session_tracking SET revoked=TRUE WHERE session_id=? AND login_id=?', [req.params.id, req.user.loginId]);
  res.json({ success: true });
}));

router.post('/logout', authRequired, asyncHandler(async (req, res) => {
  await query('UPDATE session_tracking SET revoked=TRUE WHERE session_id=?', [req.sessionId]);
  await audit(req.user.loginId, 'logout', 'success', '', req.ip);
  res.json({ success: true });
}));

// Service 2: PasswordResetService
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = await queryOne('SELECT login_id FROM users WHERE email=?', [email]);
  // Always return success to avoid user enumeration
  if (user) {
    const token = randomToken(24);
    const expiry = addMinutes(new Date(), 30);
    await query('INSERT INTO password_reset (login_id, token, expiry_time) VALUES (?, ?, ?)', [user.login_id, token, expiry]);
    // In prod would email; here we return the token so demo works without email server
    return res.json({ success: true, message: 'Reset link generated', resetToken: token, note: 'In production this token would be emailed; shown here for demo purposes only.' });
  }
  res.json({ success: true, message: 'If the email is registered, a reset link has been sent.' });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const reset = await queryOne('SELECT * FROM password_reset WHERE token=? AND is_used=FALSE AND expiry_time > NOW()', [token]);
  if (!reset) return res.status(400).json({ error: 'Invalid or expired reset token' });

  const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS || 10));
  await query('UPDATE credentials SET password_hash=?, last_password_changed=NOW(), fail_count=0, locked_until=NULL WHERE login_id=?', [hash, reset.login_id]);
  await query('UPDATE password_reset SET is_used=TRUE WHERE reset_id=?', [reset.reset_id]);
  await audit(reset.login_id, 'password_reset', 'success', '', req.ip);
  res.json({ success: true, message: 'Password updated successfully' });
}));

router.post('/change-password', authRequired, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const creds = await queryOne('SELECT * FROM credentials WHERE login_id=?', [req.user.loginId]);
  const ok = await bcrypt.compare(currentPassword, creds.password_hash);
  if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
  const hash = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS || 10));
  await query('UPDATE credentials SET password_hash=?, last_password_changed=NOW() WHERE login_id=?', [hash, req.user.loginId]);
  await audit(req.user.loginId, 'change_password', 'success', '', req.ip);
  res.json({ success: true });
}));

// Service 5: RBAC check endpoint
router.get('/me', authRequired, asyncHandler(async (req, res) => {
  const user = await queryOne('SELECT login_id, role, name, email, contact_no FROM users WHERE login_id=?', [req.user.loginId]);
  let profile = {};
  if (user.role === 'student') {
    profile = await queryOne('SELECT * FROM students WHERE login_id=?', [user.login_id]) || {};
  } else if (user.role === 'professor') {
    profile = await queryOne('SELECT * FROM professors WHERE login_id=?', [user.login_id]) || {};
  } else if (user.role === 'admin') {
    profile = await queryOne('SELECT * FROM admin_staff WHERE login_id=?', [user.login_id]) || {};
  }
  res.json({ user: { ...user, ...profile } });
}));

router.get('/audit-logs', authRequired, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 200, 1), 500);
  const logs = await query(
    `SELECT a.audit_id AS log_id, a.login_id, a.action, a.ip_address,
            a.status AS result, a.details, a.created_at AS timestamp,
            u.name AS user_name, u.role AS user_role
     FROM audit_log a LEFT JOIN users u ON u.login_id = a.login_id
     ORDER BY a.created_at DESC LIMIT ${limit}`
  );
  res.json(logs);
}));

module.exports = router;
