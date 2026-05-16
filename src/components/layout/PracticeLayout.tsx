import { Link, Outlet } from 'react-router';

export function PracticeLayout() {
  return (
    <div className="min-h-screen bg-surface-2 text-fg">
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border px-4 h-14 flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-fg-muted hover:text-fg text-sm font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          首页
        </Link>
        <span className="text-lg font-bold text-fg">J-Say</span>
      </div>
      <Outlet />
    </div>
  );
}
