# Student Portal & Hostel Services System

A professional full-stack implementation of the **40-service Student Portal & Hostel Services System** specified in `SWE_40_Services_Documentation.pdf` and `SWE_Project_SRS.pdf`.

Built with **React (Vite + Tailwind)**, **Node.js (Express)** and **MySQL**.

The system covers **6 functional modules** spanning authentication, academics, campus life, hostel operations, complaints & administration, organised into **40 discrete services** with role-based access for students, faculty, administrators, wardens, maintenance staff, mess secretaries, board executives and laundry operators.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Features (40 Services)](#features-40-services)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Setup](#setup)
7. [Running the system](#running-the-system)
8. [Demo credentials](#demo-credentials)
9. [API overview](#api-overview)
10. [Security](#security)
11. [Troubleshooting](#troubleshooting)

---

## Architecture

```
                 ┌──────────────────────┐
                 │     React SPA        │
                 │  (Vite + Tailwind)   │
                 │    localhost:5173    │
                 └─────────┬────────────┘
                           │  JSON + JWT (Authorization header)
                           ▼
                 ┌──────────────────────┐
                 │   Express REST API   │
                 │    localhost:5000    │
                 │  - Auth (JWT+bcrypt) │
                 │  - RBAC middleware   │
                 │  - 17 route modules  │
                 └─────────┬────────────┘
                           │ mysql2/promise pool
                           ▼
                 ┌──────────────────────┐
                 │      MySQL DB        │
                 │  40+ tables, FKs,    │
                 │  indexes, ENUMs      │
                 └──────────────────────┘
```

---

## Features (40 Services)

### Module 1 — Authentication
1. **UserLoginService** – email/password, bcrypt verification, JWT issue
2. **PasswordResetService** – token-based email reset flow
3. **SessionManagementService** – multi-device sessions, idle timeout, revocation
4. **AccountLockoutService** – fail-count tracking, time-based lockout
5. **AuditLogService** – tamper-evident security log

### Module 2 — Course & Identity
6. **TimetableService** – personalised class schedule
7. **CourseUpdateService** – add/edit/delete courses (admin / professor)
8. **StudentProfileService** – directory profile management
9. **DocumentVaultService** – secure document storage per student
10. **DataChangeRequestService** – workflow for editing restricted fields with proof
11. **CertificateRequestService** – bonafide / transcript / NOC issuance
12. **IDCardService** – new / replacement / renewal with fees
13. **FeePaymentService** – simulated gateway for ID cards & events

### Module 3 — Academic Records
14. **ExamScheduleService** – student exam calendar
15. **AcademicRecordService** – grades, credits, CGPA
16. **NotificationService** – event-driven, in-app notifications

### Module 4 — Assignment Portal (Campus life)
17. **EventRegistrationService** – browse / register / cancel / bookmark
18. **EventPublishingService** – board-exec CRUD over events
19. **MarketplaceService** – peer-to-peer listings (sell / rent / free)
20. **GateLogQRService** – QR-based gate entry/exit log
21. **CabSharingService** – post rides, request to join, decide

### Module 5 — Hostel
22. **StudentVoteService** (leveraged via polls) – see event_registrations
23. **LeaveApplicationService** – policy-window gated leave flow with warden decision
24. **HostelTransferService** – policy-window gated transfer with auto room reassignment
25. **MessSubscriptionService** – monthly mess allocation
26. **MessRebateService** – rebate request with dates & reason
27. **MessFeedbackService** – per-meal rating & comments, OPI rollup
28. **RoomCleaningService** – monthly quota-based scheduling
29. **PolicyWindowService** – admin controls eligibility windows
30. **LaundryQRService** – service token + mark-ready workflow

### Module 6 — Complaints & Ops
31. **ComplaintSubmissionService** – category, priority, optional photo
32. **ComplaintAssignmentService** – manual or auto-assign (least-loaded)
33. **ComplaintTrackingService** – timeline, comments, feedback
34. **ComplaintStatusUpdateService** – status workflow with history
35. **FeedbackService** – post-resolution ratings

### Module 7 — Quality
36. **IntegrationTestService**
37. **UnitTestService**
38. **PerformanceTestService**
39. **SecurityTestService**
40. **RegressionTestService** – all consumed via the admin *Test Dashboard*

---

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, Vite 5, React Router 6, Tailwind CSS 3, Axios, react-hot-toast, lucide-react |
| Backend  | Node.js, Express 4, mysql2/promise, jsonwebtoken, bcryptjs, multer, qrcode, uuid |
| Database | MySQL 8 |

---

## Project Structure

```
submission/
├── backend/
│   ├── config/db.js              # MySQL pool + helpers
│   ├── middleware/auth.js        # JWT, session, RBAC
│   ├── routes/                   # 17 modular route files
│   │   ├── auth.js admin.js courses.js academic.js
│   │   ├── vault.js notifications.js events.js
│   │   ├── marketplace.js gate.js cab.js hostel.js
│   │   ├── mess.js services.js complaints.js
│   │   ├── payments.js requests.js tests.js
│   ├── utils/helpers.js          # notify, audit, asyncHandler
│   ├── db/
│   │   ├── schema.sql            # full DDL
│   │   ├── seed.sql              # reference data
│   │   ├── init-db.js            # runs schema+seed
│   │   └── seed.js               # demo users & students
│   ├── uploads/                  # user-uploaded files
│   ├── server.js                 # Express entrypoint
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/client.js         # Axios with interceptors
│   │   ├── context/AuthContext.jsx
│   │   ├── components/           # Layout, ui.jsx
│   │   ├── pages/
│   │   │   ├── auth/             # Login, Forgot, Reset
│   │   │   ├── student/          # 23 student pages
│   │   │   ├── admin/            # 8 admin pages
│   │   │   ├── warden/           # Leave & transfer
│   │   │   ├── staff/            # Assigned complaints
│   │   │   └── professor/        # Faculty dashboard
│   │   ├── styles/index.css
│   │   ├── App.jsx  main.jsx
│   ├── index.html
│   ├── vite.config.js tailwind.config.js postcss.config.js
│   └── package.json
│
└── README.md (this file)
```

---

## Prerequisites

- **Node.js 18+** and **npm**
- **MySQL 8+** running locally (or accessible over network)

---

## Setup

### 1. Clone & install

```bash
# From the submission/ root
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Then open `.env` in an editor and set `DB_USER`, `DB_PASSWORD`, and `JWT_SECRET`.

**Do not** paste the phrase `edit DB creds` (or any extra words) on the same line as `cp` without a leading `#`. If you run `cp .env.example .env edit DB creds`, the shell treats `edit`, `DB`, and `creds` as extra filenames and `creds` as the destination folder, which produces `cp: creds: Not a directory`.

Key variables:

| Var | Purpose | Default |
|-----|---------|---------|
| `PORT` | API port | 5000 |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL connection | — |
| `JWT_SECRET` | HMAC secret for JWT | change-me |
| `BCRYPT_ROUNDS` | bcrypt cost | 10 |
| `MAX_FAILED_ATTEMPTS` / `LOCKOUT_MINUTES` | Account lockout | 5 / 15 |
| `SESSION_IDLE_MINUTES` | Session idle timeout | 30 |
| `UPLOAD_DIR` | Where Multer saves files | ./uploads |

### 3. Create the database

Log in to MySQL and create an empty database:

```sql
CREATE DATABASE student_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Initialise schema & reference data

```bash
cd backend
npm run db:init       # runs schema.sql then seed.sql (reference data only)
```

### 5. Seed demo users & students

```bash
npm run db:seed       # creates admin, wardens, staff, professors, students
```

The seeder prints the full credential list at the end.

---

## Running the system

Open two terminals:

```bash
# Terminal 1 – backend
cd backend
npm run dev           # nodemon on :5000
```

```bash
# Terminal 2 – frontend
cd frontend
npm run dev           # Vite on :5173 (proxies /api → :5000)
```

Open **http://localhost:5173** and sign in.

---

## Demo credentials

Created by `npm run db:seed`:

| Role            | Email                         | Password     |
|-----------------|-------------------------------|--------------|
| Admin           | admin@iitg.ac.in              | admin@123    |
| Admin           | sa.admin@iitg.ac.in           | admin@123    |
| Warden          | warden.kameng@iitg.ac.in      | warden@123   |
| Mess Secretary  | mess.sec@iitg.ac.in           | mess@123     |
| Board Exec      | boardexec@iitg.ac.in          | board@123    |
| Maintenance     | maint1@iitg.ac.in             | staff@123    |
| Laundry Staff   | laundry@iitg.ac.in            | laundry@123  |
| Professor       | pkdas@iitg.ac.in              | prof@123     |
| Student         | aarav.sharma@iitg.ac.in       | student@123  |
| Student         | priya.patel@iitg.ac.in        | student@123  |

Each role lands on its own dashboard after login (see `App.jsx > HomeRedirect`).

---

## API overview

All endpoints are prefixed with `/api`. Protected routes require `Authorization: Bearer <JWT>`.

| Prefix            | Main responsibilities                                  |
|-------------------|--------------------------------------------------------|
| `/auth`           | Login, logout, sessions, forgot/reset/change password, audit |
| `/admin`          | User CRUD, unlock, dashboard stats                     |
| `/courses`        | Timetable, course catalog, enrolment, exam schedule    |
| `/academic`       | Profile view/edit, academic records, CGPA              |
| `/vault`          | Document upload/list/delete                            |
| `/notifications`  | List, unread count, read, broadcast                    |
| `/events`         | Browse, CRUD (board), register/cancel/bookmark         |
| `/marketplace`    | P2P listings with images                               |
| `/gate`           | QR generation, scan, historical logs                   |
| `/cab`            | Host, request, decide cab shares                       |
| `/hostel`         | Hostel list, leave, transfer, policies                 |
| `/mess`           | Subscription, rebate, feedback, summaries              |
| `/services`       | Cleaning quota & bookings, laundry QR                  |
| `/complaints`     | Submit/track/assign/update/comment/feedback            |
| `/payments`       | Initiate/confirm simulated payments, history           |
| `/requests`       | Data change, certificate & ID card requests            |
| `/tests`          | Record & summarise test runs (5 test types)            |

Full endpoint list lives alongside the route files in `backend/routes/`.

---

## Security

- **Passwords** are hashed with **bcrypt** (`BCRYPT_ROUNDS`).
- **JWTs** signed with `JWT_SECRET`; session revocation is enforced on every request (`session_tracking.revoked`).
- **Account lockout** after `MAX_FAILED_ATTEMPTS` failures for `LOCKOUT_MINUTES`.
- **Session idle timeout** configurable via `SESSION_IDLE_MINUTES`.
- **RBAC** middleware (`requireRole(...)`) gates every privileged endpoint.
- **Audit log** records every auth / admin event with user, IP and status.
- **File uploads** sanitised for filename and restricted by size (`MAX_FILE_SIZE_MB`).

---

## Scripts reference

### Backend (`backend/package.json`)

| Script        | What it does                            |
|---------------|------------------------------------------|
| `npm run dev`     | Start API in watch mode (nodemon)       |
| `npm start`       | Start API in production mode            |
| `npm run db:init` | Drop/recreate schema + reference data   |
| `npm run db:seed` | Insert demo users, students & records   |

### Frontend (`frontend/package.json`)

| Script          | What it does                     |
|-----------------|----------------------------------|
| `npm run dev`   | Vite dev server on :5173         |
| `npm run build` | Production bundle in `dist/`     |
| `npm run preview` | Serve `dist/` on :4173         |

---

## Testing the flow end-to-end

1. Run `npm run db:init && npm run db:seed` in `backend/`.
2. Start both servers (`npm run dev` in each).
3. Log in as **Aarav (student)** → explore timetable, records, submit a complaint, apply leave.
4. Log in as **Admin** → approve certificate requests, assign complaints, open/close policy windows, record test runs.
5. Log in as **Warden** → approve the leave/transfer applications.
6. Log in as **Staff** → view assigned complaints, change their status.
7. Log in as **Professor** → see teaching courses and upcoming exams.

Every status change notifies the relevant party via the in-app notification service.

---

## Troubleshooting

### `cp: creds: Not a directory`

You ran `cp` with extra arguments (often `edit DB creds` without `#`). Use exactly:

```bash
cp .env.example .env
```

### `Database init failed` (empty or cryptic message)

- Start **MySQL** (e.g. System Settings → MySQL, or `brew services start mysql`).
- In `backend/.env`, set `DB_PASSWORD` to your real MySQL root (or app user) password. An empty password only works if MySQL allows that user with no password.
- The init script needs permission to run `DROP DATABASE` / `CREATE DATABASE` for `student_portal`. Run `npm run db:init` again after fixing `.env`; the console now prints `code`, `errno`, and `sqlMessage` when available.

### `EADDRINUSE: address already in use :::5000`

Something else is bound to port **5000** (often AirPlay Receiver on macOS, or a leftover `node` / `nodemon`).

1. See what is using it: `lsof -nP -iTCP:5000 | grep LISTEN`
2. Stop that process: `kill <PID>` (or quit the other app).
3. Or run the API on another port: in `backend/.env` set `PORT=5001`. In `frontend/` create `.env.development` with `VITE_PROXY_TARGET=http://localhost:5001` so Vite’s proxy still reaches the API.

---

## License

Academic project — developed from the SWE assignment SRS / service catalogue.  Use freely for learning and coursework.
