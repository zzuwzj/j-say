import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { DistributionChart } from '@/components/shared/DistributionChart';
import { TrendChart } from '@/components/shared/TrendChart';
import { useStats } from '@/hooks/useStats';
import { TOPIC_CATEGORY_LABELS } from '@/types';

export function Dashboard() {
  const { dailyActivity, scoreTrend, topicCoverage, totalPractices, totalDuration, loading } =
    useStats(30);

  const formatDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}min`;
  };

  const avgScore =
    scoreTrend.length > 0
      ? (scoreTrend.reduce((sum, s) => sum + s.avgScore, 0) / scoreTrend.length).toFixed(1)
      : '--';

  const activityData = dailyActivity.map((d) => ({
    date: d.date.slice(5),
    练习次数: d.count,
  }));

  const trendData = scoreTrend.map((s) => ({
    date: s.date.slice(5),
    平均分: s.avgScore,
  }));

  const coverageData = topicCoverage.map((t) => ({
    category:
      TOPIC_CATEGORY_LABELS[t.category as keyof typeof TOPIC_CATEGORY_LABELS] ?? t.category,
    次数: t.count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="统计" description="过去 30 天的练习数据。" />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : totalPractices === 0 ? (
        <Card padding="none">
          <EmptyState
            icon="📊"
            title="还没有可用的统计数据"
            description="完成至少一次练习，统计就会生成。"
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="总练习次数" value={String(totalPractices)} accent="brand" />
            <StatCard label="总练习时长" value={formatDuration(totalDuration)} accent="success" />
            <StatCard label="平均评分" value={avgScore} accent="info" />
            <StatCard label="活跃天数" value={String(dailyActivity.length)} accent="warning" />
          </div>

          <Card title="练习活跃度(近 30 天)">
            {activityData.length > 0 ? (
              <DistributionChart data={activityData} xKey="date" yKey="练习次数" height={200} />
            ) : (
              <p className="text-center text-sm text-fg-subtle py-8">最近 30 天没有练习。</p>
            )}
          </Card>

          {trendData.length > 0 && (
            <Card title="评分趋势">
              <TrendChart
                data={trendData}
                xKey="date"
                yKey="平均分"
                yDomain={[0, 9]}
                color="var(--color-success-500)"
              />
            </Card>
          )}

          {coverageData.length > 0 && (
            <Card title="话题覆盖">
              <DistributionChart
                data={coverageData}
                xKey="category"
                yKey="次数"
                layout="horizontal"
                height={Math.max(180, coverageData.length * 28)}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

const accentColors: Record<string, string> = {
  brand: 'text-brand-600',
  success: 'text-success-600',
  warning: 'text-warning-600',
  info: 'text-brand-500',
};

function StatCard({
  label,
  value,
  accent = 'brand',
}: {
  label: string;
  value: string;
  accent?: 'brand' | 'success' | 'warning' | 'info';
}) {
  return (
    <Card padding="md">
      <div className="text-center">
        <p className={`text-2xl sm:text-3xl font-bold tabular-nums ${accentColors[accent]}`}>
          {value}
        </p>
        <p className="text-xs sm:text-sm text-fg-muted mt-1">{label}</p>
      </div>
    </Card>
  );
}
