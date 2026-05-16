import { NavLink } from 'react-router';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

interface MobileTabBarProps {
  navItems: NavItem[];
}

export function MobileTabBar({ navItems }: MobileTabBarProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-border"
      aria-label="主导航"
    >
      <ul className="flex items-stretch">
        {navItems.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors
                ${isActive ? 'text-brand-600' : 'text-fg-subtle hover:text-fg'}`
              }
            >
              <span className="text-xl leading-none" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" aria-hidden="true" />
    </nav>
  );
}
