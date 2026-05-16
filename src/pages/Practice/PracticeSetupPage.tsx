import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageHeader } from '@/components/ui/PageHeader';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { TopicCard } from '@/components/shared/TopicCard';
import { useTopics } from '@/hooks/useTopics';
import { topicRepo } from '@/db/topic-repo';
import { usePracticeStore } from '@/stores/practiceStore';
import type { PracticeMode, PartNumber, Topic } from '@/types';
import { TOPIC_CATEGORY_LABELS } from '@/types';

type SetupStep = 'mode' | 'topic';

export function PracticeSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const startSession = usePracticeStore((s) => s.startSession);

  const [step, setStep] = useState<SetupStep>(modeParam ? 'topic' : 'mode');
  const [mode, setMode] = useState<PracticeMode>(
    modeParam === 'part'
      ? 'part1'
      : modeParam === 'random'
        ? 'full'
        : ((modeParam as PracticeMode) ?? 'full'),
  );
  const [selectedPart, setSelectedPart] = useState<PartNumber>(1);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const effectivePart: PartNumber | undefined =
    mode === 'full'
      ? undefined
      : mode === 'part1'
        ? 1
        : mode === 'part2'
          ? 2
          : mode === 'part3'
            ? 3
            : selectedPart;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { topics, loading } = useTopics({ part: effectivePart, category: selectedCategory as any });

  useEffect(() => {
    if (modeParam === 'random') {
      handleRandomStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRandomStart() {
    try {
      const t1 = await topicRepo.random(1);
      const t2 = await topicRepo.random(2);
      const t3 = await topicRepo.random(3);
      startSession('full', {
        part1: { topic: t1, suggestedDurations: t1.questions.map(() => 30) },
        part2: { topic: t2, preparationSeconds: 60, speakingSeconds: 120 },
        part3: { topic: t3, relatedPart2Title: t2.title },
      });
      navigate('/practice/session');
    } catch {
      setStep('mode');
    }
  }

  function handleModeSelect(m: PracticeMode) {
    setMode(m);
    if (m === 'full') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedPart(undefined as any);
    }
    setStep('topic');
  }

  async function handleStart() {
    if (!selectedTopic) return;

    const part = effectivePart ?? 1;

    if (mode === 'full') {
      const t1 = selectedTopic.part === 1 ? selectedTopic : await topicRepo.random(1);
      const t2 = selectedTopic.part === 2 ? selectedTopic : await topicRepo.random(2);
      const t3 = selectedTopic.part === 3 ? selectedTopic : await topicRepo.random(3);
      startSession('full', {
        part1: { topic: t1, suggestedDurations: t1.questions.map(() => 30) },
        part2: { topic: t2, preparationSeconds: 60, speakingSeconds: 120 },
        part3: { topic: t3, relatedPart2Title: t2.title },
      });
    } else {
      const topic = selectedTopic;
      if (part === 1) {
        startSession('part1', {
          part1: { topic, suggestedDurations: topic.questions.map(() => 30) },
        });
      } else if (part === 2) {
        startSession('part2', {
          part2: { topic, preparationSeconds: 60, speakingSeconds: 120 },
        });
      } else {
        startSession('part3', {
          part3: { topic, relatedPart2Title: '' },
        });
      }
    }
    navigate('/practice/session');
  }

  const modeOptions: Array<{
    mode: PracticeMode;
    icon: string;
    title: string;
    desc: string;
  }> = [
    { mode: 'full', icon: '🎯', title: '完整模考', desc: 'Part 1 → 2 → 3 全流程' },
    { mode: 'part1', icon: '1️⃣', title: '仅 Part 1', desc: '日常问答与自我介绍' },
    { mode: 'part2', icon: '2️⃣', title: '仅 Part 2', desc: 'Cue Card 长答练习' },
    { mode: 'part3', icon: '3️⃣', title: '仅 Part 3', desc: '深入讨论练习' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <PageHeader title="开始练习" />

      {step === 'mode' && (
        <div className="space-y-4">
          <h2 className="text-base font-medium text-fg-muted">选择练习模式</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {modeOptions.map((item) => (
              <Card key={item.mode} onClick={() => handleModeSelect(item.mode)}>
                <div className="text-center py-2">
                  <div className="text-2xl mb-1" aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-fg">{item.title}</h3>
                  <p className="text-sm text-fg-muted mt-1">{item.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {step === 'topic' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-medium text-fg-muted">
              {mode === 'full'
                ? '选择一个起始话题(其他 Part 将随机)'
                : `选择 Part ${effectivePart} 话题`}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setStep('mode')}>
              ← 返回
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip active={selectedCategory === ''} onClick={() => setSelectedCategory('')}>
              全部
            </Chip>
            {Object.entries(TOPIC_CATEGORY_LABELS).map(([key, label]) => (
              <Chip
                key={key}
                active={selectedCategory === key}
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </Chip>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : topics.length === 0 ? (
            <EmptyState icon="📭" title="没有匹配的话题" description="尝试切换分类。" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className={
                    selectedTopic?.id === topic.id
                      ? 'rounded-xl ring-2 ring-brand-500 ring-offset-2 ring-offset-surface-2'
                      : ''
                  }
                >
                  <TopicCard topic={topic} onSelect={setSelectedTopic} />
                </div>
              ))}
            </div>
          )}

          <div className="sticky bottom-4 pt-4">
            <Button size="lg" fullWidth disabled={!selectedTopic} onClick={handleStart}>
              开始练习
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
