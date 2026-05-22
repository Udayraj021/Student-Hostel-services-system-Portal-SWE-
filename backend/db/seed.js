const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

const rounds = Number(process.env.BCRYPT_ROUNDS || 10);

const demoUsers = [
  { role: 'admin', name: 'System Administrator', email: 'admin@iitg.ac.in', contact: '9000000001', password: 'admin@123', extra: { staff_designation: 'Super Admin' } },
  { role: 'admin', name: 'Student Affairs Admin', email: 'sa.admin@iitg.ac.in', contact: '9000000002', password: 'admin@123', extra: { staff_designation: 'Student Affairs' } },
  { role: 'warden', name: 'Dr. R. Sharma', email: 'warden.kameng@iitg.ac.in', contact: '9876500001', password: 'warden@123' },
  { role: 'mess_secretary', name: 'Mess Secretary', email: 'mess.sec@iitg.ac.in', contact: '9000000003', password: 'mess@123' },
  { role: 'board_exec', name: 'Board Exec - Events', email: 'boardexec@iitg.ac.in', contact: '9000000004', password: 'board@123' },
  { role: 'staff', name: 'Maintenance Staff 1', email: 'maint1@iitg.ac.in', contact: '9000000005', password: 'staff@123' },
  { role: 'staff', name: 'Maintenance Staff 2', email: 'maint2@iitg.ac.in', contact: '9000000006', password: 'staff@123' },
  { role: 'laundry_staff', name: 'Laundry Operator', email: 'laundry@iitg.ac.in', contact: '9000000007', password: 'laundry@123' },
  { role: 'professor', name: 'Prof. Pradeep K. Das', email: 'pkdas@iitg.ac.in', contact: '9000000008', password: 'prof@123', extra: { department: 'CSE', professor_post: 'Professor' } },
  { role: 'professor', name: 'Dr. Anita Rao', email: 'anita.rao@iitg.ac.in', contact: '9000000009', password: 'prof@123', extra: { department: 'Mathematics', professor_post: 'Associate Professor' } },
];

const demoStudents = [
  { name: 'Aarav Sharma', email: 'aarav.sharma@iitg.ac.in', roll: '230101001', dept: 'CSE', prog: 'B.Tech', year: 3, hostel: 1, room: 'A-101' },
  { name: 'Priya Patel', email: 'priya.patel@iitg.ac.in', roll: '230101002', dept: 'CSE', prog: 'B.Tech', year: 3, hostel: 3, room: 'B-202' },
  { name: 'Rahul Verma', email: 'rahul.verma@iitg.ac.in', roll: '230102015', dept: 'EEE', prog: 'B.Tech', year: 2, hostel: 2, room: 'C-303' },
  { name: 'Sneha Iyer', email: 'sneha.iyer@iitg.ac.in', roll: '230103022', dept: 'ME', prog: 'B.Tech', year: 2, hostel: 4, room: 'D-404' },
  { name: 'Kabir Singh', email: 'kabir.singh@iitg.ac.in', roll: '220104010', dept: 'CE', prog: 'B.Tech', year: 4, hostel: 5, room: 'E-105' },
];

async function createUser(u) {
  const hash = await bcrypt.hash(u.password, rounds);
  const [res] = await pool.execute(
    'INSERT INTO users (role, name, email, contact_no) VALUES (?, ?, ?, ?)',
    [u.role, u.name, u.email, u.contact || null]
  );
  const loginId = res.insertId;
  await pool.execute(
    'INSERT INTO credentials (login_id, password_hash) VALUES (?, ?)',
    [loginId, hash]
  );
  return loginId;
}

async function run() {
  console.log('\n→ Seeding demo users...');

  for (const u of demoUsers) {
    const loginId = await createUser(u);
    if (u.role === 'professor') {
      await pool.execute(
        'INSERT INTO professors (login_id, department, professor_post) VALUES (?, ?, ?)',
        [loginId, u.extra.department, u.extra.professor_post]
      );
    } else if (u.role === 'admin') {
      await pool.execute(
        'INSERT INTO admin_staff (login_id, staff_designation) VALUES (?, ?)',
        [loginId, u.extra ? u.extra.staff_designation : 'Admin']
      );
    }
    console.log(`  ✓ ${u.role.padEnd(16)} ${u.email}  (password: ${u.password})`);
  }

  console.log('\n→ Seeding demo students...');
  for (const s of demoStudents) {
    const loginId = await createUser({ role: 'student', name: s.name, email: s.email, contact: '9' + Math.floor(100000000 + Math.random()*899999999), password: 'student@123' });
    await pool.execute(
      `INSERT INTO students (login_id, roll_number, department, programme, year, hostel_id, room_number, date_of_joining)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [loginId, s.roll, s.dept, s.prog, s.year, s.hostel, s.room, '2023-08-01']
    );
    await pool.execute(
      'INSERT INTO mess_subscriptions (roll_number, mess_id, start_date, is_active) VALUES (?, ?, ?, ?)',
      [s.roll, s.hostel, '2026-04-01', true]
    );
    await pool.execute(
      'INSERT INTO cleaning_quota (roll_number, period, quota_balance) VALUES (?, ?, ?)',
      [s.roll, '2026-Spring', 4]
    );
    console.log(`  ✓ student          ${s.email} (roll: ${s.roll}, password: student@123)`);
  }

  console.log('\n→ Enrolling students in courses and seeding records...');
  const coursesByYear = {
    2: ['CS101','CS201','MA101','PH101','HS101'],
    3: ['CS201','CS301','CS345','CS346','HS101'],
    4: ['CS301','CS345','CS346'],
  };

  for (const s of demoStudents) {
    const list = coursesByYear[s.year] || ['CS101'];
    for (const c of list) {
      await pool.execute(
        'INSERT IGNORE INTO student_courses (roll_number, course_id, semester) VALUES (?, ?, ?)',
        [s.roll, c, '2026-Spring']
      );
      // Seed prior records
      const gp = (Math.random() * 3 + 6).toFixed(2);
      const grades = ['AA','AB','BB','BC','CC'];
      await pool.execute(
        'INSERT INTO academic_records (roll_number, course_code, semester, grade, grade_point, credits) VALUES (?, ?, ?, ?, ?, ?)',
        [s.roll, c, '2025-Autumn', grades[Math.floor(Math.random()*grades.length)], gp, 4]
      );
    }
  }

  console.log('\n✔ All demo data inserted successfully.\n');
  console.log('Login test credentials:');
  console.log('  Admin     : admin@iitg.ac.in / admin@123');
  console.log('  Warden    : warden.kameng@iitg.ac.in / warden@123');
  console.log('  Mess Sec  : mess.sec@iitg.ac.in / mess@123');
  console.log('  Board Exec: boardexec@iitg.ac.in / board@123');
  console.log('  Staff     : maint1@iitg.ac.in / staff@123');
  console.log('  Professor : pkdas@iitg.ac.in / prof@123');
  console.log('  Student   : aarav.sharma@iitg.ac.in / student@123');
  console.log('              priya.patel@iitg.ac.in / student@123\n');

  await pool.end();
}

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
