import { db } from './index';
import type { Topic, TopicCategory, PartNumber } from '@/types';

export const topicRepo = {
  async list(part?: PartNumber, category?: TopicCategory): Promise<Topic[]> {
    if (part && category) {
      return db.topics.where('[part+category]').equals([part, category]).toArray();
    }
    if (part) {
      return db.topics.where('part').equals(part).toArray();
    }
    if (category) {
      return db.topics.where('category').equals(category).toArray();
    }
    return db.topics.toArray();
  },

  async getById(id: number): Promise<Topic | undefined> {
    return db.topics.get(id);
  },

  async random(part: PartNumber, category?: TopicCategory): Promise<Topic> {
    const list = await this.list(part, category);
    if (list.length === 0) throw new Error(`No topics found for part ${part}`);
    return list[Math.floor(Math.random() * list.length)]!;
  },

  async favorites(): Promise<Topic[]> {
    return db.topics.filter((t) => t.isFavorite).toArray();
  },

  async toggleFavorite(id: number): Promise<void> {
    const topic = await db.topics.get(id);
    if (topic) {
      await db.topics.update(id, { isFavorite: !topic.isFavorite, updatedAt: Date.now() });
    }
  },

  async create(topic: Omit<Topic, 'id'>): Promise<number> {
    return db.topics.add(topic as Topic);
  },

  async update(id: number, changes: Partial<Topic>): Promise<void> {
    await db.topics.update(id, { ...changes, updatedAt: Date.now() });
  },

  async deleteCustom(id: number): Promise<void> {
    const topic = await db.topics.get(id);
    if (topic?.isCustom) {
      await db.topics.delete(id);
    }
  },

  async bulkInit(topics: Omit<Topic, 'id'>[]): Promise<void> {
    const count = await db.topics.count();
    if (count > 0) return;
    await db.topics.bulkAdd(topics as Topic[]);
  },

  async count(): Promise<number> {
    return db.topics.count();
  },
};