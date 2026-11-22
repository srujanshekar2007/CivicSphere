import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, Camera, CheckCircle2, Clock3, MapPinned, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../auth/useAuth.js';
import { api } from '../../lib/api.js';
import PageHeader from '../../shell/PageHeader.jsx';
import { Card, EmptyState, ModuleTile, Skeleton } from '../../ui/Surface.jsx';
import Button from '../../ui/Button.jsx';
import StatusBadge from '../../shared/StatusBadge.jsx';
import { ago } from '../../shared/issueUi.js';

function Metric({ icon: Icon, title, value, tone, note }) {
  return <Card className="flex items-start gap-3 p-4"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">{title}</p><p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900">{value ?? '—'}</p><p className="text-xs text-slate-500">{note}</p></div></Card>;
}

export default function CitizenHome() {
  const { session } = useAuth();
  const [issues, setIssues] = useState(null);
  const [cityIssues, setCityIssues] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [failed, setFailed] = useState(false);
  const [hour] = useState(() => new Date().getHours());
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 60 * 60 * 1000);
  useEffect(() => {
    let off = false;
    Promise.all([
      api('GET', '/api/citizen/issues'),
      api('GET', '/api/shared/map'),
      api('GET', '/api/public/alerts'),
    ]).then(([mine, map, alertData]) => {
      if (off) return;
      setIssues(mine.issues);
      setCityIssues(map.features.map((f) => f.properties));
      setAlerts(alertData.alerts || []);
    }).catch(() => { if (!off) setFailed(true); });
    return () => { off = true; };
  }, []);
  useEffect(() => {
    let active = true;
    const load = () => api('GET', '/api/public/alerts').then((data) => { if (active) setAlerts(data.alerts || []); }).catch(() => {});
    const timer = setInterval(load, 120000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const counts = useMemo(() => {
    if (!cityIssues) return null;
    const active = cityIssues.filter((i) => i.status !== 'resolved');
    return {
      active: active.length,
      critical: active.filter((i) => Number(i.severity) >= 4).length,
      resolved: cityIssues.filter((i) => i.status === 'resolved').length,
      personalResolvedWeek: issues?.filter((i) => i.resolvedAt && new Date(i.resolvedAt).getTime() >= weekAgo).length ?? null,
    };
  }, [cityIssues, issues, weekAgo]);
  const minePending = issues ? issues.filter((i) => i.status !== 'resolved').length : null;
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = session.user.fullName.split(' ')[0];

  return <>
    <PageHeader title={`${greet}, ${firstName}`} subtitle="Your reports and the latest from your city." actions={<Button to="/citizen/report" icon={Camera}>Report an issue</Button>} />
    {failed && <p role="status" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Some live information is temporarily unavailable. Your reports and account remain accessible.</p>}
    <section aria-labelledby="neighbourhood-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-brand-700">Live civic picture</p><h2 id="neighbourhood-title" className="mt-1 text-xl font-semibold text-slate-900">City overview</h2><p className="mt-1 text-sm text-slate-500">Current issue and alert activity across the mapped city area.</p></div><Link to="/citizen/map" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">Explore map <ArrowRight size={15} /></Link></div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {!counts ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />) : <>
          <Metric icon={MapPinned} title="Active city issues" value={counts.active} tone="bg-brand-50 text-brand-700" note="Open mapped reports" />
          <Metric icon={CheckCircle2} title="Resolved on map" value={counts.resolved} tone="bg-emerald-50 text-emerald-700" note="Mapped city reports" />
          <Metric icon={CheckCircle2} title="Resolved this week" value={counts.personalResolvedWeek ?? '…'} tone="bg-emerald-50 text-emerald-700" note="Your reports" />
          <Metric icon={Clock3} title="Pending complaints" value={minePending ?? '…'} tone="bg-sky-50 text-sky-700" note="Your open reports" />
          <Metric icon={ShieldAlert} title="Critical on map" value={counts.critical} tone="bg-red-50 text-red-700" note="Severity 4 or 5" />
          <Metric icon={Bell} title="Emergency alerts" value={alerts.length} tone="bg-amber-50 text-amber-800" note="Currently active" />
        </>}
      </div>
    </section>

    {alerts.length > 0 && <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-700"><Bell size={19} /></span><div className="min-w-0 flex-1"><h2 className="font-semibold text-amber-950">Active alerts</h2><ul className="mt-2 space-y-2">{alerts.slice(0, 3).map((a) => <li key={a.id} className="text-sm text-amber-950"><span className="font-semibold">{a.title}</span><span className="text-amber-800"> — {a.message}</span></li>)}</ul></div></div></section>}

    <section className="mt-7 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">My reports</h2><p className="mt-1 text-sm text-slate-500">A clear view of what you’ve submitted.</p></div><Link to="/citizen/reports" className="text-sm font-semibold text-brand-700">View all</Link></div>
        {!issues && <div className="mt-4 space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>}
        {issues?.length === 0 && <EmptyState icon={Camera} title="No reports yet" action={<Button to="/citizen/report">Report your first issue</Button>}>Your reports and their progress will appear here.</EmptyState>}
        {issues?.length > 0 && <ul className="mt-4 divide-y divide-slate-100">{issues.slice(0, 4).map((i) => <li key={i.id}><Link to={`/citizen/reports/${i.id}`} className="flex min-h-[68px] items-center gap-3 py-3"><ModuleTile module={i.category.module} size={40} /><span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-900">{i.title}</b><span className="text-xs text-slate-500">{i.category.name} · {ago(i.createdAt)} ago</span></span><StatusBadge status={i.status} /></Link></li>)}</ul>}
      </Card>
      <div className="space-y-4">
        <Card className="bg-[#103d33] text-white"><span className="grid size-10 place-items-center rounded-xl bg-white/10"><Clock3 size={20} /></span><h2 className="mt-4 text-lg font-semibold">Your contribution</h2><p className="mt-1 text-sm text-white/70">You have {issues?.length ?? '—'} reports, with {minePending ?? '—'} still in progress.</p><Link to="/citizen/reports" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-white">Track your reports <ArrowRight size={15} /></Link></Card>
        <Card><div className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><MapIcon size={19} /></span><div><h2 className="font-semibold text-slate-900">Understand the bigger picture</h2><p className="mt-1 text-sm leading-5 text-slate-500">See service performance, ward progress and city-wide trends.</p><Link to="/transparency" className="mt-3 inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand-700">View public dashboard <ArrowRight size={15} /></Link></div></div></Card>
      </div>
    </section>
  </>;
}
