import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty, Modal } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function Complaints() {
  const nav = useNavigate();
  const [items, setItems] = useState(null);
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', category_id: '', portal_type: 'General', external_ipm_id: '' });
  const [photo, setPhoto] = useState(null);

  async function load() {
    const [a, c] = await Promise.all([api.get('/complaints'), api.get('/complaints/categories')]);
    setItems(a.data); setCats(c.data);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photo) fd.append('photo', photo);
    try {
      const r = await api.post('/complaints', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Complaint submitted');
      setOpen(false);
      setForm({ title: '', description: '', priority: 'Medium', category_id: '', portal_type: 'General', external_ipm_id: '' });
      setPhoto(null); load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="Complaints" subtitle="Submit issues and track resolution."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> New complaint</button>}
      />
      <Card>
        {items.length === 0 ? <Empty title="No complaints yet" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>#</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.complaint_id} className="cursor-pointer hover:bg-slate-50" onClick={() => nav('/student/complaints/' + c.complaint_id)}>
                    <td className="font-mono">#{c.complaint_id}</td>
                    <td className="font-medium">{c.title}</td>
                    <td>{c.category_name || '—'}</td>
                    <td><span className={`badge ${c.priority === 'Urgent' ? 'bg-red-50 text-red-700' : c.priority === 'High' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{c.priority}</span></td>
                    <td><StatusBadge status={c.status_name} /></td>
                    <td className="text-xs text-slate-500">{new Date(c.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New Complaint"
        footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" onClick={submit}>Submit</button></>}>
        <form className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Portal</label>
              <select className="input" value={form.portal_type} onChange={e => setForm({ ...form, portal_type: e.target.value })}>
                <option>General</option><option>Hostel</option><option>UPSP</option><option>IPM</option>
              </select>
            </div>
            <div><label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
              </select>
            </div>
          </div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Select…</option>
              {cats.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </div>
          {form.portal_type === 'IPM' && (
            <div><label className="label">IPM ID</label>
              <input className="input" value={form.external_ipm_id} onChange={e => setForm({ ...form, external_ipm_id: e.target.value })} />
            </div>
          )}
          <div><label className="label">Title</label><input required className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea required className="input" rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="label">Photo (optional)</label><input type="file" accept="image/*" className="input" onChange={e => setPhoto(e.target.files[0])} /></div>
        </form>
      </Modal>
    </>
  );
}
