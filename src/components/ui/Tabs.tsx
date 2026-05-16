import type { ReactNode } from 'react';

interface TabItem<T extends string | number> {
  value: T;
  label: ReactNode;
  count?: number;
  disabled?: boolean;
}

interface TabsProps<T extends string | number> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs<T extends string | number>({
  items,
  value,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps<T>) {
  if (variant === 'pills') {
    return (
      <div
        role="tablist"
        className={`inline-flex gap-1 p-1 bg-surface-2 border border-border rounded-lg ${className}`}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={String(item.value)}
              role="tab"
              aria-selected={active}
              disabled={item.disabled}
              onClick={() => onChange(item.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  active
                    ? 'bg-surface text-fg shadow-soft-sm'
                    : 'text-fg-muted hover:text-fg hover:bg-surface'
                }`}
            >
              {item.label}
              {item.count != null && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs rounded-full
                    ${active ? 'bg-brand-100 text-brand-700' : 'bg-surface-3 text-fg-subtle'}`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" className={`flex gap-2 border-b border-border ${className}`}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={String(item.value)}
            role="tab"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={`relative px-3 py-2.5 text-sm font-medium transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface
              disabled:opacity-50 disabled:cursor-not-allowed
              ${active ? 'text-brand-600' : 'text-fg-muted hover:text-fg'}`}
          >
            <span className="inline-flex items-center gap-1.5">
              {item.label}
              {item.count != null && (
                <span
                  className={`inline-flex items-center justify-center min-w-[1.25rem] px-1 py-0 text-xs rounded-full
                    ${active ? 'bg-brand-100 text-brand-700' : 'bg-surface-3 text-fg-subtle'}`}
                >
                  {item.count}
                </span>
              )}
            </span>
            {active && (
              <span
                className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600 rounded-full"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
