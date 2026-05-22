import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

export default function Certificates() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ certificate_type: 'Bonafide', purpose: '' });

  async function load() { const r = await api.get('/requests/certificate'); setItems(r.data); }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try { await api.post('/requests/certificate', form); toast.success('Request submitted'); setForm({ certificate_type: 'Bonafide', purpose: '' }); load(); }
    catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="Certificate Requests" subtitle="Request Bonafide certificates and No-Objection certificates." />
      <div className="grid lg:grid-cols-3 gap-6">
        <Card title="New Request">
          <form onSubmit={submit} className="space-y-3">
            <div><label className="label">Type</label>
              <select className="input" value={form.certificate_type} onChange={e => setForm({ ...form, certificate_type: e.target.value })}>
                <option value="Bonafide">Bonafide Certificate</option>
                <option value="NOC_Passport">NOC - Passport</option>
                <option value="NOC_Internship">NOC - Internship</option>
              </select>
            </div>
            <div><label className="label">Purpose</label>
              <textarea className="input" rows={4} value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Why are you requesting this certificate?" />
            </div>
            <button className="btn-primary w-full">Submit</button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <Card title="My Requests">
            {items.length === 0 ? <Empty title="No requests yet" /> : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead><tr><th>#</th><th>Type</th><th>Status</th><th>Created</th><th>Certificate</th></tr></thead>
                  <tbody>
                    {items.map(r => (
                      <tr key={r.request_id}>
                        <td className="font-mono">{r.request_id}</td>
                        <td>{r.certificate_type}</td>
                        <td><StatusBadge status={r.status} /></td>
                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                        <td>{r.status === 'Completed' && r.document_url ? <a className="link text-xs" href={r.document_url}>Download</a> : <span className="text-slate-400 text-xs">—</span>}</td>
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
