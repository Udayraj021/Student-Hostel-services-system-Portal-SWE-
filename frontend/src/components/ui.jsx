import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function Card({ title, description, children, actions, padded = true }) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="card-header">
          <div>
            {title && <h3 className="section-title">{title}</h3>}
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'card-body' : ''}>{children}</div>
    </div>
  );
}

export function Empty({ icon: Icon = Info, title = 'Nothing here yet', description }) {
  return (
    <div className="text-center py-10 text-slate-500">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
        <Icon size={22} />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs mt-1">{description}</p>}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
      <Loader2 className="animate-spin mr-2" size={18} /> {label}
    </div>
  );
}

export function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase();
  if (['approved','paid','active','resolved','completed','ready','registered','delivered','success'].includes(s)) return <span className="badge-green">{status}</span>;
  if (['pending','submitted','underreview','inprogress','in progress','scheduled','requested','initiated','draft','assigned','awaiting info'].includes(s)) return <span className="badge-amber">{status}</span>;
  if (['rejected','failed','cancelled','archived','hidden','closed'].includes(s)) return <span className="badge-red">{status}</span>;
  return <span className="badge-slate">{status}</span>;
}

export function Stat({ label, value, sub, icon: Icon }) {
  return (
    <div className="card card-body">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
          {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
        </div>
        {Icon && <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Icon size={20} /></div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-soft w-full ${sizes[size]}`} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="section-title">{title}</h3>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
