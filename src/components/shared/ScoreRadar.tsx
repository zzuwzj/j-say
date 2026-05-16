import type { IeltsScores } from '@/types';
import { SCORE_DIMENSION_LABELS } from '@/types';

interface ScoreRadarProps {
  scores: IeltsScores;
  size?: number;
}

export function ScoreRadar({ scores, size = 200 }: ScoreRadarProps) {
  const dimensions = Object.keys(scores) as Array<keyof IeltsScores>;
  const n = dimensions.length;
  const center = size / 2;
  const radius = size * 0.38;
  const angleStep = (2 * Math.PI) / n;

  // Calculate points for each score
  const points = dimensions.map((key, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const value = scores[key] / 9;
    const x = center + radius * value * Math.cos(angle);
    const y = center + radius * value * Math.sin(angle);
    return { key, x, y, angle };
  });

  // Grid lines (for 1-9 scale, show 3 levels)
  const gridLevels = [3 / 9, 6 / 9, 1];
  const gridPaths = gridLevels.map((level) => {
    const gridPoints = dimensions.map((_, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const x = center + radius * level * Math.cos(angle);
      const y = center + radius * level * Math.sin(angle);
      return `${x},${y}`;
    });
    return `M${gridPoints.join('L')}Z`;
  });

  // Axis lines
  const axisLines = dimensions.map((_, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    return `M${center},${center}L${x},${y}`;
  });

  // Score polygon
  const scorePath = `M${points.map((p) => `${p.x},${p.y}`).join('L')}Z`;

  // Label positions
  const labels = dimensions.map((key, i) => {
    const angle = -Math.PI / 2 + i * angleStep;
    const labelRadius = radius + 24;
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    return { key, x, y, score: scores[key] };
  });

  const avgScore = Math.round(
    (dimensions.reduce((sum, k) => sum + scores[k], 0) / n) * 10,
  ) / 10;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--color-border)" strokeWidth="1" />
        ))}
        {/* Axes */}
        {axisLines.map((d, i) => (
          <path key={i} d={d} stroke="var(--color-border)" strokeWidth="1" />
        ))}
        {/* Score polygon */}
        <path
          d={scorePath}
          fill="var(--color-brand-500)"
          fillOpacity="0.18"
          stroke="var(--color-brand-500)"
          strokeWidth="2"
        />
        {/* Score points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--color-brand-500)" />
        ))}
        {/* Labels */}
        {labels.map((l, i) => (
          <g key={i}>
            <text
              x={l.x}
              y={l.y - 6}
              textAnchor="middle"
              style={{ fontSize: 10, fill: 'var(--color-fg-muted)' }}
            >
              {SCORE_DIMENSION_LABELS[l.key]}
            </text>
            <text
              x={l.x}
              y={l.y + 6}
              textAnchor="middle"
              style={{ fontSize: 12, fontWeight: 700, fill: 'var(--color-brand-600)' }}
            >
              {l.score}
            </text>
          </g>
        ))}
      </svg>
      <p className="text-sm text-fg-muted mt-1">平均分: {avgScore}</p>
    </div>
  );
}