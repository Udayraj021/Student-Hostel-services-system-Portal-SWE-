const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler, notify } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

const UPLOAD_DIR = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname.replace(/[^\w.-]/g, '_'))
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/categories', asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM complaint_categories ORDER BY name'));
}));

router.get('/statuses', asyncHandler(async (req, res) => {
  res.json(await query('SELECT * FROM complaint_status ORDER BY status_id'));
}));

// Service 31: ComplaintSubmissionService
router.post('/', upload.single('photo'), asyncHandler(async (req, res) => {
  const { category_id, title, description, priority, portal_type, external_ipm_id } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title & description required' });
  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  const r = await query(
    `INSERT INTO complaints (student_id, category_id, title, description, priority, portal_type, photo_url, external_ipm_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.loginId, category_id || null, title, description, priority || 'Medium',
     portal_type || 'General', photo, external_ipm_id || null]
  );
  await query('INSERT INTO complaint_history (complaint_id, old_status_id, new_status_id, changed_by, note) VALUES (?, NULL, 1, ?, "Complaint submitted")', [r.insertId, req.user.loginId]);

  const admins = await query('SELECT login_id FROM users WHERE role IN ("admin","staff")');
  for (const a of admins) await notify(a.login_id, 'New Complaint', `[${priority || 'Medium'}] ${title}`, 'complaint', r.insertId);
  await notify(req.user.loginId, 'Complaint Submitted', `Your complaint #${r.insertId} has been submitted successfully.`, 'complaint', r.insertId);
  res.json({ success: true, complaint_id: r.insertId });
}));

// Service 33: ComplaintTrackingService - list / detail
router.get('/', asyncHandler(async (req, res) => {
  const { status_id, mine, assigned } = req.query;
  let sql = `SELECT c.*, cs.status_name, cat.name AS category_name,
             u.name AS student_name, s.name AS staff_name
             FROM complaints c
             LEFT JOIN complaint_status cs ON cs.status_id = c.status_id
             LEFT JOIN complaint_categories cat ON cat.category_id = c.category_id
             LEFT JOIN users u ON u.login_id = c.student_id
             LEFT JOIN users s ON s.login_id = c.assigned_staff_id
             WHERE 1=1`;
  const params = [];
  if (req.user.role === 'student' || mine === 'true') {
    sql += ' AND c.student_id=?'; params.push(req.user.loginId);
  }
  if (req.user.role === 'staff' || assigned === 'me') {
    sql += ' AND c.assigned_staff_id=?'; params.push(req.user.loginId);
  }
  if (status_id) { sql += ' AND c.status_id=?'; params.push(status_id); }
  sql += ' ORDER BY c.created_at DESC LIMIT 300';
  res.json(await query(sql, params));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const complaint = await queryOne(
    `SELECT c.*, cs.status_name, cat.name AS category_name,
            u.name AS student_name, u.email AS student_email, s.name AS staff_name
            FROM complaints c
            LEFT JOIN complaint_status cs ON cs.status_id = c.status_id
            LEFT JOIN complaint_categories cat ON cat.category_id = c.category_id
            LEFT JOIN users u ON u.login_id = c.student_id
            LEFT JOIN users s ON s.login_id = c.assigned_staff_id
            WHERE c.complaint_id=?`, [req.params.id]);
  if (!complaint) return res.status(404).json({ error: 'Not found' });
  const history = await query(
    `SELECT h.*, s1.status_name AS old_status, s2.status_name AS new_status, u.name AS changer_name
     FROM complaint_history h
     LEFT JOIN complaint_status s1 ON s1.status_id=h.old_status_id
     LEFT JOIN complaint_status s2 ON s2.status_id=h.new_status_id
     LEFT JOIN users u ON u.login_id=h.changed_by
     WHERE h.complaint_id=? ORDER BY h.changed_at ASC`, [req.params.id]);
  const comments = await query(
    `SELECT cc.*, u.name AS user_name FROM complaint_comments cc
     JOIN users u ON u.login_id=cc.user_id WHERE cc.complaint_id=? ORDER BY cc.created_at ASC`, [req.params.id]);
  const feedback = await queryOne('SELECT * FROM complaint_feedback WHERE complaint_id=?', [req.params.id]);
  res.json({ complaint, history, comments, feedback });
}));

// Service 32: ComplaintAssignmentService
router.post('/:id/assign', requireRole('admin'), asyncHandler(async (req, res) => {
  const { staff_id } = req.body;
  const c = await queryOne('SELECT * FROM complaints WHERE complaint_id=?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Not found' });
  await query(
    'UPDATE complaints SET assigned_staff_id=?, assigned_by=?, assigned_at=NOW(), status_id=2 WHERE complaint_id=?',
    [staff_id, req.user.loginId, req.params.id]
  );
  await query('INSERT INTO complaint_history (complaint_id, old_status_id, new_status_id, changed_by, note) VALUES (?, ?, 2, ?, "Assigned to staff")', [req.params.id, c.status_id, req.user.loginId]);
  await notify(staff_id, 'New Complaint Assigned', `Complaint #${req.params.id}: ${c.title}`, 'complaint', req.params.id);
  await notify(c.student_id, 'Complaint Assigned', `Your complaint #${req.params.id} has been assigned to staff.`, 'complaint', req.params.id);
  res.json({ success: true });
}));

router.post('/:id/auto-assign', requireRole('admin'), asyncHandler(async (req, res) => {
  // Pick staff with fewest open complaints
  const staff = await query(
    `SELECT u.login_id, COUNT(c.complaint_id) AS workload
     FROM users u LEFT JOIN complaints c ON c.assigned_staff_id=u.login_id AND c.status_id IN (2,3,4)
     WHERE u.role='staff' AND u.is_active=TRUE GROUP BY u.login_id ORDER BY workload ASC LIMIT 1`
  );
  if (!staff.length) return res.status(400).json({ error: 'No staff available' });
  const c = await queryOne('SELECT * FROM complaints WHERE complaint_id=?', [req.params.id]);
  await query('UPDATE complaints SET assigned_staff_id=?, assigned_by=?, assigned_at=NOW(), status_id=2 WHERE complaint_id=?', [staff[0].login_id, req.user.loginId, req.params.id]);
  await query('INSERT INTO complaint_history (complaint_id, old_status_id, new_status_id, changed_by, note) VALUES (?, ?, 2, ?, "Auto-assigned")', [req.params.id, c.status_id, req.user.loginId]);
  await notify(staff[0].login_id, 'Complaint Auto-Assigned', c.title, 'complaint', req.params.id);
  res.json({ success: true, assigned_to: staff[0].login_id });
}));

// Service 34: ComplaintStatusUpdateService
router.patch('/:id/status', requireRole('staff','admin'), asyncHandler(async (req, res) => {
  const { status_id, note } = req.body;
  const c = await queryOne('SELECT * FROM complaints WHERE complaint_id=?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'staff' && c.assigned_staff_id !== req.user.loginId) return res.status(403).json({ error: 'Not your complaint' });
  await query('UPDATE complaints SET status_id=?, resolution_note=IF(?=5,?,resolution_note) WHERE complaint_id=?',
    [status_id, status_id, note || null, req.params.id]);
  await query('INSERT INTO complaint_history (complaint_id, old_status_id, new_status_id, changed_by, note) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, c.status_id, status_id, req.user.loginId, note || null]);
  await notify(c.student_id, 'Complaint Status Updated', `Your complaint #${req.params.id} status updated.`, 'complaint', req.params.id);
  res.json({ success: true });
}));

// Comments
router.post('/:id/comments', asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  const c = await queryOne('SELECT * FROM complaints WHERE complaint_id=?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (req.user.role === 'student' && c.student_id !== req.user.loginId) return res.status(403).json({ error: 'Forbidden' });
  await query('INSERT INTO complaint_comments (complaint_id, user_id, user_type, message) VALUES (?, ?, ?, ?)',
    [req.params.id, req.user.loginId, req.user.role, message]);
  const recipient = req.user.loginId === c.student_id ? c.assigned_staff_id : c.student_id;
  if (recipient) await notify(recipient, 'New Comment on Complaint', message.slice(0,120), 'complaint', req.params.id);
  res.json({ success: true });
}));

// Service 35: FeedbackService
router.post('/:id/feedback', asyncHandler(async (req, res) => {
  const { rating, comments } = req.body;
  const c = await queryOne('SELECT * FROM complaints WHERE complaint_id=?', [req.params.id]);
  if (!c) return res.status(404).json({ error: 'Not found' });
  if (c.student_id !== req.user.loginId) return res.status(403).json({ error: 'Only the complainant can submit feedback' });
  if (c.status_id !== 5 && c.status_id !== 6) return res.status(400).json({ error: 'Feedback allowed only after resolution' });
  await query(
    'INSERT INTO complaint_feedback (complaint_id, rating, comments) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating=VALUES(rating), comments=VALUES(comments)',
    [req.params.id, rating, comments || null]
  );
  res.json({ success: true });
}));

router.get('/staff/:staffId/rating', asyncHandler(async (req, res) => {
  const [r] = await query(
    `SELECT ROUND(AVG(f.rating),2) AS avg_rating, COUNT(*) AS count
     FROM complaint_feedback f JOIN complaints c ON c.complaint_id=f.complaint_id
     WHERE c.assigned_staff_id=?`, [req.params.staffId]
  );
  res.json(r);
}));

module.exports = router;
