import { Link } from 'react-router-dom';
import Logo from '../ui/Logo.jsx';
export default function PublicShell({ children }) {
  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 px-4 sm:px-6">
          <Link to="/" className="py-2"><Logo /></Link>
          <nav className="flex items-center gap-1" aria-label="Public">
            <Link to="/transparency" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:flex">Transparency</Link>
            <Link to="/help" className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">Help</Link>
            <Link to="/open-data" className="hidden min-h-11 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 md:flex">Open data</Link>
            <Link to="/login" className="flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100">Log in</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">{children}</main>
    </div>
  );
}
