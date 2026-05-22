import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Empty, Loading } from '../../components/ui.jsx';

export default function AdminComplaints() {
  const [items, setItems] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [status, setStatus] = useState('');

  async function load() {
    setItems(null);
    const r = await api.get('/complaints', { params: { status_id: status || undefined } });
    setItems(r.data);
  }
  useEffect(() => { api.get('/complaints/statuses').then(r => setStatuses(r.data)); }, []);
  useEffect(() => { load(); }, [status]);

  return (
    <>
      <PageHeader title="All complaints" subtitle="Review, assign and track every complaint in the system." />
      <Card>
        <div className="flex gap-2 mb-4 flex-wrap">
          <select className="input max-w-[220px]" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statuses.map(s => <option key={s.status_id} value={s.status_id}>{s.status_name}</option>)}
          </select>
        </div>

        {!items ? <Loading /> : items.length === 0 ? <Empty title="No complaints" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Title</th><th>Student</th><th>Category</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Created</th></tr></thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50 cursor-pointer">
                    <td>
                      <Link to={`/admin/complaints/${c.complaint_id}`} className="link font-mono">#{c.complaint_id}</Link>
                    </td>
                    <td className="font-medium line-clamp-1 max-w-xs">{c.title}</td>
                    <td>{c.student_name}</td>
                    <td>{c.category_name || '—'}</td>
                    <td><span className={`badge ${c.priority === 'High' ? 'badge-danger' : c.priority === 'Low' ? 'badge-slate' : 'badge-amber'}`}>{c.priority}</span></td>
                    <td><StatusBadge status={c.status_name} /></td>
                    <td>{c.staff_name || <span className="text-slate-400">Unassigned</span>}</td>
                    <td className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
