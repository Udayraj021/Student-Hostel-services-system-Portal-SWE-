import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Empty, Loading } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'data-change', label: 'Data change' },
  { id: 'certificate', label: 'Certificates' },
  { id: 'idcard', label: 'ID cards' },
];

export default function AdminRequests() {
  const [tab, setTab] = useState('data-change');
  const [items, setItems] = useState(null);

  async function load() {
    setItems(null);
    const r = await api.get(`/requests/${tab}`);
    setItems(r.data);
  }
  useEffect(() => { load(); }, [tab]);

  async function decide(id, decision) {
    const remarks = decision === 'Rejected' ? prompt('Reason for rejection:') : '';
    if (decision === 'Rejected' && remarks === null) return;
    try {
      await api.post(`/requests/${tab}/${id}/decide`, { decision, remarks: remarks || null });
      toast.success(`Request ${decision.toLowerCase()}`);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  }

  return (
    <>
      <PageHeader title="Requests" subtitle="Student requests awaiting approval." />

      <div className="flex gap-2 mb-4">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      <Card>
        {!items ? <Loading /> : items.length === 0 ? <Empty title={`No ${tab} requests`} /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Student</th>
                  {tab === 'data-change' && <><th>Field</th><th>Current</th><th>Requested</th></>}
                  {tab === 'certificate' && <><th>Type</th><th>Purpose</th></>}
                  {tab === 'idcard' && <><th>Reason</th><th>Payment</th></>}
                  <th>Status</th><th>Date</th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.request_id || r.id_request_id || r.cert_request_id || r.idcard_request_id}>
                    <td className="font-mono text-xs">#{r.request_id || r.id_request_id || r.cert_request_id || r.idcard_request_id}</td>
                    <td>{r.student_name || r.roll_number}</td>
                    {tab === 'data-change' && <><td>{r.field}</td><td className="text-xs">{r.current_value}</td><td className="text-xs">{r.requested_value}</td></>}
                    {tab === 'certificate' && <><td>{r.certificate_type}</td><td>{r.purpose}</td></>}
                    {tab === 'idcard' && <><td>{r.reason}</td><td>{r.payment_status || '—'}</td></>}
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-xs text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      {(r.status === 'Submitted' || r.status === 'UnderReview' || r.status === 'Pending') ? (
                        <div className="flex gap-1 justify-end">
                          <button className="btn-primary btn-sm" onClick={() => decide(r.request_id || r.id_request_id || r.cert_request_id || r.idcard_request_id, 'Approved')}>Approve</button>
                          <button className="btn-danger btn-sm" onClick={() => decide(r.request_id || r.id_request_id || r.cert_request_id || r.idcard_request_id, 'Rejected')}>Reject</button>
                        </div>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
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
