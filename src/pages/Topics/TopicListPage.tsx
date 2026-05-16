import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTopics } from '@/hooks/useTopics';
import { topicRepo } from '@/db/topic-repo';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { TopicCard } from '@/components/shared/TopicCard';
import { TOPIC_CATEGORY_LABELS } from '@/types';
import type { PartNumber, TopicCategory } from '@/types';
import { part1Topics } from '@/data/topics/part1';
import { part2Topics } from '@/data/topics/part2';
import { part3Topics } from '@/data/topics/part3';

const PART_CATEGORIES: Record<PartNumber, TopicCategory[]> = {
  1: [...new Set(part1Topics.map((t) => t.category))],
  2: [...new Set(part2Topics.map((t) => t.category))],
  3: [...new Set(part3Topics.map((t) => t.category))],
};

export function TopicListPage() {
  const navigate = useNavigate();
  const [selectedPart, setSelectedPart] = useState<PartNumber>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFavorites, setShowFavorites] = useState(false);

  const availableCategories = useMemo(() => PART_CATEGORIES[selectedPart], [selectedPart]);

  const handlePartChange = (part: PartNumber) => {
    setSelectedPart(part);
    if (selectedCategory && !PART_CATEGORIES[part].includes(selectedCategory as TopicCategory)) {
      setSelectedCategory('');
    }
  };

  const { topics, refresh } = useTopics({
    part: selectedPart,
    category: selectedCategory as TopicCategory | undefined,
    favoritesOnly: showFavorites,
  });

  async function handleToggleFavorite(id: number) {
    await topicRepo.toggleFavorite(id);
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="题库"
        description="按 Part 与分类浏览，收藏常练话题。"
        actions={
          <Button
            variant={showFavorites ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            {showFavorites ? '★ 仅看收藏' : '☆ 仅看收藏'}
          </Button>
        }
      />

      <Tabs<PartNumber>
        items={[
          { value: 1, label: 'Part 1' },
          { value: 2, label: 'Part 2' },
          { value: 3, label: 'Part 3' },
        ]}
        value={selectedPart}
        onChange={handlePartChange}
        variant="pills"
      />

      <div className="flex flex-wrap gap-2">
        <Chip active={selectedCategory === ''} onClick={() => setSelectedCategory('')}>
          全部
        </Chip>
        {availableCategories.map((key) => (
          <Chip
            key={key}
            active={selectedCategory === key}
            onClick={() => setSelectedCategory(key)}
          >
            {TOPIC_CATEGORY_LABELS[key]}
          </Chip>
        ))}
      </div>

      {topics.length === 0 ? (
        <EmptyState
          icon="📭"
          title={showFavorites ? '还没有收藏的话题' : '没有匹配的话题'}
          description={showFavorites ? '点击话题卡上的星标来收藏。' : '尝试切换 Part 或清除分类筛选。'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onSelect={(t) => navigate(`/topics/${t.id}`)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
