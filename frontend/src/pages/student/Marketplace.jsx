import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, StatusBadge, Loading, Empty, Modal } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Plus, Tag } from 'lucide-react';

export default function Marketplace() {
  const [items, setItems] = useState(null);
  const [mine, setMine] = useState([]);
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ad_type: 'Sell', title: '', description: '', asking_price: '', category: '', contact_phone: '' });
  const [images, setImages] = useState([]);

  async function load() {
    const [a, b] = await Promise.all([api.get('/marketplace' + (filter ? `?ad_type=${filter}` : '')), api.get('/marketplace/me/my-listings')]);
    setItems(a.data); setMine(b.data);
  }
  useEffect(() => { load(); }, [filter]);

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    for (const f of images) fd.append('images', f);
    try {
      await api.post('/marketplace', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Listing created');
      setOpen(false);
      setForm({ ad_type: 'Sell', title: '', description: '', asking_price: '', category: '', contact_phone: '' });
      setImages([]); load();
    } catch (err) { toast.error(err?.response?.data?.error || 'Failed'); }
  }

  async function changeStatus(id, status) { await api.patch('/marketplace/' + id + '/status', { status }); load(); }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader
        title="Student Marketplace"
        subtitle="Buy, sell or give away items within the student community."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> New listing</button>}
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {['','Sell','Rent','Free'].map(t => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1 rounded-full text-xs font-medium ${filter===t?'bg-brand-600 text-white':'bg-white border border-slate-200 text-slate-600'}`}>
            {t || 'All'}
          </button>
        ))}
      </div>

      {items.length === 0 ? <Empty title="No active listings" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {items.map(l => (
            <div key={l.listing_id} className="card overflow-hidden">
              <div className="aspect-video bg-slate-100">
                {l.primary_image ? <img src={l.primary_image} className="w-full h-full object-cover" alt="" /> : <div className="h-full flex items-center justify-center text-slate-400"><Tag size={32} /></div>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <span className="badge-blue">{l.ad_type}</span>
                  <span className="text-sm font-bold text-slate-900">{l.ad_type === 'Free' ? 'Free' : `₹${l.asking_price}`}</span>
                </div>
                <h3 className="font-semibold mt-2">{l.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{l.description}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  {l.seller_name} · {l.contact_email}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card title="My Listings">
        {mine.length === 0 ? <Empty title="No listings yet" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Title</th><th>Type</th><th>Price</th><th>Status</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {mine.map(l => (
                  <tr key={l.listing_id}>
                    <td>{l.title}</td>
                    <td>{l.ad_type}</td>
                    <td>₹{l.asking_price}</td>
                    <td><StatusBadge status={l.status} /></td>
                    <td>{new Date(l.created_at).toLocaleDateString()}</td>
                    <td>
                      <select className="input !py-1 !text-xs" value={l.status} onChange={e => changeStatus(l.listing_id, e.target.value)}>
                        <option>Active</option><option>Sold</option><option>Closed</option><option>Hidden</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New listing"
        footer={<>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submit}>Create</button>
        </>}>
        <form className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Type</label>
              <select className="input" value={form.ad_type} onChange={e => setForm({ ...form, ad_type: e.target.value })}>
                <option>Sell</option><option>Rent</option><option>Free</option>
              </select>
            </div>
            <div><label className="label">Asking price (₹)</label>
              <input type="number" className="input" value={form.asking_price} onChange={e => setForm({ ...form, asking_price: e.target.value })} />
            </div>
          </div>
          <div><label className="label">Title</label>
            <input required className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div><label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Category</label>
              <input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Books, Electronics…" />
            </div>
            <div><label className="label">Contact phone</label>
              <input className="input" value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
            </div>
          </div>
          <div><label className="label">Images (up to 5)</label>
            <input type="file" multiple accept="image/*" onChange={e => setImages([...e.target.files])} className="input" />
          </div>
        </form>
      </Modal>
    </>
  );
}
