import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty, Modal } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Plus, Car } from 'lucide-react';

export default function CabShare() {
  const [shares, setShares] = useState(null);
  const [hosted, setHosted] = useState([]);
  const [joined, setJoined] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedShare, setSelectedShare] = useState(null);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ source: '', destination: '', pickup_date: '', pickup_time: '', available_seats: 1, phone_number: '', notes: '' });

  async function load() {
    const [a, h, j] = await Promise.all([api.get('/cab'), api.get('/cab/me/hosted'), api.get('/cab/me/joined')]);
    setShares(a.data); setHosted(h.data); setJoined(j.data);
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    try { await api.post('/cab', form); toast.success('Ride posted'); setOpen(false); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function join(id) {
    try { await api.post('/cab/' + id + '/request', { note: 'Would love to join' }); toast.success('Request sent'); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function viewRequests(s) {
    setSelectedShare(s);
    const r = await api.get('/cab/' + s.share_id + '/requests');
    setRequests(r.data);
  }

  async function decide(id, decision) {
    await api.post('/cab/requests/' + id + '/decide', { decision });
    toast.success(decision);
    viewRequests(selectedShare);
    load();
  }

  if (!shares) return <Loading />;

  return (
    <>
      <PageHeader title="Cab Sharing" subtitle="Find or host a shared ride to save cost and travel together."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> Host a ride</button>}
      />

      <Card title="Active Rides">
        {shares.length === 0 ? <Empty icon={Car} title="No rides available" /> : (
          <div className="grid md:grid-cols-2 gap-4">
            {shares.map(s => (
              <div key={s.share_id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{s.source} → {s.destination}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.pickup_date} @ {s.pickup_time}</div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <div className="mt-2 text-xs text-slate-600">Host: <b>{s.host_name}</b> · {s.available_seats} seats left</div>
                {s.notes && <div className="mt-2 text-xs text-slate-500">“{s.notes}”</div>}
                <button onClick={() => join(s.share_id)} className="btn-primary btn-sm w-full mt-3" disabled={s.available_seats <= 0}>
                  Request to join
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <Card title="Rides I'm hosting">
          {hosted.length === 0 ? <Empty title="Nothing hosted" /> : (
            <ul className="space-y-2">
              {hosted.map(s => (
                <li key={s.share_id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-sm font-medium">{s.source} → {s.destination}</div>
                    <div className="text-xs text-slate-500">{s.pickup_date} · {s.available_seats} seats</div>
                  </div>
                  <button className="btn-secondary btn-sm" onClick={() => viewRequests(s)}>View requests</button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Rides I joined">
          {joined.length === 0 ? <Empty title="No requests yet" /> : (
            <ul className="space-y-2">
              {joined.map(j => (
                <li key={j.request_id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                  <div>
                    <div className="text-sm font-medium">{j.source} → {j.destination}</div>
                    <div className="text-xs text-slate-500">Host: {j.host_name} · {j.pickup_date}</div>
                  </div>
                  <StatusBadge status={j.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Host a cab share"
        footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" onClick={create}>Post</button></>}>
        <form className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">From</label><input required className="input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /></div>
            <div><label className="label">To</label><input required className="input" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} /></div>
            <div><label className="label">Pickup date</label><input type="date" required className="input" value={form.pickup_date} onChange={e => setForm({ ...form, pickup_date: e.target.value })} /></div>
            <div><label className="label">Pickup time</label><input type="time" required className="input" value={form.pickup_time} onChange={e => setForm({ ...form, pickup_time: e.target.value })} /></div>
            <div><label className="label">Available seats</label><input type="number" min={1} required className="input" value={form.available_seats} onChange={e => setForm({ ...form, available_seats: Number(e.target.value) })} /></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} /></div>
          </div>
          <div><label className="label">Notes</label><input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </form>
      </Modal>

      <Modal open={!!selectedShare} onClose={() => setSelectedShare(null)} title={`Requests for ${selectedShare?.source} → ${selectedShare?.destination}`}>
        {requests.length === 0 ? <Empty title="No requests yet" /> : (
          <ul className="space-y-2">
            {requests.map(r => (
              <li key={r.request_id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                <div>
                  <div className="text-sm font-medium">{r.requester_name}</div>
                  <div className="text-xs text-slate-500">{r.requester_email}</div>
                  {r.requester_note && <div className="text-xs text-slate-600 mt-1">“{r.requester_note}”</div>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.status} />
                  {r.status === 'Pending' && <>
                    <button className="btn-success btn-sm" onClick={() => decide(r.request_id, 'Approved')}>Approve</button>
                    <button className="btn-danger btn-sm" onClick={() => decide(r.request_id, 'Rejected')}>Reject</button>
                  </>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  );
}
