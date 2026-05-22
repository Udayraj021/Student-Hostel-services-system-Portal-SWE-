const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler, notify } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

async function getMyRoll(loginId) {
  return await queryOne('SELECT roll_number FROM students WHERE login_id=?', [loginId]);
}

const CURRENT_PERIOD = '2026-Spring';

// Service 30: RoomCleaningService
router.post('/cleaning', asyncHandler(async (req, res) => {
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const quota = await queryOne('SELECT * FROM cleaning_quota WHERE roll_number=? AND period=?', [s.roll_number, CURRENT_PERIOD]);
  const balance = quota ? quota.quota_balance : 4;
  if (balance <= 0) return res.status(400).json({ error: 'No cleaning quota remaining for this period' });
  const r = await query(
    'INSERT INTO service_requests (roll_number, service_type, status, scheduled_date, notes) VALUES (?, "Cleaning", "Scheduled", ?, ?)',
    [s.roll_number, req.body.scheduled_date || null, req.body.notes || null]
  );
  if (quota) {
    await query('UPDATE cleaning_quota SET quota_balance=quota_balance-1 WHERE id=?', [quota.id]);
  } else {
    await query('INSERT INTO cleaning_quota (roll_number, period, quota_balance) VALUES (?, ?, 3)', [s.roll_number, CURRENT_PERIOD]);
  }
  res.json({ success: true, request_id: r.insertId, remainingQuota: balance - 1 });
}));

router.get('/cleaning/quota', asyncHandler(async (req, res) => {
  const s = await getMyRoll(req.user.loginId);
  const q = await queryOne('SELECT * FROM cleaning_quota WHERE roll_number=? AND period=?', [s.roll_number, CURRENT_PERIOD]);
  res.json({ period: CURRENT_PERIOD, balance: q ? q.quota_balance : 4, default: 4 });
}));

// Service 28: LaundryQRService
router.post('/laundry', asyncHandler(async (req, res) => {
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const token = crypto.randomBytes(16).toString('hex');
  const r = await query(
    'INSERT INTO service_requests (roll_number, service_type, qr_token, status, scheduled_date) VALUES (?, "Laundry", ?, "Scheduled", ?)',
    [s.roll_number, token, req.body.scheduled_date || null]
  );
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ requestId: r.insertId, token }), { width: 300 });
  res.json({ success: true, request_id: r.insertId, qrDataUrl, token });
}));

router.post('/laundry/mark-ready', requireRole('laundry_staff','admin'), asyncHandler(async (req, res) => {
  const { token } = req.body;
  const reqRow = await queryOne('SELECT * FROM service_requests WHERE qr_token=? AND service_type="Laundry"', [token]);
  if (!reqRow) return res.status(404).json({ error: 'Invalid QR' });
  await query('UPDATE service_requests SET status="Ready", completed_at=NOW() WHERE request_id=?', [reqRow.request_id]);
  const student = await queryOne('SELECT login_id FROM students WHERE roll_number=?', [reqRow.roll_number]);
  if (student) await notify(student.login_id, 'Laundry Ready', 'Your laundry is ready for pickup.', 'laundry', reqRow.request_id);
  res.json({ success: true });
}));

router.get('/me', asyncHandler(async (req, res) => {
  const s = await getMyRoll(req.user.loginId);
  const rows = await query('SELECT * FROM service_requests WHERE roll_number=? ORDER BY created_at DESC', [s.roll_number]);
  res.json(rows);
}));

router.get('/all', requireRole('admin','staff','laundry_staff'), asyncHandler(async (req, res) => {
  const { type, status } = req.query;
  let sql = 'SELECT s.*, u.name AS student_name FROM service_requests s JOIN students st ON st.roll_number=s.roll_number JOIN users u ON u.login_id=st.login_id WHERE 1=1';
  const params = [];
  if (type) { sql += ' AND s.service_type=?'; params.push(type); }
  if (status) { sql += ' AND s.status=?'; params.push(status); }
  sql += ' ORDER BY s.created_at DESC LIMIT 200';
  res.json(await query(sql, params));
}));

module.exports = router;
