import { useEffect, useState } from 'react';
import { ArrowRight, Bot, CircleHelp, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import PublicShell from '../../shared/PublicShell.jsx';

const STATUS = {
  reported: 'Submitted. Your report is in the queue for review.',
  verified: 'Acknowledged. The report has been reviewed and confirmed.',
  assigned: 'Assigned. A service team member has been assigned to the issue.',
  in_progress: 'In progress. The service team is working on the issue.',
  resolved: 'Resolved. The service team has marked it fixed. Open your report to confirm the result or ask to reopen it.',
};

export default function CivicHelpPage() {
  const [categories, setCategories] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);
  useEffect(() => { api('GET', '/api/open/v1/categories').then((d) => setCategories(d.data)).catch(() => setCategoriesError(true)).finally(() => setLoading(false)); }, []);

  function ask(text) {
    setQuestion(text);
    const q = text.toLowerCase();
    const matchedStatus = Object.keys(STATUS).find((s) => q.includes(s.replace('_', ' ')) || q.includes(s));
    if (/status|mean|track|progress/.test(q) && matchedStatus) {
      setAnswer(`${STATUS[matchedStatus]} Track your report from My reports.`); return;
    }
    if (/track|my report|complaint/.test(q)) { setAnswer('Open My reports to see each issue’s current status and activity timeline. Select any report for details.'); return; }
    if (/report|submit|start/.test(q)) { setAnswer('Choose Report an issue, select the closest category, describe the problem, add a photo if available, pin the location, then review and submit. Similar nearby reports may be combined.'); return; }
    const matched = categories.find((c) => q.includes(c.name.toLowerCase()) || c.name.toLowerCase().split(/\s+/).some((w) => w.length > 4 && q.includes(w)));
    if (matched) { setAnswer(`${matched.name} is handled under ${matched.module.replaceAll('_', ' ')}. Choose “${matched.name}” when reporting this problem.`); return; }
    const mapping = [
      [/pothole|road|pavement|crack/, 'road safety'], [/street ?light|lamp|dark road/, 'streetlights'],
      [/flood|waterlog|rain|drain|sewer/, 'flood and waterlogging'], [/fire|smoke/, 'fire emergency'],
    ];
    const service = mapping.find(([re]) => re.test(q))?.[1];
    if (service) { setAnswer(`This sounds related to ${service}. Browse the category list when you report to choose the closest match.`); return; }
    if (/emergency|danger|urgent/.test(q)) { setAnswer('For immediate danger or a life-threatening emergency, contact your local emergency services. CivicSync reports are for tracking civic service issues.'); return; }
    setAnswer('I can help with reporting, issue categories, tracking, and status meanings. Try asking “How do I report a pothole?” or “What does in progress mean?”');
  }

  const suggestions = ['How do I report an issue?', 'Which team handles potholes?', 'What does in progress mean?', 'How can I track my report?'];
  return <PublicShell>
    <section className="mx-auto w-full max-w-3xl">
      <div className="text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Bot size={26} /></span><p className="mt-4 text-xs font-semibold uppercase tracking-[.14em] text-brand-700">CivicSync help</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">How can we help?</h1><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">Ask about reporting a civic issue, choosing a category, tracking a report, or understanding its status.</p></div>
      <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"><form onSubmit={(e) => { e.preventDefault(); if (question.trim()) ask(question.trim()); }} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor="question">Ask CivicSync</label><div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="For example, how do I report a pothole?" className="min-h-12 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></div><button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">Ask <ArrowRight size={16} /></button></form>
        {!answer ? <div className="mt-5"><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Common questions</p><div className="flex flex-wrap gap-2">{suggestions.map((s) => <button key={s} type="button" onClick={() => ask(s)} className="min-h-10 rounded-full border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800">{s}</button>)}</div></div> : <div className="mt-5 rounded-xl bg-brand-50 p-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-800"><CircleHelp size={15} /> CivicSync guide</p><p className="mt-2 text-sm leading-6 text-slate-800">{answer}</p></div>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>{loading ? 'Loading service categories…' : categoriesError ? 'Service categories are temporarily unavailable.' : `${categories.length} current service categories available`}</span><Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Sign in to view your reports</Link></div>
      <p className="mt-5 text-center text-xs leading-5 text-slate-400">This guide uses predefined answers and current service categories. It does not use AI or inspect uploaded photographs.</p>
    </section>
  </PublicShell>;
}
