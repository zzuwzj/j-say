import type { Topic } from '@/types';
import { TOPIC_CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types';

interface TopicCardProps {
  topic: Topic;
  onSelect: (topic: Topic) => void;
  onToggleFavorite?: (id: number) => void;
  compact?: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-success-50 text-success-700',
  medium: 'bg-warning-50 text-warning-700',
  hard: 'bg-danger-50 text-danger-700',
};

export function TopicCard({ topic, onSelect, onToggleFavorite, compact }: TopicCardProps) {
  return (
    <div
      className="bg-surface rounded-xl border border-border p-4 hover:shadow-soft-md hover:border-border-strong hover:-translate-y-0.5 transition-all cursor-pointer"
      onClick={() => onSelect(topic)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(topic);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium text-fg ${compact ? 'text-sm' : 'text-base'} truncate`}
          >
            {topic.title}
          </h3>
          {!compact && topic.content && (
            <p className="mt-1 text-sm text-fg-muted line-clamp-2">{topic.content}</p>
          )}
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(topic.id);
            }}
            aria-label={topic.isFavorite ? '取消收藏' : '收藏'}
            className={`text-lg shrink-0 transition-all hover:scale-110 ${
              topic.isFavorite ? 'text-warning-500' : 'text-fg-subtle hover:text-warning-500'
            }`}
          >
            {topic.isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>
      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">
          {TOPIC_CATEGORY_LABELS[topic.category]}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[topic.difficulty]}`}
        >
          {DIFFICULTY_LABELS[topic.difficulty]}
        </span>
        <span className="text-xs text-fg-subtle">{topic.questions.length} 题</span>
      </div>
    </div>
  );
}
