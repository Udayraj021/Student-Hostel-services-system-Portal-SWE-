const express = require('express');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler, notify } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

// Service 17/18: Events
router.get('/', asyncHandler(async (req, res) => {
  const { category, status } = req.query;
  let sql = 'SELECT e.*, u.name AS creator_name, (SELECT COUNT(*) FROM event_registrations r WHERE r.event_id=e.event_id AND r.status="Registered") as registered_count FROM events e LEFT JOIN users u ON u.login_id = e.created_by WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND e.category=?'; params.push(category); }
  if (status) { sql += ' AND e.status=?'; params.push(status); } else { sql += ' AND e.status IN ("Active","Closed")'; }
  sql += ' ORDER BY e.event_date DESC';
  res.json(await query(sql, params));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const event = await queryOne('SELECT * FROM events WHERE event_id=?', [req.params.id]);
  if (!event) return res.status(404).json({ error: 'Not found' });
  const regs = await query('SELECT r.*, u.name, u.email FROM event_registrations r JOIN users u ON u.login_id = r.user_id WHERE r.event_id=? ORDER BY r.registered_at DESC', [req.params.id]);
  const myReg = await queryOne('SELECT * FROM event_registrations WHERE event_id=? AND user_id=?', [req.params.id, req.user.loginId]);
  res.json({ event, registrations: regs, myRegistration: myReg });
}));

// Service 18: Create / publish / unpublish
router.post('/', requireRole('board_exec','admin'), asyncHandler(async (req, res) => {
  const { title, description, event_date, location, category, is_free, fee, capacity, status } = req.body;
  if (!title || !event_date || !category) return res.status(400).json({ error: 'title, event_date, category required' });
  const r = await query(
    'INSERT INTO events (title, description, event_date, location, category, is_free, fee, capacity, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description || '', event_date, location || '', category, is_free ?? true, fee || 0, capacity || 0, status || 'Draft', req.user.loginId]
  );
  res.json({ success: true, event_id: r.insertId });
}));

router.put('/:id', requireRole('board_exec','admin'), asyncHandler(async (req, res) => {
  const { title, description, event_date, location, category, is_free, fee, capacity, status } = req.body;
  await query(
    `UPDATE events SET title=COALESCE(?,title), description=COALESCE(?,description), event_date=COALESCE(?,event_date),
      location=COALESCE(?,location), category=COALESCE(?,category), is_free=COALESCE(?,is_free), fee=COALESCE(?,fee),
      capacity=COALESCE(?,capacity), status=COALESCE(?,status) WHERE event_id=?`,
    [title || null, description || null, event_date || null, location || null, category || null,
     typeof is_free === 'boolean' ? is_free : null, fee ?? null, capacity ?? null, status || null, req.params.id]
  );
  res.json({ success: true });
}));

router.delete('/:id', requireRole('board_exec','admin'), asyncHandler(async (req, res) => {
  await query('DELETE FROM events WHERE event_id=?', [req.params.id]);
  res.json({ success: true });
}));

// Service 17: Register
router.post('/:id/register', asyncHandler(async (req, res) => {
  const event = await queryOne('SELECT * FROM events WHERE event_id=?', [req.params.id]);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.status !== 'Active') return res.status(400).json({ error: 'Event not open for registration' });
  const existing = await queryOne('SELECT * FROM event_registrations WHERE event_id=? AND user_id=?', [req.params.id, req.user.loginId]);
  if (existing) return res.status(409).json({ error: 'Already registered' });
  const payStatus = event.is_free ? 'NotRequired' : 'Pending';
  const r = await query(
    'INSERT INTO event_registrations (event_id, user_id, status, payment_status) VALUES (?, ?, ?, ?)',
    [req.params.id, req.user.loginId, 'Registered', payStatus]
  );
  await notify(req.user.loginId, 'Event Registered', `You have registered for ${event.title}`, 'event', event.event_id);
  res.json({ success: true, registration_id: r.insertId, paymentRequired: !event.is_free, amount: event.fee });
}));

router.post('/:id/cancel', asyncHandler(async (req, res) => {
  await query('UPDATE event_registrations SET status="Cancelled" WHERE event_id=? AND user_id=?', [req.params.id, req.user.loginId]);
  res.json({ success: true });
}));

router.post('/:id/bookmark', asyncHandler(async (req, res) => {
  const reg = await queryOne('SELECT * FROM event_registrations WHERE event_id=? AND user_id=?', [req.params.id, req.user.loginId]);
  if (reg) {
    await query('UPDATE event_registrations SET bookmarked = NOT bookmarked WHERE registration_id=?', [reg.registration_id]);
  } else {
    await query('INSERT INTO event_registrations (event_id, user_id, status, payment_status, bookmarked) VALUES (?, ?, "Cancelled", "NotRequired", TRUE)', [req.params.id, req.user.loginId]);
  }
  res.json({ success: true });
}));

router.get('/me/my-events', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT r.*, e.title, e.event_date, e.category, e.location, e.is_free, e.fee, e.status AS event_status
     FROM event_registrations r
     JOIN events e ON e.event_id = r.event_id
     WHERE r.user_id=? ORDER BY e.event_date DESC`,
    [req.user.loginId]
  );
  res.json(rows);
}));

module.exports = router;
