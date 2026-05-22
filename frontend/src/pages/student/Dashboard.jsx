import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageHeader, Card, Stat, StatusBadge } from '../../components/ui.jsx';
import { CalendarClock, GraduationCap, MessageSquareWarning, Music, Plane, UtensilsCrossed, Bell, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [records, setRecords] = useState({ records: [], cgpa: '0.00' });
  const [notifications, setNotifications] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [events, setEvents] = useState([]);
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/courses/timetable').then(r => setTimetable(r.data)).catch(() => {}),
      api.get('/academic/records').then(r => setRecords(r.data)).catch(() => {}),
      api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {}),
      api.get('/complaints').then(r => setComplaints(r.data)).catch(() => {}),
      api.get('/events').then(r => setEvents(r.data)).catch(() => {}),
      api.get('/hostel/leave').then(r => setLeaves(r.data)).catch(() => {}),
    ]);
  }, []);

  const upcomingEvents = events.slice(0, 3);
  const openComplaints = complaints.filter(c => [1,2,3,4].includes(c.status_id)).length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(' ')[0]} 👋`} subtitle={`${user.department || ''} · ${user.programme || ''} · Roll ${user.roll_number || ''}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="CGPA" value={records.cgpa} sub={`${records.records.length} records`} icon={GraduationCap} />
        <Stat label="Active Courses" value={timetable.length} sub="This semester" icon={CalendarClock} />
        <Stat label="Open Complaints" value={openComplaints} sub="Being tracked" icon={MessageSquareWarning} />
        <Stat label="Unread Notifs" value={unreadNotifs} sub="Recent updates" icon={Bell} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="My Timetable" description="Courses for the current semester" actions={<Link className="text-xs link" to="/student/timetable">View full →</Link>}>
            {timetable.length === 0 ? (
              <p className="text-sm text-slate-500">No courses enrolled for this semester.</p>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Course</th><th>Name</th><th>Slot</th><th>Professor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.map((c) => (
                      <tr key={c.course_id}>
                        <td className="font-mono font-medium">{c.course_id}</td>
                        <td>{c.course_name}</td>
                        <td className="text-slate-600">{c.class_slot}</td>
                        <td className="text-slate-600">{c.professor_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Recent Notifications" actions={<Link className="text-xs link" to="/student/notifications">See all →</Link>}>
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100 -my-2">
                {notifications.slice(0, 5).map((n) => (
                  <li key={n.notification_id} className="py-3 flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${n.is_read ? 'bg-slate-300' : 'bg-brand-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900">{n.title}</p>
                        <span className="text-[11px] text-slate-400">{new Date(n.sent_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Upcoming Events" actions={<Link className="text-xs link" to="/student/events">Browse →</Link>}>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No upcoming events.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((e) => (
                  <li key={e.event_id} className="border border-slate-100 rounded-lg p-3">
                    <div className="text-sm font-semibold text-slate-900">{e.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{new Date(e.event_date).toLocaleString()} · {e.location}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="badge-blue">{e.category}</span>
                      <span className="text-xs text-slate-500">{e.is_free ? 'Free' : `₹${e.fee}`}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Quick Links" padded={false}>
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              {[
                { to: '/student/leave', icon: Plane, label: 'Apply Leave' },
                { to: '/student/complaints', icon: MessageSquareWarning, label: 'New Complaint' },
                { to: '/student/mess', icon: UtensilsCrossed, label: 'Mess' },
                { to: '/student/events', icon: Music, label: 'Events' },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="flex flex-col items-center justify-center gap-2 bg-white p-5 hover:bg-slate-50 transition">
                  <l.icon className="text-brand-600" size={20} />
                  <span className="text-xs font-medium text-slate-700 text-center">{l.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card title="My Complaints" actions={<Link className="text-xs link" to="/student/complaints">All →</Link>}>
            {complaints.length === 0 ? <p className="text-sm text-slate-500">None yet.</p> : (
              <ul className="space-y-2">
                {complaints.slice(0,3).map((c) => (
                  <li key={c.complaint_id} className="text-sm flex items-center justify-between gap-2">
                    <span className="truncate">#{c.complaint_id} {c.title}</span>
                    <StatusBadge status={c.status_name} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
