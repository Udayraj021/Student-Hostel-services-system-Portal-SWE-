const express = require('express');
const { query, queryOne } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { asyncHandler, notify } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

// Service 22: CabSharingService
router.get('/', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT c.*, u.name AS host_name, u.email AS host_email,
       (SELECT COUNT(*) FROM cab_requests r WHERE r.share_id=c.share_id AND r.status="Pending") AS pending_requests
     FROM cab_shares c JOIN users u ON u.login_id = c.host_id
     WHERE c.status IN ('Active','Full') AND c.pickup_date >= CURDATE()
     ORDER BY c.pickup_date, c.pickup_time`
  );
  res.json(rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { source, destination, pickup_date, pickup_time, available_seats, phone_number, notes } = req.body;
  if (!source || !destination || !pickup_date || !pickup_time || !available_seats) return res.status(400).json({ error: 'Missing fields' });
  const r = await query(
    'INSERT INTO cab_shares (host_id, source, destination, pickup_date, pickup_time, available_seats, phone_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.loginId, source, destination, pickup_date, pickup_time, available_seats, phone_number || null, notes || null]
  );
  res.json({ success: true, share_id: r.insertId });
}));

router.post('/:id/request', asyncHandler(async (req, res) => {
  const share = await queryOne('SELECT * FROM cab_shares WHERE share_id=?', [req.params.id]);
  if (!share) return res.status(404).json({ error: 'Not found' });
  if (share.host_id === req.user.loginId) return res.status(400).json({ error: 'Cannot request your own ride' });
  if (share.status !== 'Active') return res.status(400).json({ error: 'Ride not available' });
  const exists = await queryOne('SELECT * FROM cab_requests WHERE share_id=? AND requester_id=?', [req.params.id, req.user.loginId]);
  if (exists) return res.status(409).json({ error: 'Already requested' });
  const r = await query(
    'INSERT INTO cab_requests (share_id, requester_id, requester_note) VALUES (?, ?, ?)',
    [req.params.id, req.user.loginId, req.body.note || null]
  );
  await notify(share.host_id, 'Cab Share - New Request', `${req.user.name} has requested to join your ride ${share.source} → ${share.destination}`, 'cab', req.params.id);
  res.json({ success: true, request_id: r.insertId });
}));

router.get('/:id/requests', asyncHandler(async (req, res) => {
  const share = await queryOne('SELECT * FROM cab_shares WHERE share_id=?', [req.params.id]);
  if (!share) return res.status(404).json({ error: 'Not found' });
  if (share.host_id !== req.user.loginId && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const rows = await query(
    `SELECT r.*, u.name AS requester_name, u.email AS requester_email
     FROM cab_requests r JOIN users u ON u.login_id = r.requester_id
     WHERE r.share_id=? ORDER BY r.requested_at DESC`, [req.params.id]
  );
  res.json(rows);
}));

router.post('/requests/:id/decide', asyncHandler(async (req, res) => {
  const { decision } = req.body; // Approved/Rejected
  const request = await queryOne('SELECT * FROM cab_requests WHERE request_id=?', [req.params.id]);
  if (!request) return res.status(404).json({ error: 'Not found' });
  const share = await queryOne('SELECT * FROM cab_shares WHERE share_id=?', [request.share_id]);
  if (share.host_id !== req.user.loginId && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await query('UPDATE cab_requests SET status=? WHERE request_id=?', [decision, req.params.id]);
  if (decision === 'Approved' && share.available_seats > 0) {
    const newSeats = share.available_seats - 1;
    const newStatus = newSeats <= 0 ? 'Full' : share.status;
    await query('UPDATE cab_shares SET available_seats=?, status=? WHERE share_id=?', [newSeats, newStatus, share.share_id]);
  }
  await notify(request.requester_id, 'Cab Share - Request ' + decision, `Your request for ${share.source} → ${share.destination} was ${decision.toLowerCase()}.`, 'cab', share.share_id);
  res.json({ success: true });
}));

router.get('/me/hosted', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM cab_shares WHERE host_id=? ORDER BY pickup_date DESC', [req.user.loginId]);
  res.json(rows);
}));

router.get('/me/joined', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT r.*, c.source, c.destination, c.pickup_date, c.pickup_time, u.name AS host_name
     FROM cab_requests r JOIN cab_shares c ON c.share_id = r.share_id
     JOIN users u ON u.login_id = c.host_id
     WHERE r.requester_id=? ORDER BY r.requested_at DESC`,
    [req.user.loginId]
  );
  res.json(rows);
}));

module.exports = router;
