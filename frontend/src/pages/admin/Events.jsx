import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Modal, StatusBadge, Empty, Loading } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit } from 'lucide-react';

const emptyForm = {
  title: '', description: '', event_date: '', location: '', category: 'Technical',
  is_free: true, fee: 0, capacity: 100, status: 'Active'
};

export default function AdminEvents() {
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  async function load() {
    setItems(null);
    const r = await api.get('/events', { params: { status: 'Draft,Active,Closed' } });
    setItems(r.data);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm(emptyForm); setOpen(true); }
  function openEdit(e) { setEditing(e); setForm({ ...e, event_date: e.event_date?.slice(0,16) }); setOpen(true); }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) await api.put(`/events/${editing.event_id}`, form);
      else await api.post('/events', form);
      toast.success(editing ? 'Event updated' : 'Event created');
      setOpen(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  }

  async function remove(id) {
    if (!confirm('Delete this event?')) return;
    await api.delete(`/events/${id}`);
    toast.success('Event deleted'); load();
  }

  return (
    <>
      <PageHeader title="Events" subtitle="Create, publish and manage campus events."
        actions={<button className="btn-primary" onClick={openNew}><Plus size={14}/> New event</button>}
      />
      <Card>
        {!items ? <Loading /> : items.length === 0 ? <Empty title="No events yet" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Title</th><th>Date</th><th>Category</th><th>Fee</th><th>Registered</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {items.map(ev => (
                  <tr key={ev.event_id}>
                    <td className="font-medium">{ev.title}</td>
                    <td>{new Date(ev.event_date).toLocaleString()}</td>
                    <td><span className="badge badge-slate">{ev.category}</span></td>
                    <td>{ev.is_free ? 'Free' : `₹${ev.fee}`}</td>
                    <td>{ev.registered_count} / {ev.capacity || '∞'}</td>
                    <td><StatusBadge status={ev.status} /></td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(ev)}><Edit size={12}/></button>
                        <button className="btn-danger btn-sm" onClick={() => remove(ev.event_id)}><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit event' : 'Create event'} size="lg"
        footer={<><button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary" form="event-form">{editing ? 'Save' : 'Create'}</button></>}
      >
        <form id="event-form" onSubmit={save} className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><label className="label">Title</label><input className="input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="label">Date & time</label><input className="input" type="datetime-local" required value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} /></div>
          <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {['Technical','Cultural','Sports','Academic','Workshop','Seminar','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="label">Capacity</label><input className="input" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.is_free ? 'free' : 'paid'} onChange={e => setForm({ ...form, is_free: e.target.value === 'free' })}>
              <option value="free">Free</option><option value="paid">Paid</option>
            </select>
          </div>
          {!form.is_free && <div><label className="label">Fee (₹)</label><input className="input" type="number" value={form.fee} onChange={e => setForm({ ...form, fee: Number(e.target.value) })} /></div>}
          <div className={form.is_free ? 'sm:col-span-2' : ''}>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {['Draft','Active','Closed','Archived'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </form>
      </Modal>
    </>
  );
}
