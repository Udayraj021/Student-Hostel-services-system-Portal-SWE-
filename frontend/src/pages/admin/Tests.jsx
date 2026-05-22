import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Modal, Empty, Loading } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function Tests() {
  const [runs, setRuns] = useState(null);
  const [summary, setSummary] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ test_type: 'Unit', module_name: '', commit_id: '', total_tests: 10, passed: 10, failed: 0, notes: '' });

  async function load() {
    const [r, s] = await Promise.all([api.get('/tests/runs'), api.get('/tests/summary')]);
    setRuns(r.data); setSummary(s.data);
  }
  useEffect(() => { load(); }, []);

  async function record(e) {
    e.preventDefault();
    await api.post('/tests/runs', form);
    toast.success('Test run recorded'); setOpen(false); load();
  }

  return (
    <>
      <PageHeader title="Test dashboard" subtitle="Unit, integration, regression, performance and security test history."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14}/> Record run</button>}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {summary.map(s => (
          <div key={s.test_type} className="card card-body">
            <div className="text-xs text-slate-500 uppercase">{s.test_type}</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{s.avg_pass_rate || 0}%</div>
            <div className="text-xs text-slate-500 mt-1">{s.runs} runs · {s.total_tests} tests</div>
          </div>
        ))}
      </div>

      <Card title="Recent runs">
        {!runs ? <Loading /> : runs.length === 0 ? <Empty title="No test runs yet" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Type</th><th>Module</th><th>Commit</th><th>Total</th><th>Passed</th><th>Failed</th><th>Pass %</th><th>Time</th></tr></thead>
              <tbody>
                {runs.map(r => (
                  <tr key={r.run_id}>
                    <td className="font-mono text-xs">{r.run_id}</td>
                    <td>{r.test_type}</td>
                    <td>{r.module_name || '—'}</td>
                    <td className="font-mono text-xs">{r.commit_id?.slice(0,7) || '—'}</td>
                    <td>{r.total_tests}</td>
                    <td className="text-emerald-600">{r.passed}</td>
                    <td className="text-rose-600">{r.failed}</td>
                    <td>{r.pass_rate}%</td>
                    <td className="text-xs text-slate-500">{new Date(r.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Record test run"
        footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" form="test-form">Save</button></>}
      >
        <form id="test-form" onSubmit={record} className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Type</label>
            <select className="input" value={form.test_type} onChange={e => setForm({ ...form, test_type: e.target.value })}>
              {['Unit','Integration','Regression','Performance','Security'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Module</label><input className="input" value={form.module_name} onChange={e => setForm({ ...form, module_name: e.target.value })} /></div>
          <div><label className="label">Commit ID</label><input className="input" value={form.commit_id} onChange={e => setForm({ ...form, commit_id: e.target.value })} /></div>
          <div><label className="label">Total</label><input className="input" type="number" value={form.total_tests} onChange={e => setForm({ ...form, total_tests: Number(e.target.value) })} /></div>
          <div><label className="label">Passed</label><input className="input" type="number" value={form.passed} onChange={e => setForm({ ...form, passed: Number(e.target.value) })} /></div>
          <div><label className="label">Failed</label><input className="input" type="number" value={form.failed} onChange={e => setForm({ ...form, failed: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </form>
      </Modal>
    </>
  );
}
