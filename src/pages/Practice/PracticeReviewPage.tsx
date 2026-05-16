import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { practiceRepo } from '@/db/practice-repo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonText } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { ScoreRadar } from '@/components/shared/ScoreRadar';
import { SegmentPlayer } from '@/components/shared/SegmentPlayer';
import type { PracticeRecord, RecordingSegment, IeltsScores } from '@/types';
import { PRACTICE_MODE_LABELS, SCORE_DIMENSION_LABELS } from '@/types';

const defaultScores: IeltsScores = { fluency: 5, lexical: 5, grammar: 5, pronunciation: 5 };

export function PracticeReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<PracticeRecord | null>(null);
  const [segments, setSegments] = useState<RecordingSegment[]>([]);
  const [scores, setScores] = useState<IeltsScores>(defaultScores);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    const recordId = parseInt(id);
    practiceRepo.getRecord(recordId).then((r) => {
      if (r) {
        setRecord(r);
        if (r.scores) setScores(r.scores);
        setNotes(r.notes);
      }
    });
    practiceRepo.getSegments(recordId).then(setSegments);
  }, [id]);

  async function handleSave() {
    if (!record) return;
    await practiceRepo.updateScoresAndNotes(record.id, scores, notes);
    setSaved(true);
    setTimeout(() => navigate('/history'), 1000);
  }

  if (!record) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <SkeletonText lines={4} />
      </div>
    );
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader title="练习回顾" />

      <Card className="mb-6">
        <div>
          <p className="text-lg font-semibold text-fg">
            {PRACTICE_MODE_LABELS[record.mode]}
          </p>
          <p className="text-sm text-fg-muted mt-0.5">
            {new Date(record.startedAt).toLocaleString()} · {formatDuration(record.duration)}
          </p>
        </div>
      </Card>

      {segments.length > 0 && (
        <Card title="录音片段" className="mb-6">
          <div className="space-y-3">
            {segments.map((seg) => (
              <SegmentPlayer key={seg.id} segment={seg} />
            ))}
          </div>
        </Card>
      )}

      <Card title="自我评估" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {(Object.keys(scores) as Array<keyof IeltsScores>).map((key) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-fg">
                    {SCORE_DIMENSION_LABELS[key]}
                  </label>
                  <span className="text-sm font-bold text-brand-600 tabular-nums">
                    {scores[key]}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="9"
                  step="0.5"
                  value={scores[key]}
                  onChange={(e) =>
                    setScores({ ...scores, [key]: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-surface-3 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center">
            <ScoreRadar scores={scores} />
          </div>
        </div>
      </Card>

      <Card title="笔记" className="mb-6">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="哪里做得好?哪里还可以改进?"
          rows={5}
          className="resize-none"
        />
      </Card>

      <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate('/')}>
          回首页
        </Button>
        <Button onClick={handleSave} disabled={saved}>
          {saved ? '已保存' : '保存回顾'}
        </Button>
      </div>
    </div>
  );
}
