import type { ReactNode } from 'react';

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  variant?: 'default' | 'elevated' | 'flat';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
}

const variantStyles: Record<string, string> = {
  default: 'bg-surface border border-border shadow-soft-sm',
  elevated: 'bg-surface border border-border shadow-soft-md',
  flat: 'bg-surface-2 border border-transparent',
};

const paddingStyles: Record<string, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = '',
  variant = 'default',
  padding = 'md',
  onClick,
}: CardProps) {
  const interactive = !!onClick;
  return (
    <div
      className={`rounded-xl transition-all duration-150 ${variantStyles[variant]}
        ${interactive ? 'cursor-pointer hover:shadow-soft-md hover:-translate-y-0.5 hover:border-border-strong' : ''}
        ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 px-5 py-3 border-b border-border">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-fg truncate">{title}</h3>}
            {subtitle && <p className="text-xs text-fg-muted mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={`${paddingStyles[padding]} ${bodyClassName}`}>{children}</div>
    </div>
  );
}
