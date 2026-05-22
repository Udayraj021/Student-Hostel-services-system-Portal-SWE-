import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

export default function Transfer() {
  const [items, setItems] = useState(null);
  const [hostels, setHostels] = useState([]);
  const [form, setForm] = useState({ target_hostel_id: '', reason: '' });

  async function load() {
    const [a, b] = await Promise.all([api.get('/hostel/transfer'), api.get('/hostel/hostels')]);
    setItems(a.data); setHostels(b.data);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try { await api.post('/hostel/transfer', form); toast.success('Request submitted'); setForm({ target_hostel_id: '', reason: '' }); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="Hostel Transfer" subtitle="Request to move to a different hostel." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="New Request">
          <form onSubmit={submit} className="space-y-3">
            <div><label className="label">Target hostel</label>
              <select required className="input" value={form.target_hostel_id} onChange={e => setForm({ ...form, target_hostel_id: e.target.value })}>
                <option value="">Select…</option>
                {hostels.map(h => <option key={h.hostel_id} value={h.hostel_id}>{h.name}</option>)}
              </select>
            </div>
            <div><label className="label">Reason</label><textarea required className="input" rows={4} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
            <button className="btn-primary w-full">Submit</button>
          </form>
        </Card>
        <div className="lg:col-span-2">
          <Card title="My Requests">
            {items.length === 0 ? <Empty title="No transfer requests" /> : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>#</th><th>From</th><th>To</th><th>Status</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.request_id}>
                        <td className="font-mono">{r.request_id}</td>
                        <td>{r.current_hostel_name || r.current_hostel_id}</td>
                        <td>{r.target_hostel_name || r.target_hostel_id}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="text-xs text-slate-500">{r.remarks || '—'}</td>
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
