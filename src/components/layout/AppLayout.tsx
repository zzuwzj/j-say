import { NavLink, Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { MobileTabBar } from './MobileTabBar';

const navItems = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/topics', label: 'Topics', icon: '📚' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/vocabulary', label: 'Vocabulary', icon: '📖' },
  { to: '/stats', label: 'Stats', icon: '📊' },
];

const mobileNavItems = [
  { to: '/', label: '首页', icon: '🏠' },
  { to: '/topics', label: '题目', icon: '📚' },
  { to: '/history', label: '记录', icon: '📋' },
  { to: '/vocabulary', label: '词汇', icon: '📖' },
  { to: '/stats', label: '统计', icon: '📊' },
];

export function AppLayout() {
  return (
    <div className="min-h-screen bg-surface-2 flex">
      <Sidebar navItems={navItems} />
      <main className="flex-1 ml-0 md:ml-60 pb-16 md:pb-0">
        <div className="md:hidden sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-border px-4 h-14 flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-1.5">
            <span className="text-xl" aria-hidden="true">
              🗣️
            </span>
            <span className="text-lg font-bold text-brand-700">J-Say</span>
          </NavLink>
          <NavLink
            to="/settings"
            className="ml-auto p-2 rounded-md text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors"
            aria-label="设置"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </NavLink>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
      <MobileTabBar navItems={mobileNavItems} />
    </div>
  );
}
