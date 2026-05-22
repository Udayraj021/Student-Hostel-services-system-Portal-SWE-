import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

export default function Mess() {
  const [subscription, setSubscription] = useState(null);
  const [messes, setMesses] = useState([]);
  const [rebates, setRebates] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [feedback, setFeedback] = useState({ mess_id: '', meal: 'Lunch', meal_rating: 5, comments: '' });
  const [changeTo, setChangeTo] = useState('');
  const [rebateLeave, setRebateLeave] = useState('');

  async function load() {
    const [s, m, r, l] = await Promise.all([
      api.get('/mess/subscription'),
      api.get('/mess/list'),
      api.get('/mess/rebate'),
      api.get('/hostel/leave'),
    ]);
    setSubscription(s.data); setMesses(m.data); setRebates(r.data); setLeaves(l.data);
    if (!feedback.mess_id && s.data) setFeedback(f => ({ ...f, mess_id: s.data.mess_id }));
  }
  useEffect(() => { load(); }, []);

  async function change(e) {
    e.preventDefault();
    try { await api.post('/mess/subscription/change', { new_mess_id: changeTo }); toast.success('Changed'); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function claimRebate(e) {
    e.preventDefault();
    try { await api.post('/mess/rebate', { leave_application_id: rebateLeave }); toast.success('Rebate claimed'); setRebateLeave(''); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function submitFeedback(e) {
    e.preventDefault();
    try { await api.post('/mess/feedback', feedback); toast.success('Feedback submitted'); setFeedback({ ...feedback, comments: '' }); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  if (!messes) return <Loading />;

  const approvedLeaves = leaves.filter(l => l.status === 'Approved');
  const claimedLeaveIds = new Set(rebates.map(r => r.leave_application_id));

  return (
    <>
      <PageHeader title="Mess & Rebate" subtitle="Subscription, rebates and daily meal feedback." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="My Subscription">
          {subscription ? (
            <div className="space-y-2">
              <div className="text-xl font-bold">{subscription.mess_name}</div>
              <div className="text-sm text-slate-500">Caterer: {subscription.caterer_name}</div>
              <div className="text-xs text-slate-500">Since {subscription.start_date}</div>
            </div>
          ) : <p className="text-sm text-slate-500">No active subscription.</p>}
          <form onSubmit={change} className="mt-5 space-y-2">
            <label className="label">Change subscription</label>
            <select required className="input" value={changeTo} onChange={e => setChangeTo(e.target.value)}>
              <option value="">Select mess…</option>
              {messes.map(m => <option key={m.mess_id} value={m.mess_id}>{m.name} (OPI {m.opi_score})</option>)}
            </select>
            <button className="btn-primary w-full">Change</button>
          </form>
        </Card>

        <Card title="Claim Mess Rebate">
          {approvedLeaves.length === 0 ? (
            <p className="text-sm text-slate-500">You have no approved leaves to claim rebate for.</p>
          ) : (
            <form onSubmit={claimRebate} className="space-y-3">
              <label className="label">Select approved leave</label>
              <select required className="input" value={rebateLeave} onChange={e => setRebateLeave(e.target.value)}>
                <option value="">Choose…</option>
                {approvedLeaves.filter(l => !claimedLeaveIds.has(l.leave_id)).map(l => (
                  <option key={l.leave_id} value={l.leave_id}>{l.start_date} → {l.end_date} ({l.leave_category})</option>
                ))}
              </select>
              <button className="btn-primary w-full">Claim Rebate</button>
            </form>
          )}
          <div className="mt-5">
            <h4 className="text-xs font-semibold uppercase text-slate-500 mb-2">Past rebates</h4>
            {rebates.length === 0 ? <p className="text-xs text-slate-400">No rebates yet</p> : (
              <ul className="space-y-2">
                {rebates.map(r => (
                  <li key={r.rebate_id} className="flex items-center justify-between text-sm">
                    <span>#{r.rebate_id} {r.start_date} → {r.end_date}</span>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card title="Meal Feedback">
          <form onSubmit={submitFeedback} className="space-y-3">
            <div><label className="label">Mess</label>
              <select required className="input" value={feedback.mess_id} onChange={e => setFeedback({ ...feedback, mess_id: e.target.value })}>
                <option value="">Select…</option>
                {messes.map(m => <option key={m.mess_id} value={m.mess_id}>{m.name}</option>)}
              </select>
            </div>
            <div><label className="label">Meal</label>
              <select className="input" value={feedback.meal} onChange={e => setFeedback({ ...feedback, meal: e.target.value })}>
                <option>Breakfast</option><option>Lunch</option><option>Snacks</option><option>Dinner</option>
              </select>
            </div>
            <div><label className="label">Rating</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(r => (
                  <button key={r} type="button" onClick={() => setFeedback({ ...feedback, meal_rating: r })}
                    className={r <= feedback.meal_rating ? 'text-amber-500' : 'text-slate-300'}>
                    <Star size={22} fill={r <= feedback.meal_rating ? '#f59e0b' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            <div><label className="label">Comments</label><textarea className="input" rows={3} value={feedback.comments} onChange={e => setFeedback({ ...feedback, comments: e.target.value })} /></div>
            <button className="btn-primary w-full">Submit</button>
          </form>
        </Card>
      </div>
    </>
  );
}
