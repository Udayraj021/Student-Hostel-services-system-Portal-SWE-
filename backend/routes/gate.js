const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

// Service 21: GateLogQRService
router.post('/qr', asyncHandler(async (req, res) => {
  const { destination } = req.body;
  if (!destination) return res.status(400).json({ error: 'destination required' });
  const token = crypto.createHash('sha256').update(req.user.loginId + destination + Date.now() + (process.env.JWT_SECRET || 'x')).digest('hex');
  const payload = JSON.stringify({ uid: req.user.loginId, dest: destination, ts: Date.now(), tok: token });
  const qrDataUrl = await QRCode.toDataURL(payload, { width: 320 });
  await query(
    'INSERT INTO gate_logs (user_id, destination, qr_token, issued_at) VALUES (?, ?, ?, NOW())',
    [req.user.loginId, destination, token]
  );
  res.json({ qrDataUrl, token, payload });
}));

router.get('/logs', asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT * FROM gate_logs WHERE user_id=? ORDER BY issued_at DESC LIMIT 50',
    [req.user.loginId]
  );
  res.json(rows);
}));

// Gate scanner endpoint (for security staff / admin simulation)
router.post('/scan', requireRole('admin','staff'), asyncHandler(async (req, res) => {
  const { qr_token, gate_location, event_type } = req.body;
  const log = await queryOne('SELECT * FROM gate_logs WHERE qr_token=?', [qr_token]);
  if (!log) return res.status(404).json({ error: 'Invalid QR' });
  if (event_type === 'out') {
    await query('UPDATE gate_logs SET gate_location=?, out_time=NOW() WHERE log_id=?', [gate_location, log.log_id]);
  } else {
    await query('UPDATE gate_logs SET in_time=NOW() WHERE log_id=?', [log.log_id]);
  }
  res.json({ success: true });
}));

module.exports = router;
