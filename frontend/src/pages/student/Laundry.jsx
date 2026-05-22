import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Shirt } from 'lucide-react';

export default function Laundry() {
  const [items, setItems] = useState(null);
  const [qr, setQr] = useState(null);
  const [date, setDate] = useState('');

  async function load() { const r = await api.get('/services/me'); setItems(r.data.filter(x => x.service_type === 'Laundry')); }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    try { const r = await api.post('/services/laundry', { scheduled_date: date || null }); setQr(r.data); toast.success('Created'); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="Laundry" subtitle="Request laundry pickup and get a QR for tracking." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="New laundry request">
          <form onSubmit={create} className="space-y-3">
            <div><label className="label">Scheduled date (optional)</label>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <button className="btn-primary w-full"><Shirt size={14} /> Create</button>
          </form>
          {qr && (
            <div className="mt-5 text-center">
              <img src={qr.qrDataUrl} alt="QR" className="mx-auto rounded-lg border border-slate-200" />
              <p className="text-xs text-slate-500 mt-2">Attach to your laundry bag. Staff will scan to mark Ready.</p>
            </div>
          )}
        </Card>
        <div className="lg:col-span-2">
          <Card title="My requests">
            {items.length === 0 ? <Empty title="No laundry requests" /> : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>#</th><th>Scheduled</th><th>Status</th><th>Created</th><th>Completed</th></tr></thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.request_id}>
                        <td className="font-mono">{r.request_id}</td>
                        <td>{r.scheduled_date || '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>{new Date(r.created_at).toLocaleString()}</td>
                        <td>{r.completed_at ? new Date(r.completed_at).toLocaleString() : '—'}</td>
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
