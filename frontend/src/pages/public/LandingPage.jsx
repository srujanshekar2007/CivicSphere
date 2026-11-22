import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Bell, CheckCircle2, MapPinned, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../lib/api.js';
import Logo from '../../ui/Logo.jsx';
import { useAuth } from '../../auth/useAuth.js';

const features = [
  { icon: MapPinned, title: 'See what’s happening nearby', text: 'Explore reported problems, closures and active alerts on one city map.' },
  { icon: Activity, title: 'Follow every report', text: 'Track progress from the first report through verified resolution.' },
  { icon: ShieldCheck, title: 'Accountable by design', text: 'Public performance data shows where work is moving and where it needs attention.' },
];

export default function LandingPage() {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    api('GET', '/api/public/transparency').then(setData).catch(() => {});
    let active = true;
    const loadAlerts = () => api('GET', '/api/public/alerts').then((d) => { if (active) setAlerts(d.alerts || []); }).catch(() => {});
    loadAlerts();
    const timer = setInterval(loadAlerts, 120000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  const totals = data?.totals;
  const reportTo = session ? (session.portal === 'admin' ? '/admin' : '/citizen/report') : '/register';
  const accountTo = session ? (session.portal === 'admin' ? '/admin' : '/citizen') : '/register';
  const metrics = [
    ['Issues reported', totals?.reported],
    ['Resolved', totals?.resolved],
    ['Currently open', totals?.open],
  ];
  return (
    <div className="landing-page min-h-dvh bg-white text-slate-900">
      <header className="landing-header border-b border-slate-200/80 bg-white/95">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
          <Link to="/" aria-label="CivicSync home"><Logo /></Link>
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Main navigation">
            <Link to="/transparency" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:flex">Transparency</Link>
            <Link to="/open-data" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 md:flex">Open data</Link>
            <Link to="/login" className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex">Log in</Link>
            <Link to={accountTo} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl bg-brand-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 sm:px-4">{session ? 'Open dashboard' : 'Join CivicSync'}</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="landing-hero relative overflow-hidden bg-[#f4f8f6]">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:py-20 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:py-24">
            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[.12em] text-brand-800"><Sparkles size={14} /> A clearer view of city life</p>
              <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">Better cities start with people who speak up.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Report local problems, follow the response, and see how your city is doing. One shared place for citizens and the teams who keep neighborhoods moving.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={reportTo} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-semibold text-white shadow-sm transition hover:bg-brand-800">{session?.portal === 'citizen' ? 'Report an issue' : session?.portal === 'admin' ? 'Open operations centre' : 'Report an issue'} <ArrowRight size={17} /></Link>
                <Link to="/transparency" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 transition hover:bg-slate-50"><MapPinned size={17} /> Explore city performance</Link>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 size={17} className="text-brand-700" /> Your report stays trackable from submission to resolution.</div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-8 rounded-[2rem] bg-[#dcebe4] blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-3 shadow-[0_30px_80px_-36px_rgba(15,60,47,.35)]">
                <div className="relative min-h-[340px] overflow-hidden rounded-[1.2rem] bg-[#e8f0e9] sm:min-h-[410px]">
                  <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'linear-gradient(35deg,transparent 46%,#fff 47%,#fff 51%,transparent 52%),linear-gradient(120deg,transparent 38%,#fff 39%,#fff 43%,transparent 44%),linear-gradient(0deg,transparent 48%,#d1ded4 49%,#d1ded4 51%,transparent 52%)', backgroundSize: '180px 150px,220px 190px,100% 130px' }} />
                  <div className="absolute left-[14%] top-[24%] h-24 w-36 rounded-[40%] bg-[#d2e3d3]" />
                  <div className="absolute bottom-[14%] right-[12%] h-28 w-40 rounded-[45%] bg-[#d3e4d4]" />
                  <div className="absolute left-[16%] top-[28%] grid size-10 place-items-center rounded-full border-4 border-white bg-brand-700 text-white shadow-lg"><Activity size={17} /></div>
                  <div className="absolute left-[55%] top-[45%] grid size-10 place-items-center rounded-full border-4 border-white bg-amber-500 text-white shadow-lg"><MapPinned size={17} /></div>
                  <div className="absolute right-[18%] top-[21%] grid size-10 place-items-center rounded-full border-4 border-white bg-red-500 text-white shadow-lg"><Bell size={17} /></div>
                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-lg backdrop-blur">
                    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Civic activity</p><p className="mt-1 font-semibold text-slate-900">A more connected neighborhood</p></div><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700"><MapPinned size={20} /></span></div>
                    <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200">{metrics.map(([label, value]) => <div key={label} className="px-2 first:pl-0"><p className="text-lg font-bold text-slate-900">{value ?? '—'}</p><p className="text-[11px] leading-4 text-slate-500">{label}</p></div>)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {alerts.length > 0 && <section className="border-y border-amber-200 bg-amber-50"><div className="mx-auto flex max-w-7xl items-start gap-3 px-5 py-4 lg:px-8"><Bell size={19} className="mt-0.5 shrink-0 text-amber-700" /><div><p className="font-semibold text-amber-950">Active city alerts</p><p className="mt-0.5 text-sm text-amber-900">{alerts.slice(0, 2).map((a) => a.title).join(' · ')}{alerts.length > 2 ? ` · +${alerts.length - 2} more` : ''}</p></div><Link to="/transparency" className="ml-auto shrink-0 text-sm font-semibold text-amber-900 underline">Details</Link></div></section>}

        <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
          <div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[.13em] text-brand-700">A practical way to make a difference</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Your report becomes part of the city’s response.</h2></div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">{features.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon size={21} /></span><p className="mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">0{index + 1}</p><h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div>
        </section>
        <section className="bg-[#103d33] text-white"><div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><p className="text-sm font-semibold uppercase tracking-[.12em] text-emerald-200">A shared civic picture</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Small local actions. Visible city-wide progress.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">CivicSync connects issue reporting, service teams and public performance information in one transparent workflow.</p></div><Link to={accountTo} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 font-semibold text-brand-900 hover:bg-emerald-50">{session ? 'Open dashboard' : 'Get started'} <ArrowRight size={17} /></Link></div></section>
      </main>
      <footer className="border-t border-slate-200"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© {new Date().getFullYear()} CivicSync · A better way to work on city issues.</span><nav className="flex gap-5"><Link to="/transparency" className="hover:text-brand-700">Transparency</Link><Link to="/open-data" className="hover:text-brand-700">Open data</Link><Link to="/login" className="hover:text-brand-700">Log in</Link></nav></div></footer>
    </div>
  );
}
