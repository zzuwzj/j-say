import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  leading?: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles: Record<string, string> = {
  sm: 'h-8 text-sm px-2.5',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-base px-4',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leading, trailing, invalid, size = 'md', className = '', ...props },
  ref,
) {
  const hasAffix = !!leading || !!trailing;

  if (hasAffix) {
    return (
      <div
        className={`flex items-center rounded-md border bg-surface transition-colors
          focus-within:ring-2 focus-within:ring-brand-400 focus-within:border-brand-500
          ${invalid ? 'border-danger-500' : 'border-border hover:border-border-strong'}
          ${className}`}
      >
        {leading && (
          <span className="pl-3 text-fg-subtle flex items-center pointer-events-none">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          className={`flex-1 bg-transparent outline-none text-fg placeholder:text-fg-subtle
            ${sizeStyles[size]}
            ${leading ? 'pl-2' : ''} ${trailing ? 'pr-2' : ''}`}
          aria-invalid={invalid || undefined}
          {...props}
        />
        {trailing && (
          <span className="pr-3 text-fg-subtle flex items-center">{trailing}</span>
        )}
      </div>
    );
  }

  return (
    <input
      ref={ref}
      className={`block w-full rounded-md border bg-surface text-fg placeholder:text-fg-subtle outline-none transition-colors
        focus:ring-2 focus:ring-brand-400 focus:border-brand-500
        ${invalid ? 'border-danger-500' : 'border-border hover:border-border-strong'}
        ${sizeStyles[size]}
        ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});
