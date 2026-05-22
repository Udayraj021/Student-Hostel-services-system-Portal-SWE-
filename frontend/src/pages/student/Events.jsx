import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Star, Calendar, MapPin } from 'lucide-react';

export default function Events() {
  const [events, setEvents] = useState(null);
  const [myRegs, setMyRegs] = useState([]);
  const [filter, setFilter] = useState('');

  async function load() {
    const [e, m] = await Promise.all([api.get('/events'), api.get('/events/me/my-events')]);
    setEvents(e.data); setMyRegs(m.data);
  }
  useEffect(() => { load(); }, []);

  const filtered = (events || []).filter(e => !filter || e.category === filter);

  async function register(id, isFree) {
    try {
      const r = await api.post('/events/' + id + '/register');
      if (r.data.paymentRequired) {
        const pay = await api.post('/payments/initiate', { amount: r.data.amount, purpose: 'event', reference_id: r.data.registration_id });
        await api.post('/payments/' + pay.data.payment_id + '/confirm');
        toast.success('Registered and paid');
      } else {
        toast.success('Registered');
      }
      load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function bookmark(id) {
    try { await api.post('/events/' + id + '/bookmark'); toast.success('Toggled bookmark'); load(); } catch {}
  }

  if (!events) return <Loading />;
  const regMap = {};
  myRegs.forEach(r => regMap[r.event_id] = r);

  return (
    <>
      <PageHeader title="Campus Events" subtitle="Browse and register for cultural, technical, sports & academic events." />
      <div className="flex flex-wrap gap-2 mb-4">
        {['','Cultural','Technical','Sports','Academic','Other'].map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1 rounded-full text-xs font-medium ${filter===c?'bg-brand-600 text-white':'bg-white border border-slate-200 text-slate-600'}`}>
            {c || 'All'}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <Empty title="No events found" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(ev => {
            const reg = regMap[ev.event_id];
            return (
              <div key={ev.event_id} className="card card-body">
                <div className="flex items-start justify-between">
                  <span className="badge-blue">{ev.category}</span>
                  <button onClick={() => bookmark(ev.event_id)} className="text-slate-400 hover:text-amber-500"><Star size={16} fill={reg?.bookmarked ? '#f59e0b' : 'none'} /></button>
                </div>
                <h3 className="font-semibold text-slate-900 mt-3 text-lg">{ev.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ev.description}</p>
                <div className="mt-3 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(ev.event_date).toLocaleString()}</div>
                  <div className="flex items-center gap-1"><MapPin size={12} /> {ev.location || '—'}</div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-semibold text-slate-900">{ev.is_free ? 'Free' : `₹${ev.fee}`}</span>
                  {reg && reg.status === 'Registered' ? (
                    <StatusBadge status={reg.payment_status === 'Paid' || ev.is_free ? 'Registered' : 'Pending payment'} />
                  ) : (
                    <button onClick={() => register(ev.event_id, ev.is_free)} className="btn-primary btn-sm">Register</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
