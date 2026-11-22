import { useEffect, useState } from 'react';
import { Bell, CheckCheck, MapPin, ShieldAlert } from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../auth/useAuth.js';
import PageHeader from '../../shell/PageHeader.jsx';
import { Card, EmptyState, Skeleton } from '../../ui/Surface.jsx';
import Button from '../../ui/Button.jsx';

function readIds(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}

export default function AlertsPage() {
  const { session } = useAuth();
  const key = `civicsync.read-alerts:${session.user.id}`;
  const [alerts, setAlerts] = useState(null);
  const [read, setRead] = useState(() => readIds(key));
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const load = () => api('GET', '/api/public/alerts').then((d) => { if (active) setAlerts(d.alerts || []); }).catch((e) => { if (active) setError(e.message); });
    load();
    const timer = setInterval(load, 120000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  function markRead(id) {
    setRead((current) => { const next = new Set(current).add(id); localStorage.setItem(key, JSON.stringify([...next])); return next; });
  }
  function markAll() {
    const next = new Set((alerts || []).map((a) => a.id));
    setRead(next); localStorage.setItem(key, JSON.stringify([...next]));
  }
  const unread = alerts?.filter((a) => !read.has(a.id)).length || 0;
  return <>
    <PageHeader title="Alert centre" subtitle="Current public safety and service notices." actions={unread > 0 && <Button variant="outline" icon={CheckCheck} onClick={markAll}>Mark all read</Button>} />
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => window.location.reload()} className="min-h-9 rounded-lg px-3 font-semibold hover:bg-white">Retry</button></div>}
    <Card>
      {alerts === null && !error && <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}
      {alerts?.length === 0 && <EmptyState icon={Bell} title="No active alerts">There are no current public alerts. New notices will appear here.</EmptyState>}
      {alerts?.length > 0 && <ul className="divide-y divide-slate-100">{alerts.map((alert) => {
        const isRead = read.has(alert.id);
        return <li key={alert.id} className="py-4 first:pt-1 last:pb-1"><article className={`flex gap-3 rounded-xl p-3 ${isRead ? '' : 'bg-amber-50/70'}`}><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isRead ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'}`}><ShieldAlert size={19} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{alert.title}</h2>{!isRead && <span className="size-2 rounded-full bg-brand-600" aria-label="Unread" />}</div><p className="mt-1 text-sm leading-6 text-slate-600">{alert.message}</p><div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500"><span className="font-semibold uppercase">{alert.severity || 'Public notice'}</span>{alert.locationName && <span className="inline-flex items-center gap-1"><MapPin size={12} />{alert.locationName}</span>}{alert.startsAt && <time dateTime={alert.startsAt}>{new Date(alert.startsAt).toLocaleString()}</time>}</div></div>{!isRead && <button type="button" onClick={() => markRead(alert.id)} className="min-h-10 shrink-0 self-center rounded-lg px-3 text-xs font-semibold text-brand-800 hover:bg-white">Mark read</button>}</article></li>;
      })}</ul>}
      {alerts?.length > 0 && unread === 0 && <p className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-500"><CheckCheck size={16} /> You’re up to date on these alerts.</p>}
    </Card>
    <p className="mt-4 text-xs leading-5 text-slate-500">Alerts are shown according to the geographic area selected by city administrators. This device keeps your read state in this browser.</p>
  </>;
}
