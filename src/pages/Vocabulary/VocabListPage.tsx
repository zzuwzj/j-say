import { useState, useEffect, useCallback } from 'react';
import { vocabRepo } from '@/db/vocab-repo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Textarea } from '@/components/ui/Textarea';
import { TOPIC_CATEGORY_LABELS } from '@/types';
import type { Vocabulary, TopicCategory } from '@/types';

export function VocabListPage() {
  const [vocab, setVocab] = useState<Vocabulary[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newDef, setNewDef] = useState('');
  const [newExample, setNewExample] = useState('');

  const fetch = useCallback(async () => {
    let result: Vocabulary[];
    if (search) {
      result = await vocabRepo.search(search);
    } else if (showFavorites) {
      result = await vocabRepo.favorites();
    } else {
      result = await vocabRepo.list(selectedCategory as TopicCategory | undefined);
    }
    setVocab(result);
  }, [search, selectedCategory, showFavorites]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function handleToggleFavorite(id: number) {
    await vocabRepo.toggleFavorite(id);
    fetch();
  }

  async function handleAdd() {
    if (!newWord.trim() || !newDef.trim()) return;
    await vocabRepo.create({
      word: newWord.trim(),
      definition: newDef.trim(),
      example: newExample.trim(),
      category: 'daily' as TopicCategory,
      relatedTopicIds: [],
      isCustom: true,
      isFavorite: false,
      createdAt: Date.now(),
    });
    setNewWord('');
    setNewDef('');
    setNewExample('');
    setShowAddModal(false);
    fetch();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="词汇本"
        description="收藏与管理你练习中遇到的高频词。"
        actions={
          <>
            <Button
              variant={showFavorites ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFavorites(!showFavorites)}
            >
              {showFavorites ? '★ 仅看收藏' : '☆ 仅看收藏'}
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              + 新增
            </Button>
          </>
        }
      />

      <Input
        type="search"
        placeholder="搜索词汇..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leading={
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        }
      />

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

      {vocab.length === 0 ? (
        <Card padding="none">
          <EmptyState
            icon="📖"
            title="没有匹配的词汇"
            description="尝试更换关键词或新增一个词条。"
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {vocab.map((v) => (
            <div
              key={v.id}
              className="bg-surface rounded-xl border border-border p-4 hover:shadow-soft-sm hover:border-border-strong transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-fg">{v.word}</span>
                    {v.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-surface-3 text-fg-muted">
                        {TOPIC_CATEGORY_LABELS[v.category as TopicCategory] ?? v.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-fg-muted mt-1.5">{v.definition}</p>
                  {v.example && (
                    <p className="text-sm text-fg-subtle italic mt-1.5">"{v.example}"</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleFavorite(v.id)}
                  aria-label={v.isFavorite ? '取消收藏' : '收藏'}
                  className={`text-lg shrink-0 transition-colors ${
                    v.isFavorite ? 'text-warning-500' : 'text-fg-subtle hover:text-warning-500'
                  }`}
                >
                  {v.isFavorite ? '★' : '☆'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="新增词汇"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>
              取消
            </Button>
            <Button onClick={handleAdd} disabled={!newWord.trim() || !newDef.trim()}>
              新增
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">词 / 短语</label>
            <Input value={newWord} onChange={(e) => setNewWord(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">释义</label>
            <Input value={newDef} onChange={(e) => setNewDef(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1.5">例句(可选)</label>
            <Textarea
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
