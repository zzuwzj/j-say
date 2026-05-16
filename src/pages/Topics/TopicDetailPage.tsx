import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { topicRepo } from '@/db/topic-repo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonText } from '@/components/ui/Skeleton';
import type { Topic } from '@/types';
import { TOPIC_CATEGORY_LABELS, DIFFICULTY_LABELS, PART_LABELS } from '@/types';

export function TopicDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);

  useEffect(() => {
    if (!id) return;
    topicRepo.getById(parseInt(id)).then((t) => setTopic(t ?? null));
  }, [id]);

  if (!topic) {
    return (
      <div className="space-y-4">
        <SkeletonText lines={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/topics')}
        className="text-sm text-fg-muted hover:text-fg transition-colors"
      >
        ← 返回题库
      </button>

      <div>
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
            {PART_LABELS[topic.part]}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-fg-muted">
            {TOPIC_CATEGORY_LABELS[topic.category]}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-fg-muted">
            {DIFFICULTY_LABELS[topic.difficulty]}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-fg tracking-tight">{topic.title}</h1>
        {topic.content && <p className="mt-2 text-fg-muted leading-relaxed">{topic.content}</p>}
      </div>

      {topic.prompts.length > 0 && (
        <Card title="提示要点">
          <ul className="space-y-2">
            {topic.prompts.map((prompt, i) => (
              <li key={i} className="flex items-start gap-2 text-fg">
                <span className="text-brand-500 mt-0.5">•</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {topic.questions.length > 0 && (
        <Card title="参考问题">
          <ol className="space-y-3">
            {topic.questions.map((q, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-sm font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-fg">{q}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button size="lg" onClick={() => navigate(`/practice/setup?mode=part${topic.part}`)}>
          练习这个话题
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            topicRepo.toggleFavorite(topic.id);
            setTopic({ ...topic, isFavorite: !topic.isFavorite });
          }}
        >
          {topic.isFavorite ? '★ 已收藏' : '☆ 收藏'}
        </Button>
      </div>
    </div>
  );
}
