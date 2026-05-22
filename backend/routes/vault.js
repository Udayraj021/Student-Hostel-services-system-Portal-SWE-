const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query, queryOne } = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

const UPLOAD_DIR = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.-]/g, '_');
    cb(null, `${ts}_${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024 }
});

async function getRoll(req) {
  const s = await queryOne('SELECT roll_number FROM students WHERE login_id=?', [req.user.loginId]);
  return s ? s.roll_number : null;
}

// Service 15: DocumentVaultService
router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  let rollNumber = req.body.rollNumber || await getRoll(req);
  if (!rollNumber) return res.status(400).json({ error: 'rollNumber required' });
  const url = `/uploads/${req.file.filename}`;
  const r = await query(
    'INSERT INTO vault (roll_number, file_name, file_url, file_type, size_kb, request_id) VALUES (?, ?, ?, ?, ?, ?)',
    [rollNumber, req.file.originalname, url, req.file.mimetype, Math.round(req.file.size / 1024), req.body.request_id || null]
  );
  res.json({ success: true, file_id: r.insertId, file_url: url });
}));

router.get('/', asyncHandler(async (req, res) => {
  let rollNumber = req.query.rollNumber;
  if (req.user.role === 'student' && !rollNumber) rollNumber = await getRoll(req);
  if (!rollNumber) return res.status(400).json({ error: 'rollNumber required' });
  const rows = await query('SELECT * FROM vault WHERE roll_number=? ORDER BY uploaded_at DESC', [rollNumber]);
  res.json(rows);
}));

router.delete('/:fileId', asyncHandler(async (req, res) => {
  const file = await queryOne('SELECT * FROM vault WHERE file_id=?', [req.params.fileId]);
  if (!file) return res.status(404).json({ error: 'Not found' });
  const roll = await getRoll(req);
  if (req.user.role === 'student' && file.roll_number !== roll) return res.status(403).json({ error: 'Forbidden' });
  if (file.file_url) {
    const p = path.join(UPLOAD_DIR, path.basename(file.file_url));
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  await query('DELETE FROM vault WHERE file_id=?', [req.params.fileId]);
  res.json({ success: true });
}));

module.exports = router;
