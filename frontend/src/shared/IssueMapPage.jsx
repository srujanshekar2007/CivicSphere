import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../ui/toastContext.js';
import PageHeader from '../shell/PageHeader.jsx';
import Button from '../ui/Button.jsx';
import { ModuleTile } from '../ui/Surface.jsx';
import IssueMap from './IssueMap.jsx';
import StatusBadge from './StatusBadge.jsx';
import { ago } from './issueUi.js';
import { MODULES } from './mapConfig.js';

export default function IssueMapPage({ admin = false }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [zones, setZones] = useState(null);
  const [areas, setAreas] = useState(null);
  const [sel, setSel] = useState(null);
  const [error, setError] = useState('');
  const [key, setKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      api('GET', '/api/shared/map'),
      api('GET', '/api/shared/flood-zones').catch(() => null),
      api('GET', '/api/shared/alert-areas').catch(() => null), // arrives in Step 5; the map works without it
    ])
      .then(([m, z, a]) => { setData(m); setZones(z); setAreas(a); })
      .catch((e) => setError(e.message));
  }, [key]);

  async function verify() {
    try {
      await api('POST', `/api/admin/issues/${sel.id}/transition`, { to: 'verified' });
      toast('Issue verified');
      setSel({ ...sel, status: 'verified' });
      setKey((k) => k + 1);
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const visible = data ? { ...data, features: data.features.filter((f) =>
    (statusFilter === 'all' || f.properties.status === statusFilter) &&
    (moduleFilter === 'all' || f.properties.module === moduleFilter)
  ) } : null;
  const open = visible ? visible.features.filter((f) => f.properties.status !== 'resolved').length : 0;

  return (
    <>
      <PageHeader title={admin ? 'City map' : 'Explore the city'} subtitle={data ? `${open} open · ${visible.features.length} shown` : 'Reported civic issues across the city'} />
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="relative h-[calc(100dvh-15rem)] min-h-[440px] lg:h-[calc(100dvh-11rem)]">
        {visible && <IssueMap className="h-full" collection={visible} zones={zones} areas={areas} onSelect={setSel} />}
        <div className="absolute left-3 right-3 top-3 z-20 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-md sm:left-4 sm:right-auto sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">Status<select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setSel(null); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800"><option value="all">All statuses</option><option value="reported">Submitted</option><option value="verified">Acknowledged</option><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">Service<select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setSel(null); }} className="min-h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800"><option value="all">All services</option>{MODULES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
        </div>
        {sel && (
          <div className="absolute inset-x-3 bottom-3 z-20 rounded-2xl bg-white p-4 shadow-xl lg:inset-x-auto lg:bottom-3 lg:right-3 lg:w-80">
            <div className="flex gap-3">
              <ModuleTile module={sel.module} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{sel.title}</p>
                <p className="text-xs text-slate-500">#CS-{sel.id} · {sel.category} · {ago(sel.createdAt)} ago{Number(sel.duplicateCount) > 1 ? ` · ${sel.duplicateCount} reports` : ''}</p>
                <div className="mt-1"><StatusBadge status={sel.status} /></div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setSel(null)} className="grid size-11 place-items-center rounded-xl text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            {admin && (
              <div className="mt-3 flex gap-2">
                {sel.status === 'reported' && <Button className="flex-1" onClick={verify}>Verify</Button>}
                <Button variant="secondary" className="flex-1" to={`/admin/issues/${sel.id}`}>Open details</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
