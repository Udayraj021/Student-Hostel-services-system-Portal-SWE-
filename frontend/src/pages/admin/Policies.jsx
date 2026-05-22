import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Modal, Empty, Loading } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function Policies() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ policy_type: 'Leave', start_date: '', end_date: '', is_active: true, notes: '' });

  async function load() { setItems(null); const r = await api.get('/hostel/policies'); setItems(r.data); }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api.post('/hostel/policies', form);
    toast.success('Policy window saved'); setOpen(false); load();
  }

  async function toggle(p) {
    await api.patch(`/hostel/policies/${p.policy_id}`, { is_active: !p.is_active });
    load();
  }

  return (
    <>
      <PageHeader title="Policy windows" subtitle="Control when students can apply for leave, transfers and similar services."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14}/> New window</button>}
      />
      <Card>
        {!items ? <Loading /> : items.length === 0 ? <Empty title="No policies yet" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.policy_id}>
                    <td className="font-medium">{p.policy_type}</td>
                    <td>{p.start_date}</td>
                    <td>{p.end_date}</td>
                    <td>{p.is_active ? <span className="badge badge-success">Active</span> : <span className="badge badge-slate">Inactive</span>}</td>
                    <td className="text-xs">{p.notes}</td>
                    <td><button className="btn-secondary btn-sm" onClick={() => toggle(p)}>{p.is_active ? 'Disable' : 'Enable'}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Create policy window"
        footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" form="pol-form">Save</button></>}
      >
        <form id="pol-form" onSubmit={save} className="grid sm:grid-cols-2 gap-3">
          <div><label className="label">Type</label>
            <select className="input" value={form.policy_type} onChange={e => setForm({ ...form, policy_type: e.target.value })}>
              {['Leave','HostelTransfer','Enrollment','CourseRegistration','MessSubscription'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="label">Active</label>
            <select className="input" value={form.is_active ? 'yes' : 'no'} onChange={e => setForm({ ...form, is_active: e.target.value === 'yes' })}>
              <option value="yes">Yes</option><option value="no">No</option>
            </select>
          </div>
          <div><label className="label">Start date</label><input className="input" type="date" required value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
          <div><label className="label">End date</label><input className="input" type="date" required value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </form>
      </Modal>
    </>
  );
}
