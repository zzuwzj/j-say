interface TimerProps {
  timeLeft: number;
  totalTime: number;
  isWarning: boolean;
  isRunning: boolean;
  label?: string;
}

export function Timer({ timeLeft, totalTime, isWarning, isRunning, label }: TimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalTime > 0 ? 1 - timeLeft / totalTime : 0;

  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-sm font-medium text-fg-muted">{label}</span>}
      <div className="flex items-center gap-2">
        <div className="relative w-40 h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300
              ${isWarning ? 'bg-warning-500' : 'bg-brand-600'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span
          className={`font-mono text-lg font-bold min-w-[4ch] tabular-nums
          ${isWarning ? 'text-warning-600' : 'text-fg'}`}
        >
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
        {isRunning && (
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger-500/75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-danger-500" />
          </span>
        )}
      </div>
    </div>
  );
}
