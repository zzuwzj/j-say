import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { practiceRepo } from '@/db/practice-repo';
import { Card } from '@/components/ui/Card';
import { SkeletonText } from '@/components/ui/Skeleton';
import { ScoreRadar } from '@/components/shared/ScoreRadar';
import { SegmentPlayer } from '@/components/shared/SegmentPlayer';
import type { PracticeRecord, RecordingSegment } from '@/types';
import { PRACTICE_MODE_LABELS, SCORE_DIMENSION_LABELS } from '@/types';

export function HistoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [segments, setSegments] = useState<RecordingSegment[]>([]);

  useEffect(() => {
    if (!id) return;
    const recordId = parseInt(id);
    practiceRepo.getRecord(recordId).then((r) => {
      if (r) setRecord(r);
    });
    practiceRepo.getSegments(recordId).then(setSegments);
  }, [id]);

  if (!record) {
    return (
      <div className="space-y-4">
        <SkeletonText lines={4} />
      </div>
    );
  }

  const formatDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/history')}
        className="text-sm text-fg-muted hover:text-fg transition-colors"
      >
        ← 返回练习记录
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h1 className="text-2xl font-bold text-fg tracking-tight">
          {PRACTICE_MODE_LABELS[record.mode]}
        </h1>
        <span className="text-sm text-fg-muted">
          {new Date(record.startedAt).toLocaleString()} · {formatDuration(record.duration)}
        </span>
      </div>

      {record.scores && (
        <Card title="评分">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ScoreRadar scores={record.scores} />
            <div className="space-y-2 flex-1 w-full">
              {(
                Object.entries(record.scores) as [keyof typeof record.scores, number][]
              ).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-fg-muted">{SCORE_DIMENSION_LABELS[key]}</span>
                  <span className="text-sm font-bold text-fg tabular-nums">{value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-fg">平均分</span>
                <span className="text-lg font-bold text-brand-600 tabular-nums">
                  {(
                    (record.scores.fluency +
                      record.scores.lexical +
                      record.scores.grammar +
                      record.scores.pronunciation) /
                    4
                  ).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {segments.length > 0 && (
        <Card title="录音片段">
          <div className="space-y-3">
            {segments.map((seg) => (
              <SegmentPlayer key={seg.id} segment={seg} />
            ))}
          </div>
        </Card>
      )}

      {record.notes && (
        <Card title="笔记">
          <p className="text-sm text-fg whitespace-pre-wrap">{record.notes}</p>
        </Card>
      )}
    </div>
  );
}
