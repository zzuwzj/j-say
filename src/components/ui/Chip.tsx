import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  active?: boolean;
  size?: 'sm' | 'md';
  leading?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}

const sizeStyles: Record<string, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
};

export function Chip({
  active = false,
  size = 'md',
  leading,
  trailing,
  children,
  className = '',
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`inline-flex items-center rounded-full font-medium transition-colors duration-150
        focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-1 focus-visible:ring-offset-surface
        ${sizeStyles[size]}
        ${
          active
            ? 'bg-brand-600 text-white border border-brand-600 hover:bg-brand-700'
            : 'bg-surface text-fg-muted border border-border hover:bg-surface-3 hover:text-fg'
        }
        ${className}`}
      {...props}
    >
      {leading && <span className="shrink-0">{leading}</span>}
      <span>{children}</span>
      {trailing && <span className="shrink-0">{trailing}</span>}
    </button>
  );
}
