-- ============================================================================
-- Seed data: demo users, hostels, messes, courses, events, etc.
-- Passwords are bcrypt-hashed via `npm run seed` using the seed.js script.
-- This SQL seeds reference data only. Users + credentials are created via seed.js
-- ============================================================================

USE student_portal;

-- Hostels
INSERT INTO hostels (name, total_rooms, warden_name, warden_contact, gender) VALUES
('Kameng Hostel', 420, 'Dr. R. Sharma', '9876500001', 'Male'),
('Barak Hostel', 380, 'Dr. A. Verma', '9876500002', 'Male'),
('Subansiri Hostel', 360, 'Dr. P. Das', '9876500003', 'Female'),
('Dihing Hostel', 400, 'Dr. M. Singh', '9876500004', 'Female'),
('Brahmaputra Hostel', 450, 'Dr. K. Nath', '9876500005', 'Male');

-- Mess
INSERT INTO mess (hostel_id, name, caterer_name, capacity, opi_score, opi_rank) VALUES
(1, 'Kameng Mess', 'Shree Caterers', 450, 7.8, 2),
(2, 'Barak Mess', 'Tasty Bites', 400, 7.2, 4),
(3, 'Subansiri Mess', 'Annapurna Foods', 380, 8.1, 1),
(4, 'Dihing Mess', 'Home Kitchen', 420, 7.4, 3),
(5, 'Brahmaputra Mess', 'Spice Route', 470, 7.0, 5);

-- Courses
INSERT INTO courses (course_id, course_name, department, credits, class_slot) VALUES
('CS101', 'Introduction to Programming', 'CSE', 4, 'Mon/Wed/Fri 9:00-10:00'),
('CS201', 'Data Structures', 'CSE', 4, 'Tue/Thu 11:00-12:30'),
('CS301', 'Algorithms', 'CSE', 4, 'Mon/Wed 14:00-15:30'),
('CS345', 'Software Engineering', 'CSE', 3, 'Tue/Thu 9:00-10:30'),
('CS346', 'Software Engineering Lab', 'CSE', 2, 'Fri 14:00-17:00'),
('MA101', 'Calculus I', 'Mathematics', 4, 'Mon/Wed/Fri 10:00-11:00'),
('PH101', 'Physics I', 'Physics', 4, 'Tue/Thu 14:00-15:30'),
('HS101', 'Communication Skills', 'Humanities', 2, 'Fri 11:00-13:00');

-- Exam schedule
INSERT INTO exam_schedule (course_id, exam_type, exam_day, start_time, duration_minutes, exam_room_number) VALUES
('CS101', 'Mid-term', '2026-05-10', '09:00:00', 120, 'L1'),
('CS201', 'Mid-term', '2026-05-11', '09:00:00', 120, 'L2'),
('CS345', 'Mid-term', '2026-05-12', '14:00:00', 120, 'L3'),
('CS301', 'End-term', '2026-05-25', '09:00:00', 180, 'L1'),
('CS345', 'End-term', '2026-05-26', '09:00:00', 180, 'L2'),
('MA101', 'End-term', '2026-05-27', '14:00:00', 180, 'L3');

-- Complaint categories
INSERT INTO complaint_categories (name, description, default_department) VALUES
('Electrical', 'Issues with wiring, power, fans, lights', 'Maintenance'),
('Plumbing', 'Water supply, drainage, bathroom fixtures', 'Maintenance'),
('Carpentry', 'Doors, windows, furniture issues', 'Maintenance'),
('Cleaning', 'Cleanliness and sanitation concerns', 'Housekeeping'),
('Mess', 'Food quality, hygiene, service issues', 'Mess'),
('Academic', 'Course, grade, attendance concerns', 'Academic'),
('Security', 'Safety and security concerns', 'Security'),
('Internet', 'Network connectivity issues', 'IT'),
('Infrastructure', 'Building, grounds, common areas', 'Maintenance'),
('Other', 'Miscellaneous issues', 'Admin');

-- Complaint statuses
INSERT INTO complaint_status (status_id, status_name) VALUES
(1, 'Pending'),
(2, 'Assigned'),
(3, 'In Progress'),
(4, 'Awaiting Info'),
(5, 'Resolved'),
(6, 'Closed'),
(7, 'Rejected');

-- Policy windows
INSERT INTO policy_windows (policy_type, start_date, end_date, is_active, notes) VALUES
('Leave', '2026-01-01', '2026-12-31', TRUE, 'Year-round leave applications'),
('MessSubscription', '2026-04-01', '2026-04-30', TRUE, 'April mess change window'),
('MessRebate', '2026-04-15', '2026-05-15', TRUE, 'Monthly rebate claim window'),
('HostelTransfer', '2026-07-01', '2026-07-31', TRUE, 'Semester-start transfer window'),
('RoomCleaning', '2026-01-01', '2026-12-31', TRUE, 'Year-round cleaning quota');

-- Sample events
INSERT INTO events (title, description, event_date, location, category, is_free, fee, capacity, status) VALUES
('TechFest 2026', 'Annual technical festival with hackathons, robotics and workshops.', '2026-05-15 09:00:00', 'Main Auditorium', 'Technical', FALSE, 200.00, 500, 'Active'),
('Cultural Night', 'Music, dance and theatre performances by students.', '2026-04-30 18:00:00', 'Open Air Theatre', 'Cultural', TRUE, 0.00, 1000, 'Active'),
('Inter-Hostel Football Tournament', 'Football tournament among hostels.', '2026-05-05 16:00:00', 'Sports Complex', 'Sports', TRUE, 0.00, 200, 'Active'),
('Industry Talk - AI & Society', 'Guest lecture on AI ethics by Prof. Kumar.', '2026-04-25 14:00:00', 'Seminar Hall', 'Academic', TRUE, 0.00, 150, 'Active');

-- Permissions (for RBAC)
INSERT INTO permissions (role, resource, action) VALUES
('student','timetable','read'),
('student','academic','read'),
('student','profile','read'),
('student','complaints','create'),
('student','leave','create'),
('student','marketplace','create'),
('admin','*','*'),
('admin_staff','*','manage'),
('staff','complaints','update'),
('professor','courses','update'),
('mess_secretary','mess','manage'),
('warden','leave','approve'),
('board_exec','events','manage');
