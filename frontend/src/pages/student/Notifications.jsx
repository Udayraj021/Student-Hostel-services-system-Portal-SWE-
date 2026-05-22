import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [items, setItems] = useState(null);
  async function load() { const r = await api.get('/notifications'); setItems(r.data); }
  useEffect(() => { load(); }, []);

  async function markAll() { await api.patch('/notifications/read-all'); toast.success('Marked all read'); load(); }
  async function markRead(id) { await api.patch(`/notifications/${id}/read`); load(); }

  if (!items) return <Loading />;

  return (
    <>
      <PageHeader title="Notifications" subtitle="Updates from your requests, complaints and the system."
        actions={<button className="btn-secondary" onClick={markAll}>Mark all as read</button>}
      />
      <Card padded={false}>
        {items.length === 0 ? <div className="p-6"><Empty title="No notifications" /></div> : (
          <ul className="divide-y divide-slate-100">
            {items.map(n => (
              <li key={n.notification_id} onClick={() => markRead(n.notification_id)} className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50 ${!n.is_read ? 'bg-brand-50/40' : ''}`}>
                <div className={`mt-1 h-2 w-2 rounded-full ${n.is_read ? 'bg-slate-300' : 'bg-brand-500'}`} />
                <div className="flex-1">
                  <div className="flex justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{new Date(n.sent_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
