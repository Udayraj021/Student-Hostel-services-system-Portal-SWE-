import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { QrCode } from 'lucide-react';

export default function GatePass() {
  const [logs, setLogs] = useState(null);
  const [dest, setDest] = useState('');
  const [qr, setQr] = useState(null);

  async function load() { const r = await api.get('/gate/logs'); setLogs(r.data); }
  useEffect(() => { load(); }, []);

  async function generate(e) {
    e.preventDefault();
    try {
      const r = await api.post('/gate/qr', { destination: dest });
      setQr(r.data);
      toast.success('QR generated');
      load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  if (!logs) return <Loading />;

  return (
    <>
      <PageHeader title="Gate Pass (QR)" subtitle="Generate an encrypted QR code for gate entry/exit." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="Generate a new QR">
          <form onSubmit={generate} className="space-y-3">
            <div><label className="label">Destination</label>
              <input required className="input" value={dest} onChange={e => setDest(e.target.value)} placeholder="e.g. City Mall, Guwahati" />
            </div>
            <button className="btn-primary w-full"><QrCode size={14} /> Generate QR</button>
          </form>
          {qr && (
            <div className="mt-5 text-center">
              <img src={qr.qrDataUrl} alt="QR" className="mx-auto rounded-lg border border-slate-200" />
              <p className="text-xs text-slate-500 mt-2">Show this at the gate scanner. Token is valid until next scan.</p>
            </div>
          )}
        </Card>
        <div className="lg:col-span-2">
          <Card title="My Gate Logs">
            {logs.length === 0 ? <Empty title="No logs yet" /> : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Issued</th><th>Destination</th><th>Gate</th><th>Out Time</th><th>In Time</th></tr></thead>
                  <tbody>
                    {logs.map(l => (
                      <tr key={l.log_id}>
                        <td>{new Date(l.issued_at).toLocaleString()}</td>
                        <td>{l.destination}</td>
                        <td>{l.gate_location || '—'}</td>
                        <td>{l.out_time ? new Date(l.out_time).toLocaleString() : '—'}</td>
                        <td>{l.in_time ? new Date(l.in_time).toLocaleString() : '—'}</td>
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
