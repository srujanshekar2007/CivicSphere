import { useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, Crown, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { api } from '../../lib/api.js';
import PageHeader from '../../shell/PageHeader.jsx';
import { Badge, Card, Skeleton } from '../../ui/Surface.jsx';
import { formatHours } from '../../shared/issueUi.js';

function Stat({ icon: Icon, label, value, description }) {
  return <Card className="p-4"><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={19} /></span><p className="mt-3 text-xs font-medium text-slate-500">{label}</p><p className="mt-0.5 text-2xl font-semibold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{description}</p></Card>;
}

export default function CommunityPage() {
  const [issues, setIssues] = useState(null);
  const [transparency, setTransparency] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('GET', '/api/citizen/issues'), api('GET', '/api/public/transparency')])
      .then(([mine, city]) => { setIssues(mine.issues); setTransparency(city); })
      .catch((e) => setError(e.message));
  }, []);
  const verified = useMemo(() => issues?.filter((i) => i.confirmedAt) ?? [], [issues]);
  const points = verified.length * 10;
  const nextBadge = verified.length < 1 ? 'First confirmed report' : verified.length < 5 ? 'Community builder · 5 reports' : 'Neighborhood champion';
  return <>
    <PageHeader title="Community impact" subtitle="See how confirmed reports and neighborhood progress add up." />
    {error && <Card className="mb-4" role="alert"><p className="text-sm text-red-700">Could not load community information: {error}</p><button type="button" onClick={() => window.location.reload()} className="mt-3 min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Reload page</button></Card>}
    {!error && (!issues || !transparency) ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /><Skeleton className="h-36" /></div> : !error && <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Award} label="Contribution points" value={points} description="10 for each citizen-confirmed fix" />
        <Stat icon={ShieldCheck} label="Verified contributions" value={verified.length} description="Your reports with a confirmed fix" />
        <Stat icon={Users} label="Reports submitted" value={issues.length} description="Unique issues you reported" />
        <Stat icon={CheckCircle2} label="City resolution rate" value={`${transparency.totals.reported ? Math.round((100 * transparency.totals.resolved) / transparency.totals.reported) : 0}%`} description="Based on all recorded reports" />
      </section>
      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="relative overflow-hidden bg-[#103d33] text-white"><span className="grid size-11 place-items-center rounded-xl bg-white/10"><Crown size={21} /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[.13em] text-emerald-200">Next achievement</p><h2 className="mt-1 text-xl font-semibold">{nextBadge}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-white/75">Only reports that have been marked fixed and confirmed by a citizen count toward contribution points. Duplicate reports from the same person are grouped.</p><div className="mt-5 flex flex-wrap gap-2">{verified.length >= 1 && <Badge tone="green"><CheckCircle2 size={13} /> First verified fix</Badge>}{verified.length >= 5 && <Badge tone="green"><Sparkles size={13} /> Community builder</Badge>}{verified.length === 0 && <Badge tone="slate">Your first badge is waiting</Badge>}</div></Card>
        <Card><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Ward progress</h2><p className="mt-1 text-sm text-slate-500">Areas with the strongest issue resolution rates.</p></div><Users size={19} className="text-slate-400" /></div><ol className="mt-4 divide-y divide-slate-100">{transparency.wards.slice(0, 5).map((ward) => <li key={ward.ward} className="flex items-center gap-3 py-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${ward.rank ? 'bg-brand-50 text-brand-800' : 'bg-slate-100 text-slate-400'}`}>{ward.rank ?? '–'}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{ward.ward}</p><p className="text-xs text-slate-500">{ward.resolved} of {ward.total} resolved · avg {formatHours(ward.avgResolutionHours)}</p></div><span className="text-sm font-semibold text-slate-700">{ward.resolutionRate}%</span></li>)}{transparency.wards.length === 0 && <li className="py-6 text-center text-sm text-slate-500">Ward progress will appear as reports are recorded.</li>}</ol></Card>
      </section>
    </div>}
    <p className="mt-4 text-xs leading-5 text-slate-500">Points are calculated from your own report history and are not transferable. A contribution is verified only after an issue has been resolved and a citizen has confirmed the fix.</p>
  </>;
}
