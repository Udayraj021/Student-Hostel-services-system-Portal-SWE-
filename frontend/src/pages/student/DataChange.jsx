import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

export default function DataChange() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ field_name: 'home_address', old_value: '', new_value: '' });
  const [file, setFile] = useState(null);

  async function load() { const r = await api.get('/requests/data-change'); setItems(r.data); }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('proof', file);
    try {
      await api.post('/requests/data-change', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Request submitted'); setForm({ field_name: 'home_address', old_value: '', new_value: '' }); setFile(null); load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="Data Change Requests" subtitle="Request updates to your personal data with proof documents." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="New Request">
          <form onSubmit={submit} className="space-y-3">
            <div><label className="label">Field</label>
              <select className="input" value={form.field_name} onChange={e => setForm({ ...form, field_name: e.target.value })}>
                <option value="home_address">Home Address</option>
                <option value="college_address">College Address</option>
                <option value="emergency_contact">Emergency Contact</option>
                <option value="blood_group">Blood Group</option>
                <option value="contact_no">Contact Number</option>
              </select>
            </div>
            <div><label className="label">Old value</label>
              <input className="input" value={form.old_value} onChange={e => setForm({ ...form, old_value: e.target.value })} />
            </div>
            <div><label className="label">New value</label>
              <input className="input" value={form.new_value} onChange={e => setForm({ ...form, new_value: e.target.value })} required />
            </div>
            <div><label className="label">Proof</label>
              <input type="file" className="input" onChange={e => setFile(e.target.files[0])} />
            </div>
            <button className="btn-primary w-full">Submit</button>
          </form>
        </Card>
        <div className="lg:col-span-2">
          <Card title="My Requests">
            {items.length === 0 ? <Empty title="No requests yet" /> : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Field</th><th>New value</th><th>Status</th><th>Remarks</th><th>Created</th></tr></thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.request_id}>
                        <td className="font-mono text-xs">{r.field_name}</td>
                        <td>{r.new_value}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="text-xs text-slate-500">{r.remarks || '—'}</td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
