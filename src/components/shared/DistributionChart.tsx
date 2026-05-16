import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface DistributionChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
  layout?: 'vertical' | 'horizontal';
}

export function DistributionChart({
  data,
  xKey,
  yKey,
  color = 'var(--color-brand-500)',
  height = 200,
  layout = 'vertical',
}: DistributionChartProps) {
  const isHorizontal = layout === 'horizontal';

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                stroke="var(--color-fg-subtle)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                stroke="var(--color-fg-subtle)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={64}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                stroke="var(--color-fg-subtle)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />
              <YAxis
                stroke="var(--color-fg-subtle)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={28}
              />
            </>
          )}
          <Tooltip
            cursor={{ fill: 'var(--color-surface-3)' }}
            contentStyle={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 12,
              boxShadow: 'var(--shadow-soft-md)',
            }}
            labelStyle={{ color: 'var(--color-fg-muted)' }}
            itemStyle={{ color: 'var(--color-fg)' }}
          />
          <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
