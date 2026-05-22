const express = require('express');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler, notify } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

// Hostels
router.get('/hostels', asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM hostels ORDER BY name'));
}));

async function getMyRoll(loginId) {
  const s = await queryOne('SELECT roll_number, hostel_id FROM students WHERE login_id=?', [loginId]);
  return s;
}

async function checkPolicy(policyType) {
  const row = await queryOne(
    'SELECT * FROM policy_windows WHERE policy_type=? AND is_active=TRUE AND CURDATE() BETWEEN start_date AND end_date ORDER BY created_at DESC LIMIT 1',
    [policyType]
  );
  return !!row;
}

// Service 23: LeaveApplicationService
router.post('/leave', asyncHandler(async (req, res) => {
  const { start_date, end_date, leave_category, destination, reason } = req.body;
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const ok = await checkPolicy('Leave');
  if (!ok) return res.status(400).json({ error: 'Leave application window is closed' });
  const r = await query(
    'INSERT INTO leave_applications (roll_number, start_date, end_date, leave_category, destination, reason) VALUES (?, ?, ?, ?, ?, ?)',
    [s.roll_number, start_date, end_date, leave_category, destination || null, reason || null]
  );
  const wardens = await query('SELECT login_id FROM users WHERE role IN ("warden","admin") AND is_active=TRUE');
  for (const w of wardens) await notify(w.login_id, 'New Leave Application', `Leave application submitted by ${s.roll_number}`, 'leave', r.insertId);
  res.json({ success: true, leave_id: r.insertId });
}));

router.get('/leave', asyncHandler(async (req, res) => {
  let rows;
  if (req.user.role === 'student') {
    const s = await getMyRoll(req.user.loginId);
    rows = await query('SELECT * FROM leave_applications WHERE roll_number=? ORDER BY created_at DESC', [s.roll_number]);
  } else {
    rows = await query(
      `SELECT l.*, u.name AS student_name FROM leave_applications l
       JOIN students s ON s.roll_number = l.roll_number
       JOIN users u ON u.login_id = s.login_id
       ORDER BY l.created_at DESC`
    );
  }
  res.json(rows);
}));

router.post('/leave/:id/decide', requireRole('warden','admin'), asyncHandler(async (req, res) => {
  const { decision, remarks } = req.body;
  const leave = await queryOne('SELECT * FROM leave_applications WHERE leave_id=?', [req.params.id]);
  if (!leave) return res.status(404).json({ error: 'Not found' });
  await query(
    'UPDATE leave_applications SET status=?, warden_remarks=?, reviewed_by=? WHERE leave_id=?',
    [decision, remarks || null, req.user.loginId, req.params.id]
  );
  const student = await queryOne('SELECT login_id FROM students WHERE roll_number=?', [leave.roll_number]);
  if (student) await notify(student.login_id, `Leave ${decision}`, `Your leave application has been ${decision.toLowerCase()}.`, 'leave', leave.leave_id);
  res.json({ success: true });
}));

router.delete('/leave/:id', asyncHandler(async (req, res) => {
  const leave = await queryOne('SELECT * FROM leave_applications WHERE leave_id=?', [req.params.id]);
  if (!leave) return res.status(404).json({ error: 'Not found' });
  const s = await getMyRoll(req.user.loginId);
  if (s && leave.roll_number === s.roll_number) {
    await query('UPDATE leave_applications SET status="Cancelled" WHERE leave_id=?', [req.params.id]);
    return res.json({ success: true });
  }
  res.status(403).json({ error: 'Forbidden' });
}));

// Service 24: HostelTransferService
router.post('/transfer', asyncHandler(async (req, res) => {
  const { target_hostel_id, reason } = req.body;
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  if (!s.hostel_id) return res.status(400).json({ error: 'No current hostel assigned' });
  const active = await queryOne('SELECT * FROM transfer_requests WHERE roll_number=? AND status="Pending"', [s.roll_number]);
  if (active) return res.status(409).json({ error: 'You already have a pending transfer request' });
  const ok = await checkPolicy('HostelTransfer');
  if (!ok) return res.status(400).json({ error: 'Hostel transfer window is closed' });
  const r = await query(
    'INSERT INTO transfer_requests (roll_number, current_hostel_id, target_hostel_id, reason) VALUES (?, ?, ?, ?)',
    [s.roll_number, s.hostel_id, target_hostel_id, reason || null]
  );
  const admins = await query('SELECT login_id FROM users WHERE role IN ("admin","warden")');
  for (const a of admins) await notify(a.login_id, 'New Transfer Request', `${s.roll_number} requested transfer`, 'transfer', r.insertId);
  res.json({ success: true, request_id: r.insertId });
}));

router.get('/transfer', asyncHandler(async (req, res) => {
  let rows;
  if (req.user.role === 'student') {
    const s = await getMyRoll(req.user.loginId);
    rows = await query('SELECT * FROM transfer_requests WHERE roll_number=? ORDER BY created_at DESC', [s.roll_number]);
  } else {
    rows = await query(
      `SELECT t.*, u.name AS student_name, h1.name AS current_hostel_name, h2.name AS target_hostel_name
       FROM transfer_requests t
       JOIN students s ON s.roll_number = t.roll_number
       JOIN users u ON u.login_id = s.login_id
       JOIN hostels h1 ON h1.hostel_id = t.current_hostel_id
       JOIN hostels h2 ON h2.hostel_id = t.target_hostel_id
       ORDER BY t.created_at DESC`
    );
  }
  res.json(rows);
}));

router.post('/transfer/:id/decide', requireRole('admin','warden'), asyncHandler(async (req, res) => {
  const { decision, remarks } = req.body;
  const tr = await queryOne('SELECT * FROM transfer_requests WHERE request_id=?', [req.params.id]);
  if (!tr) return res.status(404).json({ error: 'Not found' });
  await query('UPDATE transfer_requests SET status=?, remarks=?, reviewed_by=? WHERE request_id=?', [decision, remarks || null, req.user.loginId, req.params.id]);
  if (decision === 'Approved') {
    await query('UPDATE students SET hostel_id=? WHERE roll_number=?', [tr.target_hostel_id, tr.roll_number]);
  }
  const student = await queryOne('SELECT login_id FROM students WHERE roll_number=?', [tr.roll_number]);
  if (student) await notify(student.login_id, 'Transfer ' + decision, `Your transfer request was ${decision.toLowerCase()}.`, 'transfer', tr.request_id);
  res.json({ success: true });
}));

// Policy windows (Service 29)
router.get('/policies', asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM policy_windows ORDER BY start_date DESC'));
}));

router.post('/policies', requireRole('admin'), asyncHandler(async (req, res) => {
  const { policy_type, start_date, end_date, is_active, notes } = req.body;
  const r = await query(
    'INSERT INTO policy_windows (policy_type, start_date, end_date, is_active, notes) VALUES (?, ?, ?, ?, ?)',
    [policy_type, start_date, end_date, is_active ?? true, notes || null]
  );
  res.json({ success: true, policy_id: r.insertId });
}));

router.patch('/policies/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  await query('UPDATE policy_windows SET is_active=? WHERE policy_id=?', [is_active, req.params.id]);
  res.json({ success: true });
}));

module.exports = router;
