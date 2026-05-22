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
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => cb(null, Date.now() + '_' + file.originalname.replace(/[^\w.-]/g, '_'))
  }),
  limits: { fileSize: 5 * 1024 * 1024 }
});

async function getMyRoll(loginId) {
  return await queryOne('SELECT roll_number FROM students WHERE login_id=?', [loginId]);
}

// ========== Service 8: DataChangeRequestService ==========

router.post('/data-change', upload.single('proof'), asyncHandler(async (req, res) => {
  const { field_name, old_value, new_value } = req.body;
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const proof = req.file ? `/uploads/${req.file.filename}` : null;
  const r = await query(
    'INSERT INTO data_change_requests (roll_number, field_name, old_value, new_value, proof_url) VALUES (?, ?, ?, ?, ?)',
    [s.roll_number, field_name, old_value || null, new_value, proof]
  );
  const admins = await query('SELECT login_id FROM users WHERE role="admin"');
  for (const a of admins) await notify(a.login_id, 'New Data Change Request', `${s.roll_number} requested change to ${field_name}`, 'data_change', r.insertId);
  res.json({ success: true, request_id: r.insertId });
}));

router.get('/data-change', asyncHandler(async (req, res) => {
  let rows;
  if (req.user.role === 'student') {
    const s = await getMyRoll(req.user.loginId);
    rows = await query('SELECT * FROM data_change_requests WHERE roll_number=? ORDER BY created_at DESC', [s.roll_number]);
  } else {
    rows = await query(
      `SELECT d.*, u.name AS student_name FROM data_change_requests d
       JOIN students s ON s.roll_number=d.roll_number JOIN users u ON u.login_id=s.login_id
       ORDER BY d.created_at DESC`
    );
  }
  res.json(rows);
}));

router.post('/data-change/:id/decide', requireRole('admin'), asyncHandler(async (req, res) => {
  const { decision, remarks } = req.body;
  const r = await queryOne('SELECT * FROM data_change_requests WHERE request_id=?', [req.params.id]);
  if (!r) return res.status(404).json({ error: 'Not found' });
  await query('UPDATE data_change_requests SET status=?, remarks=?, reviewed_by=? WHERE request_id=?',
    [decision, remarks || null, req.user.loginId, req.params.id]);
  // If approved and the field is a known student column, apply it
  const allowed = ['home_address','college_address','emergency_contact','blood_group'];
  if (decision === 'Approved' && allowed.includes(r.field_name)) {
    await query(`UPDATE students SET ${r.field_name}=? WHERE roll_number=?`, [r.new_value, r.roll_number]);
  }
  const student = await queryOne('SELECT login_id FROM students WHERE roll_number=?', [r.roll_number]);
  if (student) await notify(student.login_id, `Data Change ${decision}`, `Your data change request has been ${decision.toLowerCase()}.`, 'data_change', r.request_id);
  res.json({ success: true });
}));

// ========== Service 9: CertificateRequestService ==========

router.post('/certificate', asyncHandler(async (req, res) => {
  const { certificate_type, purpose } = req.body;
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const r = await query(
    'INSERT INTO certificate_requests (roll_number, certificate_type, purpose) VALUES (?, ?, ?)',
    [s.roll_number, certificate_type, purpose || null]
  );
  const admins = await query('SELECT login_id FROM users WHERE role="admin"');
  for (const a of admins) await notify(a.login_id, 'New Certificate Request', `${s.roll_number} requested ${certificate_type}`, 'certificate', r.insertId);
  res.json({ success: true, request_id: r.insertId });
}));

router.get('/certificate', asyncHandler(async (req, res) => {
  let rows;
  if (req.user.role === 'student') {
    const s = await getMyRoll(req.user.loginId);
    rows = await query('SELECT * FROM certificate_requests WHERE roll_number=? ORDER BY created_at DESC', [s.roll_number]);
  } else {
    rows = await query(
      `SELECT c.*, u.name AS student_name FROM certificate_requests c
       JOIN students s ON s.roll_number=c.roll_number JOIN users u ON u.login_id=s.login_id
       ORDER BY c.created_at DESC`
    );
  }
  res.json(rows);
}));

router.post('/certificate/:id/decide', requireRole('admin'), asyncHandler(async (req, res) => {
  const { decision } = req.body;
  const r = await queryOne('SELECT * FROM certificate_requests WHERE request_id=?', [req.params.id]);
  if (!r) return res.status(404).json({ error: 'Not found' });
  let newStatus = decision;
  let doc = r.document_url;
  if (decision === 'Approved') {
    newStatus = 'Completed';
    doc = `/uploads/certificates/${r.request_id}_${r.certificate_type}_signed.pdf`;
  }
  await query('UPDATE certificate_requests SET status=?, approved_by=?, document_url=? WHERE request_id=?',
    [newStatus, req.user.loginId, doc, req.params.id]);
  const student = await queryOne('SELECT login_id FROM students WHERE roll_number=?', [r.roll_number]);
  if (student) await notify(student.login_id, `Certificate ${newStatus}`, `Your ${r.certificate_type} certificate request has been ${newStatus.toLowerCase()}.`, 'certificate', r.request_id);
  res.json({ success: true });
}));

// ========== Service 10: IDCardService ==========

router.post('/idcard', upload.single('fir_proof'), asyncHandler(async (req, res) => {
  const { request_type, old_details, new_details } = req.body;
  const s = await getMyRoll(req.user.loginId);
  if (!s) return res.status(400).json({ error: 'Not a student' });
  const firUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const r = await query(
    'INSERT INTO id_card_requests (roll_number, request_type, fir_proof_url, old_details, new_details) VALUES (?, ?, ?, ?, ?)',
    [s.roll_number, request_type, firUrl, old_details || null, new_details || null]
  );
  res.json({ success: true, request_id: r.insertId });
}));

router.get('/idcard', asyncHandler(async (req, res) => {
  let rows;
  if (req.user.role === 'student') {
    const s = await getMyRoll(req.user.loginId);
    rows = await query('SELECT * FROM id_card_requests WHERE roll_number=? ORDER BY created_at DESC', [s.roll_number]);
  } else {
    rows = await query(
      `SELECT i.*, u.name AS student_name FROM id_card_requests i
       JOIN students s ON s.roll_number=i.roll_number JOIN users u ON u.login_id=s.login_id
       ORDER BY i.created_at DESC`
    );
  }
  res.json(rows);
}));

router.post('/idcard/:id/decide', requireRole('admin'), asyncHandler(async (req, res) => {
  const { decision } = req.body;
  await query('UPDATE id_card_requests SET dispatch_status=? WHERE request_id=?', [decision, req.params.id]);
  const r = await queryOne('SELECT * FROM id_card_requests WHERE request_id=?', [req.params.id]);
  const student = await queryOne('SELECT login_id FROM students WHERE roll_number=?', [r.roll_number]);
  if (student) await notify(student.login_id, `ID Card ${decision}`, `Your ID card request has been ${decision.toLowerCase()}.`, 'idcard', r.request_id);
  res.json({ success: true });
}));

module.exports = router;
