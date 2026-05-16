import { NavLink } from 'react-router';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
}

export function Sidebar({ navItems }: SidebarProps) {
  return (
    <aside
      className="fixed inset-y-0 left-0 w-60 bg-surface border-r border-border z-30 hidden md:flex md:flex-col"
      aria-label="主导航"
    >
      <div className="h-16 flex items-center px-5 border-b border-border">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">
            🗣️
          </span>
          <span className="text-xl font-bold text-brand-700">J-Say</span>
        </NavLink>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
              ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
              }`
            }
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
            ${
              isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-fg-muted hover:bg-surface-3 hover:text-fg'
            }`
          }
        >
          <span className="text-lg leading-none" aria-hidden="true">
            ⚙️
          </span>
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
