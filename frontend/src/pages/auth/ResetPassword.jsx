import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState(params.get('token') || '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      toast.success('Password updated. Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="card card-body">
          <h2 className="text-2xl font-bold text-slate-900">Reset password</h2>
          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            <div>
              <label className="label">Reset token</label>
              <input className="input font-mono text-xs" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste the token you received" />
            </div>
            <div>
              <label className="label">New password (min 8 characters)</label>
              <input type="password" required minLength={8} className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">{busy ? 'Updating…' : 'Update password'}</button>
          </form>
          <div className="mt-4 text-sm text-slate-500">
            <Link to="/login" className="link">Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
