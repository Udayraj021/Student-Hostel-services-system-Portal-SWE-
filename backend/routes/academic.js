const express = require('express');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

// Service 12: StudentProfileService
router.get('/profile', asyncHandler(async (req, res) => {
  let rollNumber = req.query.rollNumber;
  if (req.user.role === 'student' && !rollNumber) {
    const s = await queryOne('SELECT roll_number FROM students WHERE login_id=?', [req.user.loginId]);
    rollNumber = s ? s.roll_number : null;
  }
  if (!rollNumber) return res.status(400).json({ error: 'rollNumber required' });
  const profile = await queryOne(
    `SELECT u.login_id, u.name, u.email, u.contact_no, s.*, h.name AS hostel_name
     FROM students s JOIN users u ON u.login_id = s.login_id
     LEFT JOIN hostels h ON h.hostel_id = s.hostel_id
     WHERE s.roll_number=?`,
    [rollNumber]
  );
  if (!profile) return res.status(404).json({ error: 'Student not found' });
  res.json(profile);
}));

router.put('/profile/:rollNumber', requireRole('admin'), asyncHandler(async (req, res) => {
  const { department, programme, year, blood_group, home_address, college_address, emergency_contact, hostel_id, room_number } = req.body;
  await query(
    `UPDATE students SET
      department=COALESCE(?,department), programme=COALESCE(?,programme), year=COALESCE(?,year),
      blood_group=COALESCE(?,blood_group), home_address=COALESCE(?,home_address),
      college_address=COALESCE(?,college_address), emergency_contact=COALESCE(?,emergency_contact),
      hostel_id=COALESCE(?,hostel_id), room_number=COALESCE(?,room_number)
      WHERE roll_number=?`,
    [department || null, programme || null, year || null, blood_group || null,
     home_address || null, college_address || null, emergency_contact || null,
     hostel_id || null, room_number || null, req.params.rollNumber]
  );
  res.json({ success: true });
}));

// Service 13: AcademicRecordService
router.get('/records', asyncHandler(async (req, res) => {
  let rollNumber = req.query.rollNumber;
  if (req.user.role === 'student' && !rollNumber) {
    const s = await queryOne('SELECT roll_number FROM students WHERE login_id=?', [req.user.loginId]);
    rollNumber = s ? s.roll_number : null;
  }
  if (!rollNumber) return res.status(400).json({ error: 'rollNumber required' });

  const records = await query(
    `SELECT r.*, c.course_name
     FROM academic_records r
     LEFT JOIN courses c ON c.course_id = r.course_code
     WHERE r.roll_number=? ORDER BY r.semester DESC, r.course_code`,
    [rollNumber]
  );

  // CGPA
  let total = 0, credits = 0;
  records.forEach(r => { total += Number(r.grade_point) * Number(r.credits); credits += Number(r.credits); });
  const cgpa = credits ? (total / credits).toFixed(2) : '0.00';
  res.json({ records, cgpa });
}));

router.post('/records', requireRole('admin','professor'), asyncHandler(async (req, res) => {
  const { roll_number, course_code, semester, grade, grade_point, credits } = req.body;
  await query(
    'INSERT INTO academic_records (roll_number, course_code, semester, grade, grade_point, credits) VALUES (?, ?, ?, ?, ?, ?)',
    [roll_number, course_code, semester, grade || null, grade_point || 0, credits || 3]
  );
  res.json({ success: true });
}));

module.exports = router;
