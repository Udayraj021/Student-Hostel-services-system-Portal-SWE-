const express = require('express');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler, notify } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

async function getMyRoll(loginId) {
  return await queryOne('SELECT roll_number, hostel_id FROM students WHERE login_id=?', [loginId]);
}

async function checkPolicy(policyType) {
  const row = await queryOne(
    'SELECT * FROM policy_windows WHERE policy_type=? AND is_active=TRUE AND CURDATE() BETWEEN start_date AND end_date LIMIT 1',
    [policyType]
  );
  return !!row;
}

// List messes
router.get('/list', asyncHandler(async (req, res) => {
  res.json(await query('SELECT m.*, h.name AS hostel_name FROM mess m LEFT JOIN hostels h ON h.hostel_id=m.hostel_id ORDER BY m.opi_rank'));
}));

// Service 25: MessSubscriptionService
router.get('/subscription', asyncHandler(async (req, res) => {
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const sub = await queryOne(
    `SELECT ms.*, m.name AS mess_name, m.caterer_name
     FROM mess_subscriptions ms JOIN mess m ON m.mess_id = ms.mess_id
     WHERE ms.roll_number=? AND ms.is_active=TRUE ORDER BY ms.start_date DESC LIMIT 1`,
    [s.roll_number]
  );
  res.json(sub);
}));

router.post('/subscription/change', asyncHandler(async (req, res) => {
  const { new_mess_id } = req.body;
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const ok = await checkPolicy('MessSubscription');
  if (!ok) return res.status(400).json({ error: 'Mess change window is closed' });
  await query('UPDATE mess_subscriptions SET is_active=FALSE, end_date=CURDATE() WHERE roll_number=? AND is_active=TRUE', [s.roll_number]);
  await query('INSERT INTO mess_subscriptions (roll_number, mess_id, start_date) VALUES (?, ?, CURDATE())', [s.roll_number, new_mess_id]);
  res.json({ success: true });
}));

// Service 26: MessRebateService
router.post('/rebate', asyncHandler(async (req, res) => {
  const { leave_application_id } = req.body;
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const leave = await queryOne('SELECT * FROM leave_applications WHERE leave_id=? AND roll_number=?', [leave_application_id, s.roll_number]);
  if (!leave) return res.status(404).json({ error: 'Leave not found' });
  if (leave.status !== 'Approved') return res.status(400).json({ error: 'Leave must be approved to claim rebate' });
  const dup = await queryOne('SELECT * FROM mess_rebates WHERE leave_application_id=?', [leave_application_id]);
  if (dup) return res.status(409).json({ error: 'Rebate already claimed for this leave' });
  const r = await query(
    'INSERT INTO mess_rebates (roll_number, leave_application_id, start_date, end_date) VALUES (?, ?, ?, ?)',
    [s.roll_number, leave_application_id, leave.start_date, leave.end_date]
  );
  const secs = await query('SELECT login_id FROM users WHERE role="mess_secretary" AND is_active=TRUE');
  for (const x of secs) await notify(x.login_id, 'New Mess Rebate', `${s.roll_number} applied for rebate`, 'rebate', r.insertId);
  res.json({ success: true, rebate_id: r.insertId });
}));

router.get('/rebate', asyncHandler(async (req, res) => {
  let rows;
  if (req.user.role === 'student') {
    const s = await getMyRoll(req.user.loginId);
    rows = await query(
      `SELECT r.*, l.start_date AS leave_start, l.end_date AS leave_end
       FROM mess_rebates r JOIN leave_applications l ON l.leave_id=r.leave_application_id
       WHERE r.roll_number=? ORDER BY r.created_at DESC`,
      [s.roll_number]
    );
  } else {
    rows = await query(
      `SELECT r.*, u.name AS student_name
       FROM mess_rebates r JOIN students s ON s.roll_number=r.roll_number
       JOIN users u ON u.login_id=s.login_id ORDER BY r.created_at DESC`
    );
  }
  res.json(rows);
}));

router.post('/rebate/:id/decide', requireRole('mess_secretary','admin'), asyncHandler(async (req, res) => {
  const { decision } = req.body;
  const rebate = await queryOne('SELECT * FROM mess_rebates WHERE rebate_id=?', [req.params.id]);
  if (!rebate) return res.status(404).json({ error: 'Not found' });
  await query('UPDATE mess_rebates SET status=?, approved_by=? WHERE rebate_id=?', [decision, req.user.loginId, req.params.id]);
  const student = await queryOne('SELECT login_id FROM students WHERE roll_number=?', [rebate.roll_number]);
  if (student) await notify(student.login_id, `Rebate ${decision}`, `Your mess rebate has been ${decision.toLowerCase()}.`, 'rebate', rebate.rebate_id);
  res.json({ success: true });
}));

// Service 27: MessFeedbackService
router.post('/feedback', asyncHandler(async (req, res) => {
  const { mess_id, meal, meal_rating, comments } = req.body;
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  await query(
    'INSERT INTO mess_feedback (roll_number, mess_id, meal, meal_rating, comments) VALUES (?, ?, ?, ?, ?)',
    [s.roll_number, mess_id, meal, meal_rating, comments || null]
  );
  res.json({ success: true });
}));

router.get('/feedback/:messId/summary', asyncHandler(async (req, res) => {
  const monthYear = req.query.month || new Date().toISOString().slice(0, 7);
  const rows = await query(
    `SELECT meal, ROUND(AVG(meal_rating),2) AS avg_rating, COUNT(*) AS count
     FROM mess_feedback WHERE mess_id=? AND DATE_FORMAT(meal_date, '%Y-%m')=?
     GROUP BY meal`,
    [req.params.messId, monthYear]
  );
  const [overall] = await query(
    `SELECT ROUND(AVG(meal_rating),2) AS overall_rating FROM mess_feedback WHERE mess_id=? AND DATE_FORMAT(meal_date, '%Y-%m')=?`,
    [req.params.messId, monthYear]
  );
  res.json({ byMeal: rows, overall: overall ? overall.overall_rating : 0, monthYear });
}));

router.get('/feedback/recent', asyncHandler(async (req, res) => {
  const s = await getMyRoll(req.user.loginId);
  const rows = await query('SELECT * FROM mess_feedback WHERE roll_number=? ORDER BY created_at DESC LIMIT 30', [s.roll_number]);
  res.json(rows);
}));

module.exports = router;
