const express = require('express');
const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired, requireRole('admin'));

// List users
router.get('/users', asyncHandler(async (req, res) => {
  const { role, q } = req.query;
  let sql = 'SELECT login_id, role, name, email, contact_no, is_active, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role=?'; params.push(role); }
  if (q) { sql += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY created_at DESC LIMIT 500';
  const users = await query(sql, params);
  res.json(users);
}));

// Create user (supports student/prof/staff/etc)
router.post('/users', asyncHandler(async (req, res) => {
  const { role, name, email, contact_no, password, extra } = req.body;
  if (!role || !name || !email || !password) return res.status(400).json({ error: 'role, name, email, password required' });
  const exists = await queryOne('SELECT login_id FROM users WHERE email=?', [email]);
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 10));
  const r = await query('INSERT INTO users (role, name, email, contact_no) VALUES (?, ?, ?, ?)', [role, name, email, contact_no || null]);
  const loginId = r.insertId;
  await query('INSERT INTO credentials (login_id, password_hash) VALUES (?, ?)', [loginId, hash]);
  if (role === 'student' && extra) {
    await query(
      `INSERT INTO students (login_id, roll_number, department, programme, year, hostel_id, room_number, date_of_joining)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [loginId, extra.roll_number, extra.department || null, extra.programme || null, extra.year || null,
       extra.hostel_id || null, extra.room_number || null, extra.date_of_joining || null]
    );
  } else if (role === 'professor' && extra) {
    await query('INSERT INTO professors (login_id, department, professor_post) VALUES (?, ?, ?)',
      [loginId, extra.department || null, extra.professor_post || null]);
  } else if (role === 'admin') {
    await query('INSERT INTO admin_staff (login_id, staff_designation) VALUES (?, ?)',
      [loginId, (extra && extra.staff_designation) || 'Admin']);
  }
  res.json({ success: true, loginId });
}));

// Deactivate user
router.patch('/users/:id', asyncHandler(async (req, res) => {
  const { is_active, name, contact_no } = req.body;
  await query('UPDATE users SET is_active=COALESCE(?, is_active), name=COALESCE(?, name), contact_no=COALESCE(?, contact_no) WHERE login_id=?',
    [typeof is_active === 'boolean' ? is_active : null, name || null, contact_no || null, req.params.id]);
  res.json({ success: true });
}));

// Service 4: Unlock account
router.post('/users/:id/unlock', asyncHandler(async (req, res) => {
  await query('UPDATE credentials SET fail_count=0, locked_until=NULL WHERE login_id=?', [req.params.id]);
  res.json({ success: true });
}));

// Stats for admin dashboard
router.get('/stats', asyncHandler(async (req, res) => {
  const [[u], [s], [c], [l], [ev]] = await Promise.all([
    query('SELECT COUNT(*) as total, SUM(role="student") as students, SUM(role="professor") as professors, SUM(role="admin") as admins FROM users WHERE is_active=TRUE'),
    query('SELECT COUNT(*) as pending_requests FROM certificate_requests WHERE status IN ("Submitted","UnderReview")'),
    query('SELECT COUNT(*) as open_complaints FROM complaints WHERE status_id IN (1,2,3,4)'),
    query('SELECT COUNT(*) as pending_leaves FROM leave_applications WHERE status="Pending"'),
    query('SELECT COUNT(*) as active_events FROM events WHERE status="Active"'),
  ]);
  res.json({ users: u, pendingRequests: s, complaints: c, leaves: l, events: ev });
}));

module.exports = router;
