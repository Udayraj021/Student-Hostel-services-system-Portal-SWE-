const express = require('express');
const { query, queryOne } = require('../config/db');
const { authRequired, requireRole } = require('../middleware/auth');
const { asyncHandler, notify } = require('../utils/helpers');

const router = express.Router();
router.use(authRequired);

// Service 6: TimetableService
router.get('/timetable', asyncHandler(async (req, res) => {
  let rollNumber = req.query.rollNumber;
  if (req.user.role === 'student' && !rollNumber) {
    const s = await queryOne('SELECT roll_number FROM students WHERE login_id=?', [req.user.loginId]);
    rollNumber = s ? s.roll_number : null;
  }
  if (!rollNumber) return res.status(400).json({ error: 'rollNumber required' });
  const rows = await query(
    `SELECT c.course_id, c.course_name, c.class_slot, c.credits, u.name AS professor_name, sc.semester
     FROM student_courses sc
     JOIN courses c ON sc.course_id = c.course_id
     LEFT JOIN users u ON c.professor_id = u.login_id
     WHERE sc.roll_number = ?
     ORDER BY c.class_slot`,
    [rollNumber]
  );
  res.json(rows);
}));

// All courses (catalog)
router.get('/', asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT c.*, u.name AS professor_name
     FROM courses c LEFT JOIN users u ON c.professor_id = u.login_id
     ORDER BY c.course_id`
  );
  res.json(rows);
}));

// Service 7: CourseUpdateService (Admin / Professor)
router.post('/', requireRole('admin','professor'), asyncHandler(async (req, res) => {
  const { course_id, course_name, department, credits, professor_id, class_slot } = req.body;
  if (!course_id || !course_name) return res.status(400).json({ error: 'course_id & course_name required' });
  await query(
    'INSERT INTO courses (course_id, course_name, department, credits, professor_id, class_slot) VALUES (?, ?, ?, ?, ?, ?)',
    [course_id, course_name, department || null, credits || 3, professor_id || null, class_slot || null]
  );
  res.json({ success: true });
}));

router.put('/:courseId', requireRole('admin','professor'), asyncHandler(async (req, res) => {
  const { course_name, department, credits, professor_id, class_slot } = req.body;
  await query(
    'UPDATE courses SET course_name=COALESCE(?,course_name), department=COALESCE(?,department), credits=COALESCE(?,credits), professor_id=COALESCE(?,professor_id), class_slot=COALESCE(?,class_slot) WHERE course_id=?',
    [course_name || null, department || null, credits || null, professor_id || null, class_slot || null, req.params.courseId]
  );
  res.json({ success: true });
}));

router.delete('/:courseId', requireRole('admin'), asyncHandler(async (req, res) => {
  await query('DELETE FROM courses WHERE course_id=?', [req.params.courseId]);
  res.json({ success: true });
}));

// Enrol / unenrol a student
router.post('/enroll', requireRole('admin'), asyncHandler(async (req, res) => {
  const { roll_number, course_id, semester } = req.body;
  await query('INSERT IGNORE INTO student_courses (roll_number, course_id, semester) VALUES (?, ?, ?)', [roll_number, course_id, semester || '2026-Spring']);
  const student = await queryOne('SELECT login_id FROM students WHERE roll_number=?', [roll_number]);
  if (student) await notify(student.login_id, 'New course added', `You have been enrolled in ${course_id}`, 'course', course_id);
  res.json({ success: true });
}));

router.delete('/enroll', requireRole('admin'), asyncHandler(async (req, res) => {
  const { roll_number, course_id } = req.body;
  await query('DELETE FROM student_courses WHERE roll_number=? AND course_id=?', [roll_number, course_id]);
  res.json({ success: true });
}));

// Service 14: ExamScheduleService
router.get('/exams', asyncHandler(async (req, res) => {
  let rollNumber = req.query.rollNumber;
  if (req.user.role === 'student' && !rollNumber) {
    const s = await queryOne('SELECT roll_number FROM students WHERE login_id=?', [req.user.loginId]);
    rollNumber = s ? s.roll_number : null;
  }
  let rows;
  if (rollNumber) {
    rows = await query(
      `SELECT e.*, c.course_name FROM exam_schedule e
       JOIN courses c ON e.course_id = c.course_id
       JOIN student_courses sc ON sc.course_id = c.course_id
       WHERE sc.roll_number = ?
       ORDER BY e.exam_day, e.start_time`,
      [rollNumber]
    );
  } else {
    rows = await query(
      `SELECT e.*, c.course_name FROM exam_schedule e JOIN courses c ON e.course_id=c.course_id ORDER BY e.exam_day, e.start_time`
    );
  }
  res.json(rows);
}));

router.post('/exams', requireRole('admin'), asyncHandler(async (req, res) => {
  const { course_id, exam_type, exam_day, start_time, duration_minutes, exam_room_number } = req.body;
  const r = await query(
    'INSERT INTO exam_schedule (course_id, exam_type, exam_day, start_time, duration_minutes, exam_room_number) VALUES (?, ?, ?, ?, ?, ?)',
    [course_id, exam_type, exam_day, start_time || null, duration_minutes || 180, exam_room_number || null]
  );
  res.json({ success: true, exam_id: r.insertId });
}));

router.put('/exams/:examId', requireRole('admin'), asyncHandler(async (req, res) => {
  const { exam_day, start_time, exam_room_number, duration_minutes } = req.body;
  await query(
    'UPDATE exam_schedule SET exam_day=COALESCE(?,exam_day), start_time=COALESCE(?,start_time), exam_room_number=COALESCE(?,exam_room_number), duration_minutes=COALESCE(?,duration_minutes) WHERE exam_id=?',
    [exam_day || null, start_time || null, exam_room_number || null, duration_minutes || null, req.params.examId]
  );
  res.json({ success: true });
}));

module.exports = router;
