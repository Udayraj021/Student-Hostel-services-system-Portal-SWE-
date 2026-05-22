import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { PageHeader, Card, Loading, Empty } from '../../components/ui.jsx';
import toast from 'react-hot-toast';
import { Monitor, Smartphone } from 'lucide-react';

export default function Sessions() {
  const [items, setItems] = useState(null);

  async function load() {
    const r = await api.get('/auth/sessions');
    setItems(r.data);
  }
  useEffect(() => { load(); }, []);

  async function revoke(id) {
    if (!confirm('Sign out this session?')) return;
    await api.delete(`/auth/sessions/${id}`);
    toast.success('Session revoked');
    load();
  }

  if (!items) return <Loading />;
  const active = items.filter(s => !s.revoked && new Date(s.expires_at) > new Date());

  return (
    <>
      <PageHeader title="Active sessions" subtitle="Devices currently signed into your account." />
      <Card padded={false}>
        {active.length === 0 ? <div className="p-6"><Empty title="No active sessions" /></div> : (
          <ul className="divide-y divide-slate-100">
            {active.map(s => {
              const isMobile = /Mobile|Android|iPhone/i.test(s.device_info || '');
              return (
                <li key={s.session_id} className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    {isMobile ? <Smartphone size={18} /> : <Monitor size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{isMobile ? 'Mobile device' : 'Desktop browser'}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{s.device_info || 'Unknown device'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">IP {s.ip_address || '—'} · last active {new Date(s.last_activity).toLocaleString()} · expires {new Date(s.expires_at).toLocaleString()}</p>
                  </div>
                  <button className="btn-danger btn-sm" onClick={() => revoke(s.session_id)}>Revoke</button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {items.filter(s => s.revoked).length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-2">Past / revoked</h3>
          <Card padded={false}>
            <ul className="divide-y divide-slate-100">
              {items.filter(s => s.revoked).slice(0, 10).map(s => (
                <li key={s.session_id} className="p-3 flex items-center gap-3 text-sm text-slate-500">
                  <div className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="flex-1 line-clamp-1">{s.device_info || 'Unknown device'}</span>
                  <span className="text-xs">{new Date(s.last_activity).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
