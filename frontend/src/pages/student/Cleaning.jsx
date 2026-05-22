import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty, Stat } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

export default function Cleaning() {
  const [items, setItems] = useState(null);
  const [quota, setQuota] = useState(null);
  const [form, setForm] = useState({ scheduled_date: '', notes: '' });

  async function load() {
    const [a, q] = await Promise.all([api.get('/services/me'), api.get('/services/cleaning/quota')]);
    setItems(a.data.filter(x => x.service_type === 'Cleaning')); setQuota(q.data);
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try { await api.post('/services/cleaning', form); toast.success('Scheduled'); setForm({ scheduled_date: '', notes: '' }); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  if (!items || !quota) return <Loading />;

  return (
    <>
      <PageHeader title="Room Cleaning" subtitle="Book a free room cleaning service. Quota resets each academic period." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Quota remaining" value={quota.balance} sub={`of ${quota.default} · ${quota.period}`} icon={Sparkles} />
        <Stat label="Past requests" value={items.length} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="Schedule cleaning">
          <form onSubmit={submit} className="space-y-3">
            <div><label className="label">Scheduled date</label>
              <input type="date" className="input" required value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} />
            </div>
            <div><label className="label">Notes</label>
              <textarea className="input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any special instructions" />
            </div>
            <button disabled={quota.balance <= 0} className="btn-primary w-full">{quota.balance <= 0 ? 'Quota exhausted' : 'Schedule'}</button>
          </form>
        </Card>
        <div className="lg:col-span-2">
          <Card title="My requests">
            {items.length === 0 ? <Empty title="No cleaning requests" /> : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>#</th><th>Date</th><th>Status</th><th>Notes</th></tr></thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.request_id}>
                        <td className="font-mono">{r.request_id}</td>
                        <td>{r.scheduled_date || '—'}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td className="text-xs text-slate-500">{r.notes || '—'}</td>
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
