import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

export default function Leave() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ start_date: '', end_date: '', leave_category: 'Home', destination: '', reason: '' });

  async function load() { const r = await api.get('/hostel/leave'); setItems(r.data); }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try { await api.post('/hostel/leave', form); toast.success('Leave submitted'); setForm({ start_date: '', end_date: '', leave_category: 'Home', destination: '', reason: '' }); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function cancel(id) { if (!confirm('Cancel this leave?')) return; await api.delete('/hostel/leave/' + id); toast.success('Cancelled'); load(); }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="Leave Applications" subtitle="Apply for hostel leave and track approval status." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="New Leave">
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Start</label><input type="date" required className="input" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><label className="label">End</label><input type="date" required className="input" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><label className="label">Category</label>
              <select className="input" value={form.leave_category} onChange={e => setForm({ ...form, leave_category: e.target.value })}>
                <option>Home</option><option>Medical</option><option>Emergency</option><option>Academic</option><option>Other</option>
              </select>
            </div>
            <div><label className="label">Destination</label><input className="input" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} /></div>
            <div><label className="label">Reason</label><textarea className="input" rows={3} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
            <button className="btn-primary w-full">Apply</button>
          </form>
        </Card>
        <div className="lg:col-span-2">
          <Card title="My Leaves">
            {items.length === 0 ? <Empty title="No leave requests" /> : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>#</th><th>Period</th><th>Category</th><th>Status</th><th>Remarks</th><th></th></tr></thead>
                  <tbody>
                    {items.map(l => (
                      <tr key={l.leave_id}>
                        <td className="font-mono">{l.leave_id}</td>
                        <td>{l.start_date} → {l.end_date}</td>
                        <td>{l.leave_category}</td>
                        <td><StatusBadge status={l.status} /></td>
                        <td className="text-xs text-slate-500">{l.warden_remarks || '—'}</td>
                        <td>{l.status === 'Pending' && <button className="btn-danger btn-sm" onClick={() => cancel(l.leave_id)}>Cancel</button>}</td>
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
