import { db } from './index';
import type { Vocabulary, TopicCategory } from '@/types';

export const vocabRepo = {
  async list(category?: TopicCategory): Promise<Vocabulary[]> {
    if (category) return db.vocabulary.where('category').equals(category).toArray();
    return db.vocabulary.toArray();
  },

  async search(query: string): Promise<Vocabulary[]> {
    const lower = query.toLowerCase();
    return db.vocabulary.filter((v) => v.word.toLowerCase().includes(lower)).toArray();
  },

  async favorites(): Promise<Vocabulary[]> {
    return db.vocabulary.filter((v) => v.isFavorite).toArray();
  },

  async toggleFavorite(id: number): Promise<void> {
    const vocab = await db.vocabulary.get(id);
    if (vocab) await db.vocabulary.update(id, { isFavorite: !vocab.isFavorite });
  },

  async create(vocab: Omit<Vocabulary, 'id'>): Promise<number> {
    return db.vocabulary.add(vocab as Vocabulary);
  },

  async deleteCustom(id: number): Promise<void> {
    const vocab = await db.vocabulary.get(id);
    if (vocab?.isCustom) await db.vocabulary.delete(id);
  },

  async bulkInit(items: Omit<Vocabulary, 'id'>[]): Promise<void> {
    const count = await db.vocabulary.count();
    if (count > 0) return;
    await db.vocabulary.bulkAdd(items as Vocabulary[]);
  },
};