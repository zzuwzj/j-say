import { forwardRef, type SelectHTMLAttributes } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles: Record<string, string> = {
  sm: 'h-8 text-sm pl-2.5 pr-8',
  md: 'h-10 text-sm pl-3 pr-9',
  lg: 'h-12 text-base pl-4 pr-10',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, size = 'md', className = '', children, ...props },
  ref,
) {
  return (
    <div className="relative inline-block w-full">
      <select
        ref={ref}
        className={`appearance-none w-full rounded-md border bg-surface text-fg outline-none transition-colors
          focus:ring-2 focus:ring-brand-400 focus:border-brand-500
          ${invalid ? 'border-danger-500' : 'border-border hover:border-border-strong'}
          ${sizeStyles[size]}
          ${className}`}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-subtle"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
});
