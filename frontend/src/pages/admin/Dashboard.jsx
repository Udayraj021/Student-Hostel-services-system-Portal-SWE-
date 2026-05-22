import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Stat, Loading } from '../../components/ui.jsx';
import { Users2, ClipboardList, MessageSquareWarning, Plane, Music } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tests, setTests] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);

  useEffect(() => {
    (async () => {
      const results = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/tests/summary'),
        api.get('/auth/audit-logs?limit=10'),
      ]);
      setStats(results[0].status === 'fulfilled' ? results[0].value.data : {});
      setTests(results[1].status === 'fulfilled' ? results[1].value.data : []);
      setRecentAudit(results[2].status === 'fulfilled' ? results[2].value.data : []);
    })();
  }, []);

  if (!stats) return <Loading />;
  const u = stats.users || {};

  return (
    <>
      <PageHeader title="Administration dashboard" subtitle="System-wide overview and metrics." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Active users" value={u.total || 0} sub={`${u.students || 0} students · ${u.professors || 0} faculty`} icon={Users2} />
        <Stat label="Pending requests" value={stats.pendingRequests?.pending_requests || 0} sub="Certificates, data changes, ID cards" icon={ClipboardList} />
        <Stat label="Open complaints" value={stats.complaints?.open_complaints || 0} sub="Need attention" icon={MessageSquareWarning} />
        <Stat label="Leaves pending" value={stats.leaves?.pending_leaves || 0} sub={`${stats.events?.active_events || 0} active events`} icon={Plane} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Test runs summary" description="Automation telemetry from the test dashboard.">
          {tests.length === 0 ? <p className="text-sm text-slate-500">No test data yet.</p> : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr><th>Type</th><th>Runs</th><th>Passed</th><th>Failed</th><th>Avg pass %</th></tr></thead>
                <tbody>
                  {tests.map(t => (
                    <tr key={t.test_type}>
                      <td className="font-medium">{t.test_type}</td>
                      <td>{t.runs}</td>
                      <td className="text-emerald-600">{t.passed || 0}</td>
                      <td className="text-rose-600">{t.failed || 0}</td>
                      <td>{t.avg_pass_rate || 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Recent audit events">
          {recentAudit.length === 0 ? <p className="text-sm text-slate-500">No audit events yet.</p> : (
            <ul className="divide-y divide-slate-100 -m-4">
              {recentAudit.map(a => (
                <li key={a.log_id} className="p-3 flex gap-3">
                  <div className={`h-2 w-2 rounded-full mt-2 ${a.result === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm"><span className="font-medium">{a.user_name || 'System'}</span> · {a.action}</p>
                    <p className="text-xs text-slate-500">{new Date(a.timestamp).toLocaleString()} · {a.ip_address || '—'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
