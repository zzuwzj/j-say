interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Switch({ checked, onChange, label, disabled = false, size = 'md' }: SwitchProps) {
  const trackSize = size === 'sm' ? 'h-4 w-7' : 'h-5 w-9';
  const thumbSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const thumbTranslate = size === 'sm' ? 'translate-x-3' : 'translate-x-4';

  return (
    <label
      className={`inline-flex items-center gap-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex ${trackSize} shrink-0 rounded-full border border-transparent transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface
          ${checked ? 'bg-brand-600' : 'bg-surface-3 border-border'}`}
      >
        <span
          className={`pointer-events-none absolute top-1/2 left-0.5 -translate-y-1/2 inline-block ${thumbSize} rounded-full bg-white shadow-soft-sm transition-transform duration-200 ease-in-out
            ${checked ? thumbTranslate : 'translate-x-0'}`}
        />
      </button>
      {label && <span className="text-sm text-fg-muted select-none">{label}</span>}
    </label>
  );
}
