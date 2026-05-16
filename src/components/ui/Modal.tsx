import { type ReactNode, useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-neutral-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative z-10 bg-surface text-fg rounded-t-xl sm:rounded-xl shadow-soft-xl w-full ${sizeStyles[size]} sm:mx-4 max-h-[90vh] flex flex-col border border-border`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <h2 id="modal-title" className="text-lg font-semibold text-fg truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="text-fg-subtle hover:text-fg p-1 rounded-md hover:bg-surface-3 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-border flex justify-end gap-2">{footer}</div>
        )}
      </div>
    </div>
  );
}
