import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, MapPin, Search } from 'lucide-react';
import { api } from '../../lib/api.js';
import StatusBadge from '../../shared/StatusBadge.jsx';
import { MODULE_LABELS } from '../../shared/mapConfig.js';
import { formatDate } from '../../shared/issueUi.js';
import PageHeader from '../../shell/PageHeader.jsx';
import Button from '../../ui/Button.jsx';
import { Card, EmptyState, Segmented, Skeleton } from '../../ui/Surface.jsx';

const FILTERS = [
  { value: 'all', label: 'All' }, { value: 'submitted', label: 'Submitted' },
  { value: 'acknowledged', label: 'Acknowledged' }, { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];
const matches = (status, filter) => ({
  submitted: ['reported'], acknowledged: ['verified', 'assigned'], in_progress: ['in_progress'], resolved: ['resolved'],
}[filter] || []).includes(status);

export default function MyReportsPage() {
  const [issues, setIssues] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  useEffect(() => {
    api('GET', '/api/citizen/issues').then((d) => setIssues(d.issues)).catch((err) => setError(err.message));
  }, []);
  const shown = useMemo(() => issues?.filter((i) => (filter === 'all' || matches(i.status, filter)) && `${i.title} ${i.category.name} ${i.addressText || ''}`.toLowerCase().includes(search.toLowerCase())), [issues, filter, search]);

  return <>
    <PageHeader title="My reports" subtitle="Follow every issue you’ve raised through to resolution." actions={<Button to="/citizen/report" icon={Camera}>Report an issue</Button>} />
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="overflow-x-auto"><Segmented label="Filter reports" value={filter} onChange={setFilter} options={FILTERS} /></div>
        <label className="relative block w-full xl:max-w-xs"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><span className="sr-only">Search your reports</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reports" className="min-h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" /></label>
      </div>
      {!issues && <div className="mt-5 space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>}
      {issues && shown.length === 0 && <EmptyState icon={Camera} title={issues.length === 0 ? 'No reports yet' : 'No matching reports'} action={issues.length === 0 ? <Button to="/citizen/report">Report an issue</Button> : undefined}>{issues.length === 0 ? 'When you report a civic issue, you can track the response here.' : 'Try another status filter or search term.'}</EmptyState>}
      {shown?.length > 0 && <ul className="mt-4 divide-y divide-slate-100">{shown.map((i) => <li key={i.id}>
        <Link to={`/citizen/reports/${i.id}`} className="group flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
          {i.photoUrl ? <img src={i.photoUrl} alt="" width="88" height="72" loading="lazy" className="h-20 w-full rounded-xl object-cover sm:w-24" /> : <span className="grid h-20 w-full place-items-center rounded-xl bg-brand-50 text-brand-700 sm:w-24"><Camera size={22} /></span>}
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-slate-900 group-hover:text-brand-800">{i.title}</h2><StatusBadge status={i.status} /></div><p className="mt-1 text-sm text-slate-600">{i.category.name} <span className="text-slate-300">·</span> {MODULE_LABELS[i.category.module]}</p><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span>{formatDate(i.createdAt)}</span>{i.addressText && <span className="inline-flex items-center gap-1"><MapPin size={12} />{i.addressText}</span>}<span>Priority {i.severity}/5</span>{i.status !== 'resolved' && i.slaDeadline && <span>Expected by {formatDate(i.slaDeadline)}</span>}</div></div>
        </Link>
      </li>)}</ul>}
    </Card>
  </>;
}
