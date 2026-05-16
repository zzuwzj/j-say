import { forwardRef, type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className = '', ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={`block w-full rounded-md border bg-surface text-fg placeholder:text-fg-subtle px-3 py-2 text-sm outline-none transition-colors
        focus:ring-2 focus:ring-brand-400 focus:border-brand-500
        ${invalid ? 'border-danger-500' : 'border-border hover:border-border-strong'}
        ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
});
