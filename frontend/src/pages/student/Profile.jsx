import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Loading } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => { api.get('/academic/profile').then(r => setProfile(r.data)).catch(() => {}); }, []);

  async function changePassword(e) {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', pwd);
      toast.success('Password changed');
      setPwd({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed');
    }
  }

  if (!profile) return <Loading />;

  const fields = [
    ['Name', profile.name],
    ['Roll Number', profile.roll_number],
    ['Email', profile.email],
    ['Contact', profile.contact_no],
    ['Department', profile.department],
    ['Programme', profile.programme],
    ['Year', profile.year],
    ['Blood Group', profile.blood_group],
    ['Hostel', profile.hostel_name],
    ['Room Number', profile.room_number],
    ['Home Address', profile.home_address],
    ['College Address', profile.college_address],
    ['Emergency Contact', profile.emergency_contact],
    ['Date of Joining', profile.date_of_joining],
  ];

  return (
    <>
      <PageHeader title="My Profile" subtitle="Read-only view. Submit a Data Change request for updates." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Personal Details">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {fields.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
                  <dd className="text-sm text-slate-900 mt-0.5">{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
        <div>
          <Card title="Change Password">
            <form onSubmit={changePassword} className="space-y-3">
              <div><label className="label">Current password</label>
                <input type="password" required className="input" value={pwd.currentPassword} onChange={e => setPwd({ ...pwd, currentPassword: e.target.value })} />
              </div>
              <div><label className="label">New password (min 8)</label>
                <input type="password" required minLength={8} className="input" value={pwd.newPassword} onChange={e => setPwd({ ...pwd, newPassword: e.target.value })} />
              </div>
              <button className="btn-primary w-full"><Lock size={14} /> Update password</button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
