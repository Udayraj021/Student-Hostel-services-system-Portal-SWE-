import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Empty, Loading } from '../../components/ui.jsx';

export default function Audit() {
  const [logs, setLogs] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/auth/audit-logs?limit=500')
      .then(r => setLogs(r.data))
      .catch(() => setLogs([]));
  }, []);
  if (!logs) return <Loading />;

  const filtered = logs.filter(l =>
    !q || (l.user_name || '').toLowerCase().includes(q.toLowerCase()) ||
    (l.action || '').toLowerCase().includes(q.toLowerCase()) ||
    (l.ip_address || '').includes(q)
  );

  return (
    <>
      <PageHeader title="Audit log" subtitle="Security-critical events across the system." />
      <Card>
        <input className="input mb-4" placeholder="Filter by user, action or IP…" value={q} onChange={e => setQ(e.target.value)} />
        {filtered.length === 0 ? <Empty title="No audit events" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Result</th><th>IP</th><th>Details</th></tr></thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.log_id}>
                    <td className="text-xs text-slate-500 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="font-medium">{l.user_name || <span className="text-slate-400">—</span>} <span className="text-xs text-slate-500">#{l.login_id || '—'}</span></td>
                    <td><span className="badge badge-slate">{l.action}</span></td>
                    <td>{l.result === 'success' ? <span className="badge badge-success">success</span> : <span className="badge badge-danger">{l.result}</span>}</td>
                    <td className="font-mono text-xs">{l.ip_address || '—'}</td>
                    <td className="text-xs text-slate-500 max-w-md truncate">{l.details}</td>
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
