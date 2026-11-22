import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { compressImage } from '../../lib/imageCompress.js';
import Field from '../../shared/Field.jsx';
import LocationPicker from '../../shared/LocationPicker.jsx';
import { MODULES } from '../../shared/mapConfig.js';
import { SEVERITY_LABELS } from '../../shared/issueUi.js';
import { ArrowLeft, ArrowRight, MapPin, Send } from 'lucide-react';

const selectClass =
  'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200';

export default function ReportIssuePage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ categoryId: '', title: '', description: '', severity: 3 });
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    api('GET', '/api/shared/categories')
      .then((d) => setCategories(d.categories.filter((c) => c.module !== 'public_service')))
      .catch((err) => setError(err.message));
  }, []);

  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : '', [photo]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const suggestedCategory = (() => {
    const text = `${form.title} ${form.description}`.toLowerCase();
    const rules = [
      [/flood|waterlog|rain|drain|sewer/i, 'flood'],
      [/pothole|road|crack|pavement/i, 'road'],
      [/light|lamp|streetlight|dark/i, 'streetlight'],
      [/fire|smoke|burn/i, 'fire'],
    ];
    const module = rules.find(([pattern]) => pattern.test(text))?.[1];
    return module ? categories.find((c) => c.module === module) : null;
  })();

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhoto(await compressImage(file));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');

    const problems = {};
    if (!form.categoryId) problems.categoryId = 'Choose what kind of problem this is';
    if (form.title.trim().length < 3) problems.title = 'Title must be at least 3 characters';
    if (!location) problems.location = 'Choose the location on the map';
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;

    const fd = new FormData();
    fd.append('categoryId', form.categoryId);
    fd.append('title', form.title);
    if (form.description) fd.append('description', form.description);
    fd.append('severity', String(form.severity));
    fd.append('latitude', String(location.lat));
    fd.append('longitude', String(location.lng));
    if (photo) fd.append('photo', photo);

    setBusy(true);
    setUploadPercent(0);
    try {
      setResult(await api('POST', '/api/citizen/issues', fd, {
        onUploadProgress: (loaded, total) => setUploadPercent(Math.min(100, Math.round((loaded / total) * 100))),
      }));
    } catch (err) {
      const fromServer = {};
      for (const item of err.errors || []) {
        if (!fromServer[item.field]) fromServer[item.field] = item.message;
      }
      setFieldErrors(fromServer);
      if (Object.keys(fromServer).length === 0) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function nextStep() {
    const problems = {};
    if (step === 0 && !form.categoryId) problems.categoryId = 'Choose what kind of problem this is';
    if (step === 1 && form.title.trim().length < 3) problems.title = 'Title must be at least 3 characters';
    if (step === 3 && !location) problems.location = 'Choose the location on the map';
    setFieldErrors(problems);
    if (Object.keys(problems).length === 0) setStep((n) => Math.min(n + 1, 4));
  }

  if (result) {
    return (
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-emerald-700">
          {result.merged ? 'Added to an existing report' : 'Report submitted'}
        </h1>
        <p className="text-slate-700">
          {result.alreadyReported
            ? 'You have already reported this problem. Thank you.'
            : result.merged
              ? 'Someone already reported this problem here. Your report was added to it, which raises its priority.'
              : 'Thank you. The authorities can now see it, and you can follow its progress.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/citizen/reports" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-600 px-4 font-medium text-white hover:bg-emerald-700">
            My reports
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setStep(0);
              setForm({ categoryId: '', title: '', description: '', severity: 3 });
              setLocation(null);
              setPhoto(null);
            }}
            className="min-h-11 rounded-lg border border-slate-300 px-4 hover:bg-slate-100"
          >
            Report another
          </button>
        </div>
      </section>
    );
  }

  const photoButton =
    'inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-4 text-base hover:bg-slate-50';

  const steps = ['Category', 'Details', 'Photo', 'Location', 'Review'];
  return (
    <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" noValidate>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.13em] text-brand-700">Citizen report</p><h1 className="mt-1 text-2xl font-semibold text-slate-900">Report an issue</h1><p className="mt-1 text-sm text-slate-500">A few details help the right team respond faster.</p></div><span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">Step {step + 1} of 5</span></div>

      <ol className="grid grid-cols-5 gap-2" aria-label="Report steps">{steps.map((name, index) => <li key={name} className="min-w-0"><div className={`h-1.5 rounded-full ${index <= step ? 'bg-brand-600' : 'bg-slate-100'}`} /><p className={`mt-2 truncate text-[11px] font-medium sm:text-xs ${index === step ? 'text-brand-800' : 'text-slate-400'}`}>{name}</p></li>)}</ol>

      {step === 0 && <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-700">
          What is the problem?
        </label>
        <select id="category" value={form.categoryId} onChange={set('categoryId')} className={selectClass}>
          <option value="">Choose…</option>
          {MODULES.filter((m) => m.id !== 'public_service').map((m) => (
            <optgroup key={m.id} label={m.label}>
              {categories
                .filter((c) => c.module === m.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {fieldErrors.categoryId && <p className="mt-1 text-sm text-red-600">{fieldErrors.categoryId}</p>}
        <p className="mt-2 text-xs text-slate-500">Choose the closest category. The service team can refine it after review.</p>
      </div>}

      {step === 1 && <div className="space-y-4"><Field id="title" label="Short title" type="text" maxLength={120} value={form.title} onChange={set('title')} error={fieldErrors.title} />
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700">Details (optional)</label>
        <textarea id="description" rows={4} maxLength={1000} value={form.description} onChange={set('description')} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100" placeholder="What happened? Include helpful details such as nearby landmarks." />
        <p className="mt-1 text-right text-xs text-slate-400">{form.description.length}/1000</p>
      </div>
      {suggestedCategory && <button type="button" onClick={() => setForm((f) => ({ ...f, categoryId: String(suggestedCategory.id) }))} className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-left text-sm text-brand-900 hover:bg-brand-100"><span className="font-semibold">Suggested category: {suggestedCategory.name}</span><span className="mt-0.5 block text-xs">Based on wording in your description. Select to confirm.</span></button>}

      <fieldset>
        <legend className="block text-sm font-medium text-slate-700">How serious is it?</legend>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className={`flex min-h-11 cursor-pointer flex-col items-center justify-center rounded-lg border text-center text-xs ${
                Number(form.severity) === n ? 'border-emerald-600 bg-emerald-50 font-semibold text-emerald-800' : 'border-slate-300'
              }`}
            >
              <input type="radio" name="severity" value={n} checked={Number(form.severity) === n} onChange={set('severity')} className="sr-only" />
              <span className="text-base">{n}</span>
              {SEVERITY_LABELS[n]}
            </label>
          ))}
        </div>
      </fieldset>
      </div>}

      {step === 2 && <div>
        <p className="block text-sm font-medium text-slate-700">Photo (optional)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className={photoButton}>
            Take a photo
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="sr-only" />
          </label>
          <label className={photoButton}>
            Choose from gallery
            <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
          </label>
          {photo && (
            <button type="button" onClick={() => setPhoto(null)} className="min-h-11 rounded-lg px-3 text-sm text-slate-600 hover:bg-slate-100">
              Remove
            </button>
          )}
        </div>
        {preview && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-2"><img src={preview} alt="Preview of your photo" className="size-24 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{photo.name}</p><p className="text-xs text-slate-500">Photo ready to attach</p></div></div>
        )}
        <p className="mt-2 text-xs text-slate-500">A photo helps crews understand the problem. It is optional.</p>
      </div>}

      {step === 3 && <div>
        <p className="block text-sm font-medium text-slate-700">Where is it?</p>
        <div className="mt-2">
          <LocationPicker value={location} onChange={setLocation} />
        </div>
        {fieldErrors.location && <p className="mt-1 text-sm text-red-600">{fieldErrors.location}</p>}
        {location && <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-brand-800"><MapPin size={15} /> Location selected · {Number(location.lat).toFixed(5)}, {Number(location.lng).toFixed(5)}</p>}
      </div>}

      {step === 4 && <section className="space-y-4 rounded-xl bg-slate-50 p-4 sm:p-5"><h2 className="font-semibold text-slate-900">Review your report</h2><dl className="grid gap-3 text-sm sm:grid-cols-[130px_1fr]"><dt className="text-slate-500">Category</dt><dd className="font-medium text-slate-800">{categories.find((c) => String(c.id) === String(form.categoryId))?.name || '—'}</dd><dt className="text-slate-500">Issue</dt><dd className="font-medium text-slate-800">{form.title}</dd><dt className="text-slate-500">Details</dt><dd className="whitespace-pre-wrap text-slate-700">{form.description || 'No extra details'}</dd><dt className="text-slate-500">Priority</dt><dd className="text-slate-700">{SEVERITY_LABELS[form.severity]}</dd><dt className="text-slate-500">Location</dt><dd className="text-slate-700">{location ? `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}` : 'Not selected'}</dd><dt className="text-slate-500">Photo</dt><dd className="text-slate-700">{photo ? photo.name : 'No photo attached'}</dd></dl><p className="text-xs leading-5 text-slate-500">By submitting, you confirm this report describes a real civic issue. Similar nearby reports may be grouped together to help prioritize the response.</p></section>}

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {busy && <div aria-live="polite" className="space-y-1.5"><div className="flex justify-between gap-3 text-xs text-slate-600"><span>{uploadPercent >= 100 ? 'Upload complete. Submitting report…' : 'Uploading report…'}</span><span>{uploadPercent}%</span></div><div role="progressbar" aria-label="Report upload progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={uploadPercent} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-[width] duration-150" style={{ width: `${uploadPercent}%` }} /></div></div>}

      <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        {step > 0 ? <button type="button" onClick={() => { setFieldErrors({}); setStep((n) => Math.max(0, n - 1)); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ArrowLeft size={16} /> Back</button> : <span />}
        <button type="submit" disabled={busy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:opacity-60">{busy ? 'Uploading…' : step === 4 ? <><Send size={16} /> Submit report</> : <>Continue <ArrowRight size={16} /></>}</button>
      </div>
    </form>
  );
}
