import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TrendChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  yDomain?: [number | 'auto', number | 'auto'];
  color?: string;
  height?: number;
  formatTooltip?: (value: number) => string;
}

export function TrendChart({
  data,
  xKey,
  yKey,
  yDomain,
  color = 'var(--color-brand-500)',
  height = 180,
  formatTooltip,
}: TrendChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey={xKey}
            stroke="var(--color-fg-subtle)"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            interval="preserveStartEnd"
            minTickGap={20}
          />
          <YAxis
            stroke="var(--color-fg-subtle)"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={28}
            domain={yDomain}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
              boxShadow: 'var(--shadow-soft-md)',
            }}
            labelStyle={{ color: 'var(--color-fg-muted)' }}
            itemStyle={{ color: 'var(--color-fg)' }}
            formatter={(value: unknown) => {
              const n = typeof value === 'number' ? value : Number(value ?? 0);
              return formatTooltip ? formatTooltip(n) : n;
            }}
          />
          <Area
            type="monotone"
            dataKey={yKey}
            stroke={color}
            strokeWidth={2}
            fill="url(#trendFill)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
