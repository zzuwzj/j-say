interface ProgressBarProps {
  value: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, color, showLabel, size = 'md' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value * 100));
  const barColor =
    color ?? (pct >= 80 ? 'bg-success-500' : pct >= 50 ? 'bg-brand-500' : 'bg-fg-subtle');
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} bg-surface-3 rounded-full overflow-hidden`}>
        <div
          className={`${height} ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-fg-muted min-w-[3ch] tabular-nums">{Math.round(pct)}%</span>
      )}
    </div>
  );
}
