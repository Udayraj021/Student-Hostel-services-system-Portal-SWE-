-- ============================================================================
-- Student Portal & Hostel Services System
-- MySQL Schema covering all 40 Services across 6 Modules
-- ============================================================================

DROP DATABASE IF EXISTS student_portal;
CREATE DATABASE student_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_portal;

-- ========================= MODULE 1: AUTHENTICATION =========================

CREATE TABLE users (
    login_id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('student','professor','admin','staff','board_exec','mess_secretary','warden','maintenance','laundry_staff') NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    contact_no VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE credentials (
    login_id INT PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    last_password_changed DATETIME DEFAULT CURRENT_TIMESTAMP,
    fail_count INT DEFAULT 0,
    locked_until DATETIME NULL,
    last_attempt DATETIME NULL,
    FOREIGN KEY (login_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE students (
    login_id INT PRIMARY KEY,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    department VARCHAR(100),
    programme VARCHAR(50),
    year INT,
    blood_group VARCHAR(10),
    home_address TEXT,
    college_address TEXT,
    emergency_contact VARCHAR(20),
    hostel_id INT NULL,
    room_number VARCHAR(10),
    date_of_joining DATE,
    FOREIGN KEY (login_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE professors (
    login_id INT PRIMARY KEY,
    department VARCHAR(100),
    professor_post VARCHAR(100),
    FOREIGN KEY (login_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE admin_staff (
    login_id INT PRIMARY KEY,
    staff_designation VARCHAR(100),
    FOREIGN KEY (login_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE password_reset (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    login_id INT NOT NULL,
    token VARCHAR(128) UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_time DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (login_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE session_tracking (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    login_id INT NOT NULL,
    token VARCHAR(512) NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (login_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE audit_log (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    login_id INT NULL,
    action VARCHAR(100),
    ip_address VARCHAR(64),
    status VARCHAR(30),
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    perm_id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(50),
    resource VARCHAR(100),
    action VARCHAR(50)
);

-- ========================= MODULE 2: COURSE MANAGEMENT =========================

CREATE TABLE courses (
    course_id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    credits INT DEFAULT 3,
    professor_id INT NULL,
    class_slot VARCHAR(50),
    FOREIGN KEY (professor_id) REFERENCES users(login_id) ON DELETE SET NULL
);

CREATE TABLE student_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    semester VARCHAR(20),
    UNIQUE KEY uq_student_course (roll_number, course_id, semester),
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE data_change_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    proof_url VARCHAR(300),
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    remarks TEXT,
    reviewed_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE
);

CREATE TABLE certificate_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    certificate_type ENUM('Bonafide','NOC_Passport','NOC_Internship') NOT NULL,
    purpose TEXT,
    status ENUM('Submitted','UnderReview','Approved','Rejected','Completed') DEFAULT 'Submitted',
    document_url VARCHAR(300),
    approved_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE
);

CREATE TABLE id_card_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    request_type ENUM('Renewal','Replacement') NOT NULL,
    fir_proof_url VARCHAR(300),
    old_details TEXT,
    new_details TEXT,
    transaction_id VARCHAR(100),
    payment_status ENUM('Pending','Paid','Failed') DEFAULT 'Pending',
    dispatch_status ENUM('Submitted','UnderReview','Approved','Dispatched','Delivered','Rejected') DEFAULT 'Submitted',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE
);

CREATE TABLE payments (
    payment_id VARCHAR(40) PRIMARY KEY,
    user_id INT NOT NULL,
    purpose VARCHAR(100),
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(100) UNIQUE,
    status ENUM('Initiated','Paid','Failed','Refunded') DEFAULT 'Initiated',
    paid_at DATETIME NULL,
    reference_id VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(login_id) ON DELETE CASCADE
);

-- ========================= MODULE 3: ACADEMIC RECORDS =========================

CREATE TABLE academic_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    grade VARCHAR(5),
    grade_point DECIMAL(4,2),
    credits INT DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE
);

CREATE TABLE exam_schedule (
    exam_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(20) NOT NULL,
    exam_type ENUM('Quiz','Mid-term','End-term','Lab') NOT NULL,
    exam_day DATE NOT NULL,
    start_time TIME,
    duration_minutes INT DEFAULT 180,
    exam_room_number VARCHAR(20),
    FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE vault (
    file_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    file_name VARCHAR(200),
    file_url VARCHAR(300),
    file_type VARCHAR(50),
    size_kb INT,
    request_id INT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id INT NOT NULL,
    title VARCHAR(200),
    message TEXT,
    type VARCHAR(50),
    reference_id VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES users(login_id) ON DELETE CASCADE
);

-- ========================= MODULE 4: ASSIGNMENT PORTAL =========================

CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(150),
    category ENUM('Cultural','Technical','Sports','Academic','Other') NOT NULL,
    is_free BOOLEAN DEFAULT TRUE,
    fee DECIMAL(10,2) DEFAULT 0.00,
    capacity INT DEFAULT 0,
    created_by INT NULL,
    status ENUM('Draft','Active','Closed','Cancelled') DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(login_id) ON DELETE SET NULL
);

CREATE TABLE event_registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('Registered','Waitlisted','Cancelled') DEFAULT 'Registered',
    payment_status ENUM('NotRequired','Pending','Paid') DEFAULT 'NotRequired',
    transaction_id VARCHAR(100),
    bookmarked BOOLEAN DEFAULT FALSE,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_event_user (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE marketplace_listings (
    listing_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    ad_type ENUM('Sell','Rent','Free') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    asking_price DECIMAL(10,2) DEFAULT 0.00,
    category VARCHAR(50),
    status ENUM('Active','Sold','Closed','Hidden') DEFAULT 'Active',
    contact_email VARCHAR(120),
    contact_phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE item_images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    image_url VARCHAR(300) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (listing_id) REFERENCES marketplace_listings(listing_id) ON DELETE CASCADE
);

CREATE TABLE gate_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    gate_location VARCHAR(50),
    destination VARCHAR(200),
    qr_token VARCHAR(255) UNIQUE,
    out_time DATETIME NULL,
    in_time DATETIME NULL,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE cab_shares (
    share_id INT AUTO_INCREMENT PRIMARY KEY,
    host_id INT NOT NULL,
    source VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    available_seats INT NOT NULL,
    phone_number VARCHAR(20),
    notes VARCHAR(255),
    status ENUM('Active','Full','Archived') DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE cab_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    share_id INT NOT NULL,
    requester_id INT NOT NULL,
    requester_note VARCHAR(255),
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_share_req (share_id, requester_id),
    FOREIGN KEY (share_id) REFERENCES cab_shares(share_id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(login_id) ON DELETE CASCADE
);

-- ========================= MODULE 5: HOSTEL MANAGEMENT =========================

CREATE TABLE hostels (
    hostel_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    total_rooms INT DEFAULT 0,
    warden_name VARCHAR(100),
    warden_contact VARCHAR(20),
    gender ENUM('Male','Female','Coed') DEFAULT 'Coed'
);

ALTER TABLE students ADD CONSTRAINT fk_student_hostel FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id) ON DELETE SET NULL;

CREATE TABLE leave_applications (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_category ENUM('Home','Medical','Emergency','Academic','Other') NOT NULL,
    destination VARCHAR(150),
    reason TEXT,
    status ENUM('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
    warden_remarks TEXT,
    reviewed_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE
);

CREATE TABLE transfer_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    current_hostel_id INT NOT NULL,
    target_hostel_id INT NOT NULL,
    reason TEXT,
    status ENUM('Pending','Approved','Rejected','Cancelled') DEFAULT 'Pending',
    remarks TEXT,
    reviewed_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE,
    FOREIGN KEY (current_hostel_id) REFERENCES hostels(hostel_id),
    FOREIGN KEY (target_hostel_id) REFERENCES hostels(hostel_id)
);

CREATE TABLE mess (
    mess_id INT AUTO_INCREMENT PRIMARY KEY,
    hostel_id INT,
    name VARCHAR(100) NOT NULL,
    caterer_name VARCHAR(100),
    capacity INT DEFAULT 0,
    opi_score DECIMAL(4,2) DEFAULT 0,
    opi_rank INT DEFAULT 0,
    FOREIGN KEY (hostel_id) REFERENCES hostels(hostel_id) ON DELETE SET NULL
);

CREATE TABLE mess_subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    mess_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE,
    FOREIGN KEY (mess_id) REFERENCES mess(mess_id)
);

CREATE TABLE mess_rebates (
    rebate_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    leave_application_id INT NOT NULL,
    start_date DATE,
    end_date DATE,
    status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    approved_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE,
    FOREIGN KEY (leave_application_id) REFERENCES leave_applications(leave_id) ON DELETE CASCADE
);

CREATE TABLE mess_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    mess_id INT NOT NULL,
    meal ENUM('Breakfast','Lunch','Snacks','Dinner') NOT NULL,
    meal_date DATE DEFAULT (CURRENT_DATE),
    meal_rating INT NOT NULL CHECK (meal_rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE,
    FOREIGN KEY (mess_id) REFERENCES mess(mess_id) ON DELETE CASCADE
);

CREATE TABLE mess_opi_monthly (
    opi_id INT AUTO_INCREMENT PRIMARY KEY,
    mess_id INT NOT NULL,
    month_year VARCHAR(10) NOT NULL,
    avg_score DECIMAL(4,2),
    final_opi DECIMAL(4,2),
    opi_rank INT,
    UNIQUE KEY uq_mess_month (mess_id, month_year),
    FOREIGN KEY (mess_id) REFERENCES mess(mess_id) ON DELETE CASCADE
);

CREATE TABLE service_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    service_type ENUM('Cleaning','Laundry') NOT NULL,
    qr_token VARCHAR(128) UNIQUE,
    status ENUM('Requested','Scheduled','InProgress','Ready','Completed','Rejected') DEFAULT 'Requested',
    scheduled_date DATE,
    completed_at DATETIME NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE
);

CREATE TABLE policy_windows (
    policy_id INT AUTO_INCREMENT PRIMARY KEY,
    policy_type ENUM('Leave','MessSubscription','MessRebate','HostelTransfer','RoomCleaning') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    notes VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cleaning_quota (
    id INT AUTO_INCREMENT PRIMARY KEY,
    roll_number VARCHAR(20) NOT NULL,
    period VARCHAR(20) NOT NULL,
    quota_balance INT DEFAULT 4,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_roll_period (roll_number, period),
    FOREIGN KEY (roll_number) REFERENCES students(roll_number) ON DELETE CASCADE
);

-- ========================= MODULE 6: COMPLAINT SYSTEM =========================

CREATE TABLE complaint_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    description VARCHAR(255),
    default_department VARCHAR(80)
);

CREATE TABLE complaint_status (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    status_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    portal_type ENUM('IPM','UPSP','Hostel','General') DEFAULT 'General',
    category_id INT,
    status_id INT DEFAULT 1,
    priority ENUM('Low','Medium','High','Urgent') DEFAULT 'Medium',
    title VARCHAR(200) NOT NULL,
    description TEXT,
    photo_url VARCHAR(300),
    external_ipm_id VARCHAR(50),
    assigned_staff_id INT NULL,
    assigned_by INT NULL,
    assigned_at DATETIME NULL,
    resolution_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(login_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES complaint_categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (status_id) REFERENCES complaint_status(status_id),
    FOREIGN KEY (assigned_staff_id) REFERENCES users(login_id) ON DELETE SET NULL
);

CREATE TABLE complaint_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    old_status_id INT,
    new_status_id INT,
    changed_by INT,
    note TEXT,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE
);

CREATE TABLE complaint_comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    user_id INT NOT NULL,
    user_type VARCHAR(20),
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(login_id) ON DELETE CASCADE
);

CREATE TABLE complaint_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT UNIQUE NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comments TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE
);

-- ========================= MODULE: TESTING (Metadata only) =========================

CREATE TABLE test_runs (
    run_id INT AUTO_INCREMENT PRIMARY KEY,
    test_type ENUM('Unit','Integration','Performance','Security','Regression') NOT NULL,
    module_name VARCHAR(100),
    commit_id VARCHAR(60),
    total_tests INT,
    passed INT,
    failed INT,
    pass_rate DECIMAL(5,2),
    notes TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ========================= INDEXES =========================

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_status ON complaints(status_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_leave_roll ON leave_applications(roll_number);
CREATE INDEX idx_marketplace_status ON marketplace_listings(status);
