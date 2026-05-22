import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Empty, Loading, Modal } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';

export default function WardenLeave({ type = 'leave' }) {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [decision, setDecision] = useState('Approved');
  const isTransfer = type === 'transfer';

  async function load() {
    setItems(null);
    const r = await api.get(`/hostel/${isTransfer ? 'transfer' : 'leave'}`);
    setItems(r.data);
  }
  useEffect(() => { load(); }, [type]);

  async function decide() {
    try {
      const id = isTransfer ? modal.request_id : modal.leave_id;
      await api.post(`/hostel/${isTransfer ? 'transfer' : 'leave'}/${id}/decide`, { decision, remarks });
      toast.success(`Marked ${decision.toLowerCase()}`);
      setModal(null); setRemarks(''); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  }

  return (
    <>
      <PageHeader
        title={isTransfer ? 'Hostel transfer requests' : 'Leave applications'}
        subtitle={isTransfer ? 'Review and decide on hostel transfer requests.' : 'Review leave applications from students.'}
      />

      <Card>
        {!items ? <Loading /> : items.length === 0 ? <Empty title="Nothing pending" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th><th>Student</th>
                  {!isTransfer && <><th>Category</th><th>From</th><th>To</th><th>Destination</th></>}
                  {isTransfer && <><th>From hostel</th><th>To hostel</th></>}
                  <th>Reason</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.leave_id || r.request_id}>
                    <td className="font-mono text-xs">#{r.leave_id || r.request_id}</td>
                    <td className="font-medium">{r.student_name}<div className="text-xs text-slate-500">{r.roll_number}</div></td>
                    {!isTransfer && <>
                      <td><span className="badge badge-slate">{r.leave_category}</span></td>
                      <td>{r.start_date}</td>
                      <td>{r.end_date}</td>
                      <td>{r.destination}</td>
                    </>}
                    {isTransfer && <>
                      <td>{r.current_hostel_name}</td>
                      <td>{r.target_hostel_name}</td>
                    </>}
                    <td className="text-xs max-w-xs line-clamp-2">{r.reason}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      {r.status === 'Pending' ? (
                        <div className="flex gap-1 justify-end">
                          <button className="btn-primary btn-sm" onClick={() => { setModal(r); setDecision('Approved'); }}><Check size={12}/></button>
                          <button className="btn-danger btn-sm" onClick={() => { setModal(r); setDecision('Rejected'); }}><X size={12}/></button>
                        </div>
                      ) : <span className="text-xs text-slate-400">{r.warden_remarks || r.remarks || 'Decided'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={`${decision} request`}
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className={decision === 'Approved' ? 'btn-primary' : 'btn-danger'} onClick={decide}>Confirm</button></>}
      >
        {modal && (
          <div className="space-y-3">
            <div className="text-sm">
              <p><strong>Student:</strong> {modal.student_name}</p>
              <p className="mt-1"><strong>Reason:</strong> {modal.reason}</p>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea className="input" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add your remarks…" />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
