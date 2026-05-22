const express = require('express');
const { query } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler, notify } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

// Service 16: NotificationService
router.get('/', asyncHandler(async (req, res) => {
  const rows = await query(
    'SELECT * FROM notifications WHERE recipient_id=? ORDER BY sent_at DESC LIMIT 100',
    [req.user.loginId]
  );
  res.json(rows);
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  const [r] = await query('SELECT COUNT(*) as count FROM notifications WHERE recipient_id=? AND is_read=FALSE', [req.user.loginId]);
  res.json({ count: r.count });
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read=TRUE WHERE notification_id=? AND recipient_id=?', [req.params.id, req.user.loginId]);
  res.json({ success: true });
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await query('UPDATE notifications SET is_read=TRUE WHERE recipient_id=?', [req.user.loginId]);
  res.json({ success: true });
}));

// Admin broadcast
router.post('/broadcast', requireRole('admin'), asyncHandler(async (req, res) => {
  const { role, title, message, type } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'title & message required' });
  let users;
  if (role) users = await query('SELECT login_id FROM users WHERE role=? AND is_active=TRUE', [role]);
  else users = await query('SELECT login_id FROM users WHERE is_active=TRUE');
  for (const u of users) await notify(u.login_id, title, message, type || 'announcement');
  res.json({ success: true, sent: users.length });
}));

module.exports = router;
