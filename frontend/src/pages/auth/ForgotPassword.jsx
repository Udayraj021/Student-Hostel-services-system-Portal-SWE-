import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post('/auth/forgot-password', { email });
      if (r.data.resetToken) {
        setToken(r.data.resetToken);
        toast.success('Reset link generated (demo mode)');
      } else {
        toast.success(r.data.message || 'Request sent');
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="card card-body">
          <h2 className="text-2xl font-bold text-slate-900">Forgot your password?</h2>
          <p className="text-slate-500 text-sm mt-1">Enter your registered email to receive a reset link.</p>
          <form onSubmit={onSubmit} className="space-y-4 mt-6">
            <div>
              <label className="label">Email</label>
              <input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="yourname@iitg.ac.in" />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">{busy ? 'Sending…' : 'Send reset link'}</button>
          </form>
          {token && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
              <p className="font-medium text-amber-800 mb-1">Demo mode</p>
              <p className="text-amber-700 mb-2">No email server is configured. Use this token to reset:</p>
              <code className="text-[11px] break-all text-amber-900 font-mono">{token}</code>
              <Link to={`/reset-password?token=${token}`} className="block mt-3 link">Go to reset page →</Link>
            </div>
          )}
          <div className="mt-4 text-sm text-slate-500">
            Remembered it? <Link to="/login" className="link">Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
