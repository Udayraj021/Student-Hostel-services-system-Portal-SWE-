import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

export default function IDCard() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ request_type: 'Renewal', old_details: '', new_details: '' });
  const [file, setFile] = useState(null);

  async function load() { const r = await api.get('/requests/idcard'); setItems(r.data); }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('fir_proof', file);
    try {
      await api.post('/requests/idcard', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Request submitted');
      setForm({ request_type: 'Renewal', old_details: '', new_details: '' }); setFile(null); load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function pay(id) {
    try {
      const init = await api.post('/payments/initiate', { amount: 200, purpose: 'idcard', reference_id: id });
      await api.post('/payments/' + init.data.payment_id + '/confirm');
      toast.success('Payment complete');
      load();
    } catch (err) { toast.error('Payment failed'); }
  }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="ID Card" subtitle="Request renewal or replacement of your student ID card." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="New Request">
          <form onSubmit={submit} className="space-y-3">
            <div><label className="label">Type</label>
              <select className="input" value={form.request_type} onChange={e => setForm({ ...form, request_type: e.target.value })}>
                <option value="Renewal">Renewal</option>
                <option value="Replacement">Replacement (lost/damaged)</option>
              </select>
            </div>
            <div><label className="label">Old details</label>
              <textarea className="input" rows={2} value={form.old_details} onChange={e => setForm({ ...form, old_details: e.target.value })} placeholder="Old ID number, last known details" />
            </div>
            <div><label className="label">New details</label>
              <textarea className="input" rows={2} value={form.new_details} onChange={e => setForm({ ...form, new_details: e.target.value })} placeholder="Updated info (if replacement)" />
            </div>
            <div><label className="label">FIR / Proof (PDF / image)</label>
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
                  <thead><tr><th>#</th><th>Type</th><th>Payment</th><th>Dispatch</th><th>Created</th><th></th></tr></thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.request_id}>
                        <td className="font-mono">{r.request_id}</td>
                        <td>{r.request_type}</td>
                        <td><StatusBadge status={r.payment_status} /></td>
                        <td><StatusBadge status={r.dispatch_status} /></td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="flex justify-end gap-2">
                          {r.payment_status === 'Pending' && <button onClick={() => pay(r.request_id)} className="btn-primary btn-sm">Pay ₹200</button>}
                        </td>
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
