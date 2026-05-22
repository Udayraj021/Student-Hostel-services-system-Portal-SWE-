import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import { GraduationCap, LogIn } from 'lucide-react';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);

  if (user) { navigate('/', { replace: true }); return null; }

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome!');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally { setBusy(false); }
  }

  function quickFill(email, pass) {
    setForm({ email, password: pass });
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 text-white p-10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="text-xl font-bold">Student Portal</div>
              <div className="text-sm text-brand-100/80">Hostel Services System</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">One portal. Every service.</h1>
          <p className="text-brand-100/80 text-lg max-w-md">40 digital services across authentication, academics, hostel life, events, and complaints — designed to replace paperwork and office queues.</p>
          <div className="grid grid-cols-3 gap-4 max-w-lg pt-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-2xl font-bold">40</div>
              <div className="text-xs text-brand-100/80">Services</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-2xl font-bold">6</div>
              <div className="text-xs text-brand-100/80">Modules</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs text-brand-100/80">Access</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-xs text-brand-100/60">CS 345 / CS 346 · Software Engineering Project · Prof. Pradeep K. Das</div>
        <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-10 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Sign in</h2>
            <p className="text-slate-500 text-sm mt-1">Use your institutional email to access the portal.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email" required className="input"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="yourname@iitg.ac.in"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" required className="input"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="link">Forgot password?</Link>
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full py-2.5">
              <LogIn size={16} /> {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-xs font-semibold text-slate-700 mb-2">Demo credentials (click to fill)</div>
            <div className="space-y-1 text-xs">
              {[
                ['Student','aarav.sharma@iitg.ac.in','student@123'],
                ['Student 2','priya.patel@iitg.ac.in','student@123'],
                ['Admin','admin@iitg.ac.in','admin@123'],
                ['Warden','warden.kameng@iitg.ac.in','warden@123'],
                ['Mess Secretary','mess.sec@iitg.ac.in','mess@123'],
                ['Board Exec','boardexec@iitg.ac.in','board@123'],
                ['Staff','maint1@iitg.ac.in','staff@123'],
                ['Professor','pkdas@iitg.ac.in','prof@123'],
              ].map(([label, em, pw]) => (
                <button key={em} type="button" onClick={() => quickFill(em, pw)} className="flex w-full items-center justify-between gap-3 px-2 py-1.5 rounded hover:bg-white">
                  <span className="font-medium text-slate-600">{label}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{em}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
