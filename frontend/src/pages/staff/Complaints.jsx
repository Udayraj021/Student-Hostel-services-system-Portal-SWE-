import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Stat, Empty, Loading } from '../../components/ui.jsx';
import { MessageSquareWarning, CheckCircle2, Clock } from 'lucide-react';

export default function StaffComplaints() {
  const [items, setItems] = useState(null);

  useEffect(() => { api.get('/complaints').then(r => setItems(r.data)); }, []);
  if (!items) return <Loading />;

  const open = items.filter(c => c.status_id !== 5 && c.status_id !== 6 && c.status_id !== 7);
  const resolved = items.filter(c => c.status_id === 5 || c.status_id === 6);
  const high = items.filter(c => c.priority === 'High' && c.status_id < 5);

  return (
    <>
      <PageHeader title="Assigned complaints" subtitle="Complaints you've been assigned to resolve." />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Stat label="Open" value={open.length} icon={Clock} />
        <Stat label="High priority" value={high.length} icon={MessageSquareWarning} />
        <Stat label="Resolved" value={resolved.length} icon={CheckCircle2} />
      </div>

      <Card title="Open queue">
        {open.length === 0 ? <Empty title="No open complaints" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Title</th><th>Student</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead>
              <tbody>
                {open.map(c => (
                  <tr key={c.complaint_id} className="hover:bg-slate-50">
                    <td><Link to={`/staff/complaints/${c.complaint_id}`} className="link font-mono">#{c.complaint_id}</Link></td>
                    <td className="font-medium max-w-xs line-clamp-1">{c.title}</td>
                    <td>{c.student_name}</td>
                    <td><span className={`badge ${c.priority === 'High' ? 'badge-danger' : c.priority === 'Low' ? 'badge-slate' : 'badge-amber'}`}>{c.priority}</span></td>
                    <td><StatusBadge status={c.status_name} /></td>
                    <td className="text-xs text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {resolved.length > 0 && (
        <div className="mt-6">
          <Card title="Recently resolved">
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>ID</th><th>Title</th><th>Student</th><th>Resolved</th></tr></thead>
                <tbody>
                  {resolved.slice(0, 10).map(c => (
                    <tr key={c.complaint_id}>
                      <td><Link to={`/staff/complaints/${c.complaint_id}`} className="link font-mono">#{c.complaint_id}</Link></td>
                      <td className="max-w-xs line-clamp-1">{c.title}</td>
                      <td>{c.student_name}</td>
                      <td className="text-xs text-slate-500">{new Date(c.updated_at || c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
