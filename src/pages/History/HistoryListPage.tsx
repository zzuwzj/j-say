import { useNavigate } from 'react-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { usePracticeHistory } from '@/hooks/usePracticeHistory';
import { practiceRepo } from '@/db/practice-repo';
import { PRACTICE_MODE_LABELS } from '@/types';

export function HistoryListPage() {
  const navigate = useNavigate();
  const { records, total, loading, loadMore } = usePracticeHistory();

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}min`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const avgScore = (r: (typeof records)[0]) => {
    if (!r.scores) return null;
    return (
      (r.scores.fluency + r.scores.lexical + r.scores.grammar + r.scores.pronunciation) /
      4
    ).toFixed(1);
  };

  async function handleDelete(id: number) {
    if (!confirm('删除这条练习记录?录音也会一起被清理。')) return;
    await practiceRepo.deleteRecord(id);
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="练习记录"
        description={`累计 ${total} 条记录`}
      />

      {loading && records.length === 0 ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : records.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon="🎤"
            title="还没有练习记录"
            description="完成一次练习，回顾就会出现在这里。"
            action={
              <Button onClick={() => navigate('/practice/setup')}>开始第一次练习</Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card
              key={r.id}
              onClick={() => navigate(`/history/${r.id}`)}
              padding="md"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-fg">
                      {PRACTICE_MODE_LABELS[r.mode]}
                    </span>
                    {avgScore(r) && (
                      <span className="text-sm font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full tabular-nums">
                        {avgScore(r)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-fg-muted mt-0.5">
                    {new Date(r.startedAt).toLocaleDateString()} · {formatDuration(r.duration)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(r.id);
                  }}
                  aria-label="删除"
                  className="text-fg-subtle hover:text-danger-600 transition-colors p-2 rounded-md hover:bg-surface-3"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {records.length < total && (
        <div className="text-center">
          <Button variant="ghost" onClick={loadMore} loading={loading}>
            加载更多
          </Button>
        </div>
      )}
    </div>
  );
}
