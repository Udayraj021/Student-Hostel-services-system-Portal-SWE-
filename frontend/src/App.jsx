import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/auth/Login.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

import StudentDashboard from './pages/student/Dashboard.jsx';
import Timetable from './pages/student/Timetable.jsx';
import Exams from './pages/student/Exams.jsx';
import AcademicRecords from './pages/student/AcademicRecords.jsx';
import Profile from './pages/student/Profile.jsx';
import Vault from './pages/student/Vault.jsx';
import Certificates from './pages/student/Certificates.jsx';
import IDCard from './pages/student/IDCard.jsx';
import DataChange from './pages/student/DataChange.jsx';
import Events from './pages/student/Events.jsx';
import Marketplace from './pages/student/Marketplace.jsx';
import GatePass from './pages/student/GatePass.jsx';
import CabShare from './pages/student/CabShare.jsx';
import Leave from './pages/student/Leave.jsx';
import Transfer from './pages/student/Transfer.jsx';
import Mess from './pages/student/Mess.jsx';
import Laundry from './pages/student/Laundry.jsx';
import Cleaning from './pages/student/Cleaning.jsx';
import Complaints from './pages/student/Complaints.jsx';
import ComplaintDetail from './pages/student/ComplaintDetail.jsx';
import Notifications from './pages/student/Notifications.jsx';
import Payments from './pages/student/Payments.jsx';
import Sessions from './pages/student/Sessions.jsx';

import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminRequests from './pages/admin/Requests.jsx';
import AdminComplaints from './pages/admin/Complaints.jsx';
import AdminEvents from './pages/admin/Events.jsx';
import AdminPolicies from './pages/admin/Policies.jsx';
import AdminTests from './pages/admin/Tests.jsx';
import AdminAudit from './pages/admin/Audit.jsx';

import WardenLeave from './pages/warden/Leave.jsx';

import StaffComplaints from './pages/staff/Complaints.jsx';

import ProfessorDashboard from './pages/professor/Dashboard.jsx';

function RequireAuth({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        {/* Default route by role */}
        <Route index element={<HomeRedirect />} />

        {/* Student routes */}
        <Route path="student">
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="exams" element={<Exams />} />
          <Route path="records" element={<AcademicRecords />} />
          <Route path="profile" element={<Profile />} />
          <Route path="vault" element={<Vault />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="idcard" element={<IDCard />} />
          <Route path="data-change" element={<DataChange />} />
          <Route path="events" element={<Events />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="gate" element={<GatePass />} />
          <Route path="cab" element={<CabShare />} />
          <Route path="leave" element={<Leave />} />
          <Route path="transfer" element={<Transfer />} />
          <Route path="mess" element={<Mess />} />
          <Route path="laundry" element={<Laundry />} />
          <Route path="cleaning" element={<Cleaning />} />
          <Route path="complaints" element={<Complaints />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="payments" element={<Payments />} />
          <Route path="sessions" element={<Sessions />} />
        </Route>

        {/* Admin */}
        <Route path="admin" element={<RequireAuth roles={['admin']}><></></RequireAuth>}>
        </Route>
        <Route path="admin/dashboard" element={<RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>} />
        <Route path="admin/users" element={<RequireAuth roles={['admin']}><AdminUsers /></RequireAuth>} />
        <Route path="admin/requests" element={<RequireAuth roles={['admin']}><AdminRequests /></RequireAuth>} />
        <Route path="admin/complaints" element={<RequireAuth roles={['admin']}><AdminComplaints /></RequireAuth>} />
        <Route path="admin/complaints/:id" element={<RequireAuth roles={['admin','staff']}><ComplaintDetail admin /></RequireAuth>} />
        <Route path="admin/events" element={<RequireAuth roles={['admin','board_exec']}><AdminEvents /></RequireAuth>} />
        <Route path="admin/policies" element={<RequireAuth roles={['admin']}><AdminPolicies /></RequireAuth>} />
        <Route path="admin/tests" element={<RequireAuth roles={['admin']}><AdminTests /></RequireAuth>} />
        <Route path="admin/audit" element={<RequireAuth roles={['admin']}><AdminAudit /></RequireAuth>} />

        {/* Warden */}
        <Route path="warden/leave" element={<RequireAuth roles={['warden','admin']}><WardenLeave /></RequireAuth>} />
        <Route path="warden/transfer" element={<RequireAuth roles={['warden','admin']}><WardenLeave type="transfer" /></RequireAuth>} />

        {/* Staff */}
        <Route path="staff/complaints" element={<RequireAuth roles={['staff','admin']}><StaffComplaints /></RequireAuth>} />
        <Route path="staff/complaints/:id" element={<RequireAuth roles={['staff','admin']}><ComplaintDetail admin /></RequireAuth>} />

        {/* Professor */}
        <Route path="professor/dashboard" element={<RequireAuth roles={['professor']}><ProfessorDashboard /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'warden') return <Navigate to="/warden/leave" replace />;
  if (user.role === 'staff') return <Navigate to="/staff/complaints" replace />;
  if (user.role === 'professor') return <Navigate to="/professor/dashboard" replace />;
  if (user.role === 'board_exec') return <Navigate to="/admin/events" replace />;
  if (user.role === 'mess_secretary') return <Navigate to="/student/mess" replace />;
  if (user.role === 'laundry_staff') return <Navigate to="/staff/complaints" replace />;
  return <Navigate to="/student/dashboard" replace />;
}
