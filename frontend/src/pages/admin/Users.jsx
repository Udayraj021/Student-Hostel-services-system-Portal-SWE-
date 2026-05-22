import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Modal, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { UserPlus, Lock, Unlock, Search } from 'lucide-react';

const ROLES = ['student','professor','admin','warden','staff','board_exec','mess_secretary','laundry_staff'];

export default function Users() {
  const [users, setUsers] = useState(null);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ role: 'student', name: '', email: '', contact_no: '', password: 'ChangeMe@123', extra: {} });

  async function load() {
    const r = await api.get('/admin/users', { params: { role: role || undefined, q: q || undefined } });
    setUsers(r.data);
  }
  useEffect(() => { load(); }, [role]);

  async function createUser(e) {
    e.preventDefault();
    try {
      await api.post('/admin/users', form);
      toast.success('User created');
      setShowNew(false);
      setForm({ role: 'student', name: '', email: '', contact_no: '', password: 'ChangeMe@123', extra: {} });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  }

  async function toggleActive(u) {
    await api.patch(`/admin/users/${u.login_id}`, { is_active: !u.is_active });
    toast.success(u.is_active ? 'Deactivated' : 'Activated');
    load();
  }

  async function unlock(u) {
    await api.post(`/admin/users/${u.login_id}/unlock`);
    toast.success('Account unlocked');
    load();
  }

  return (
    <>
      <PageHeader
        title="User management"
        subtitle="Manage all system users: students, faculty, staff and admins."
        actions={<button className="btn-primary" onClick={() => setShowNew(true)}><UserPlus size={14}/> New user</button>}
      />

      <Card>
        <div className="flex gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[220px]">
            <Search size={16} className="text-slate-400" />
            <input className="input" placeholder="Search by name or email…" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          </div>
          <select className="input max-w-[180px]" value={role} onChange={e => setRole(e.target.value)}>
            <option value="">All roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {!users ? <Loading /> : users.length === 0 ? <Empty title="No users found" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Contact</th><th>Status</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.login_id}>
                    <td className="font-mono text-xs">{u.login_id}</td>
                    <td className="font-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-slate capitalize">{u.role.replace('_',' ')}</span></td>
                    <td>{u.contact_no || '—'}</td>
                    <td>{u.is_active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Inactive</span>}</td>
                    <td className="text-xs text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button className="btn-secondary btn-sm" onClick={() => unlock(u)} title="Unlock"><Unlock size={12}/></button>
                        <button className={u.is_active ? 'btn-danger btn-sm' : 'btn-primary btn-sm'} onClick={() => toggleActive(u)} title={u.is_active ? 'Deactivate' : 'Activate'}>
                          {u.is_active ? <Lock size={12}/> : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Create new user"
        footer={<><button className="btn-secondary" onClick={() => setShowNew(false)}>Cancel</button><button className="btn-primary" form="new-user">Create</button></>}
      >
        <form id="new-user" onSubmit={createUser} className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div><label className="label">Name</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Contact</label><input className="input" value={form.contact_no} onChange={e => setForm({ ...form, contact_no: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Initial password</label><input className="input" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>

          {form.role === 'student' && (
            <>
              <div><label className="label">Roll number</label><input className="input" required onChange={e => setForm({ ...form, extra: { ...form.extra, roll_number: e.target.value }})} /></div>
              <div><label className="label">Department</label><input className="input" onChange={e => setForm({ ...form, extra: { ...form.extra, department: e.target.value }})} /></div>
              <div><label className="label">Programme</label><input className="input" placeholder="B.Tech CSE" onChange={e => setForm({ ...form, extra: { ...form.extra, programme: e.target.value }})} /></div>
              <div><label className="label">Year</label><input className="input" type="number" onChange={e => setForm({ ...form, extra: { ...form.extra, year: e.target.value }})} /></div>
            </>
          )}
          {form.role === 'professor' && (
            <>
              <div><label className="label">Department</label><input className="input" onChange={e => setForm({ ...form, extra: { ...form.extra, department: e.target.value }})} /></div>
              <div><label className="label">Post</label><input className="input" onChange={e => setForm({ ...form, extra: { ...form.extra, professor_post: e.target.value }})} /></div>
            </>
          )}
        </form>
      </Modal>
    </>
  );
}
