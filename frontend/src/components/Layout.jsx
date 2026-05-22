import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import {
  LayoutDashboard, CalendarClock, GraduationCap, FileText, ShieldCheck, LogOut, Menu, X, Bell,
  UserCircle2, BookOpen, FolderLock, Award, Contact, FileEdit, Music, Store, QrCode, Car,
  Plane, Building2, UtensilsCrossed, Shirt, Sparkles, MessageSquareWarning, CreditCard, Monitor,
  Users2, ClipboardList, Megaphone, GanttChartSquare, Activity, History, Settings2
} from 'lucide-react';

const studentNav = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { section: 'Academics' },
  { to: '/student/timetable', icon: CalendarClock, label: 'Timetable' },
  { to: '/student/exams', icon: GraduationCap, label: 'Exam Schedule' },
  { to: '/student/records', icon: BookOpen, label: 'Academic Records' },
  { to: '/student/profile', icon: UserCircle2, label: 'My Profile' },
  { section: 'Requests & Docs' },
  { to: '/student/vault', icon: FolderLock, label: 'Document Vault' },
  { to: '/student/certificates', icon: Award, label: 'Certificates' },
  { to: '/student/idcard', icon: Contact, label: 'ID Card' },
  { to: '/student/data-change', icon: FileEdit, label: 'Data Change' },
  { section: 'Campus Life' },
  { to: '/student/events', icon: Music, label: 'Events' },
  { to: '/student/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/student/gate', icon: QrCode, label: 'Gate Pass (QR)' },
  { to: '/student/cab', icon: Car, label: 'Cab Sharing' },
  { section: 'Hostel' },
  { to: '/student/leave', icon: Plane, label: 'Leave Application' },
  { to: '/student/transfer', icon: Building2, label: 'Hostel Transfer' },
  { to: '/student/mess', icon: UtensilsCrossed, label: 'Mess & Rebate' },
  { to: '/student/laundry', icon: Shirt, label: 'Laundry' },
  { to: '/student/cleaning', icon: Sparkles, label: 'Room Cleaning' },
  { section: 'Support' },
  { to: '/student/complaints', icon: MessageSquareWarning, label: 'Complaints' },
  { to: '/student/payments', icon: CreditCard, label: 'Payments' },
  { to: '/student/sessions', icon: Monitor, label: 'Active Sessions' },
];

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users2, label: 'Users' },
  { to: '/admin/requests', icon: ClipboardList, label: 'Requests' },
  { to: '/admin/complaints', icon: MessageSquareWarning, label: 'Complaints' },
  { to: '/admin/events', icon: Music, label: 'Events' },
  { to: '/admin/policies', icon: Settings2, label: 'Policy Windows' },
  { to: '/admin/tests', icon: Activity, label: 'Test Dashboard' },
  { to: '/admin/audit', icon: History, label: 'Audit Log' },
  { to: '/warden/leave', icon: Plane, label: 'Leave Approvals' },
];

const wardenNav = [
  { to: '/warden/leave', icon: Plane, label: 'Leave Applications' },
  { to: '/warden/transfer', icon: Building2, label: 'Transfer Requests' },
];

const staffNav = [
  { to: '/staff/complaints', icon: MessageSquareWarning, label: 'Assigned Complaints' },
];

const profNav = [
  { to: '/professor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

const boardNav = [
  { to: '/admin/events', icon: Music, label: 'Events' },
];

const messSecNav = [
  { to: '/student/mess', icon: UtensilsCrossed, label: 'Mess Operations' },
];

function roleNav(role) {
  if (role === 'admin') return adminNav;
  if (role === 'warden') return wardenNav;
  if (role === 'staff') return staffNav;
  if (role === 'professor') return profNav;
  if (role === 'board_exec') return boardNav;
  if (role === 'mess_secretary') return messSecNav;
  if (role === 'laundry_staff') return staffNav;
  return studentNav;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await api.get('/notifications/unread-count');
        setUnread(r.data.count);
      } catch {}
    };
    fetch();
    const t = setInterval(fetch, 30000);
    return () => clearInterval(t);
  }, []);

  const nav = roleNav(user.role);

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transition-transform duration-200 flex flex-col`}>
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-bold shadow-md">SP</div>
            <div>
              <div className="font-bold text-slate-900 leading-tight">Student Portal</div>
              <div className="text-[11px] text-slate-500">Hostel Services System</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {nav.map((item, i) => item.section ? (
            <div key={'s'+i} className="px-2 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.section}</div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <item.icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-semibold shrink-0">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user.role.replace('_',' ')}</div>
            </div>
            <button onClick={async () => { await logout(); navigate('/login'); }} className="p-2 rounded-lg text-slate-500 hover:bg-slate-50" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-900">{user.name.split(' ')[0]}</span></div>
          <div className="ml-auto flex items-center gap-2">
            <NavLink to="/student/notifications" className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-50">
              <Bell size={20} />
              {unread > 0 && <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">{unread}</span>}
            </NavLink>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
