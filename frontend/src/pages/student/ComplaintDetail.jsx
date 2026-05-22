import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { Star, MessageSquare } from 'lucide-react';

export default function ComplaintDetail({ admin = false }) {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [statuses, setStatuses] = useState([]);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [rating, setRating] = useState(5);
  const [fbComment, setFbComment] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [assignTo, setAssignTo] = useState('');

  async function load() {
    const r = await api.get('/complaints/' + id);
    setData(r.data);
    const [s] = await Promise.all([api.get('/complaints/statuses')]);
    setStatuses(s.data);
    if (user.role === 'admin') {
      const u = await api.get('/admin/users?role=staff');
      setStaffList(u.data);
    }
  }
  useEffect(() => { load(); }, [id]);

  async function postComment(e) {
    e.preventDefault();
    await api.post('/complaints/' + id + '/comments', { message: comment });
    setComment(''); load();
  }

  async function updateStatus() {
    if (!newStatus) return;
    await api.patch('/complaints/' + id + '/status', { status_id: Number(newStatus), note: resolutionNote });
    toast.success('Status updated');
    setResolutionNote(''); load();
  }

  async function assign() {
    if (!assignTo) return;
    await api.post('/complaints/' + id + '/assign', { staff_id: assignTo });
    toast.success('Assigned'); load();
  }

  async function autoAssign() {
    await api.post('/complaints/' + id + '/auto-assign');
    toast.success('Auto-assigned'); load();
  }

  async function submitFeedback() {
    await api.post('/complaints/' + id + '/feedback', { rating, comments: fbComment });
    toast.success('Thanks for your feedback!'); load();
  }

  if (!data) return <Loading />;
  const { complaint, history, comments, feedback } = data;

  return (
    <>
      <PageHeader
        title={`Complaint #${complaint.complaint_id}`}
        subtitle={complaint.title}
        actions={<StatusBadge status={complaint.status_name} />}
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Details">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-500 uppercase">Submitted by</dt><dd className="font-medium">{complaint.student_name}</dd></div>
              <div><dt className="text-xs text-slate-500 uppercase">Priority</dt><dd>{complaint.priority}</dd></div>
              <div><dt className="text-xs text-slate-500 uppercase">Category</dt><dd>{complaint.category_name || '—'}</dd></div>
              <div><dt className="text-xs text-slate-500 uppercase">Portal</dt><dd>{complaint.portal_type}</dd></div>
              <div><dt className="text-xs text-slate-500 uppercase">Created</dt><dd>{new Date(complaint.created_at).toLocaleString()}</dd></div>
              <div><dt className="text-xs text-slate-500 uppercase">Assigned to</dt><dd>{complaint.staff_name || 'Unassigned'}</dd></div>
            </dl>
            <div className="mt-4">
              <dt className="text-xs text-slate-500 uppercase mb-1">Description</dt>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{complaint.description}</p>
            </div>
            {complaint.photo_url && (
              <img src={complaint.photo_url} alt="" className="mt-4 max-w-sm rounded-lg border border-slate-200" />
            )}
            {complaint.resolution_note && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="text-xs font-semibold text-emerald-700 uppercase">Resolution</div>
                <p className="text-sm text-emerald-900 mt-1">{complaint.resolution_note}</p>
              </div>
            )}
          </Card>

          <Card title="Discussion">
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
              {comments.map(c => (
                <div key={c.comment_id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">{c.user_name.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500">{c.user_name} · {c.user_type} · {new Date(c.created_at).toLocaleString()}</div>
                    <p className="text-sm mt-0.5">{c.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={postComment} className="mt-4 flex gap-2">
              <input className="input" placeholder="Write a comment…" value={comment} onChange={e => setComment(e.target.value)} required />
              <button className="btn-primary"><MessageSquare size={14} /> Post</button>
            </form>
          </Card>

          {/* Feedback for resolved */}
          {complaint.status_name === 'Resolved' && complaint.student_id === user.loginId && !feedback && (
            <Card title="Give feedback">
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? 'text-amber-500' : 'text-slate-300'}><Star size={24} fill={n <= rating ? '#f59e0b' : 'none'} /></button>
                ))}
              </div>
              <textarea className="input mb-3" rows={3} value={fbComment} onChange={e => setFbComment(e.target.value)} placeholder="How was the resolution?" />
              <button className="btn-primary" onClick={submitFeedback}>Submit feedback</button>
            </Card>
          )}

          {feedback && (
            <Card title="Feedback">
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(n => <Star key={n} size={18} className={n <= feedback.rating ? 'text-amber-500' : 'text-slate-300'} fill={n <= feedback.rating ? '#f59e0b' : 'none'} />)}
              </div>
              <p className="text-sm text-slate-700">{feedback.comments}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Timeline">
            <ol className="relative border-l border-slate-200 ml-2 space-y-4">
              {history.map(h => (
                <li key={h.history_id} className="pl-4">
                  <div className="absolute -left-[6px] h-3 w-3 rounded-full bg-brand-500 border-2 border-white" />
                  <div className="text-sm font-medium">{h.old_status || 'Created'} → {h.new_status}</div>
                  <div className="text-xs text-slate-500">{h.changer_name} · {new Date(h.changed_at).toLocaleString()}</div>
                  {h.note && <p className="text-xs text-slate-600 mt-1">“{h.note}”</p>}
                </li>
              ))}
            </ol>
          </Card>

          {(user.role === 'admin' || user.role === 'staff') && (
            <Card title="Staff actions">
              {user.role === 'admin' && !complaint.assigned_staff_id && (
                <div className="mb-4">
                  <label className="label">Assign to staff</label>
                  <div className="flex gap-2">
                    <select className="input flex-1" value={assignTo} onChange={e => setAssignTo(e.target.value)}>
                      <option value="">Select staff…</option>
                      {staffList.map(s => <option key={s.login_id} value={s.login_id}>{s.name}</option>)}
                    </select>
                    <button className="btn-primary" onClick={assign}>Assign</button>
                  </div>
                  <button className="btn-secondary btn-sm w-full mt-2" onClick={autoAssign}>Auto-assign</button>
                </div>
              )}
              <div>
                <label className="label">Update status</label>
                <select className="input mb-2" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  <option value="">Select…</option>
                  {statuses.map(s => <option key={s.status_id} value={s.status_id}>{s.status_name}</option>)}
                </select>
                <textarea className="input mb-2" rows={2} placeholder="Note / resolution" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} />
                <button className="btn-primary w-full" onClick={updateStatus}>Update</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
