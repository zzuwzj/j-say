import { db } from '../db/index';
import { categories, topics, vocabularies, auditLogs } from '../db/schema';
import { eq, sql, isNull } from 'drizzle-orm';

export const categoryService = {
  async list() {
    return db.select().from(categories).orderBy(categories.sortOrder);
  },

  async listWithStats() {
    const cats = await db.select().from(categories).orderBy(categories.sortOrder);

    const topicCounts = await db
      .select({ categoryId: topics.categoryId, count: sql<number>`count(*)` })
      .from(topics)
      .where(isNull(topics.deletedAt))
      .groupBy(topics.categoryId);

    const vocabCounts = await db
      .select({ categoryId: vocabularies.categoryId, count: sql<number>`count(*)` })
      .from(vocabularies)
      .where(isNull(vocabularies.deletedAt))
      .groupBy(vocabularies.categoryId);

    const topicMap = new Map(topicCounts.map(t => [t.categoryId, t.count]));
    const vocabMap = new Map(vocabCounts.map(v => [v.categoryId, v.count]));

    return cats.map(cat => ({
      ...cat,
      topicCount: topicMap.get(cat.id) ?? 0,
      vocabCount: vocabMap.get(cat.id) ?? 0,
    }));
  },

  async getById(id: number) {
    return db.query.categories.findFirst({ where: eq(categories.id, id) });
  },

  async getBySlug(slug: string) {
    return db.query.categories.findFirst({ where: eq(categories.slug, slug) });
  },

  async create(data: { slug: string; nameZh: string; nameEn: string; sortOrder?: number; isSystem?: boolean }) {
    const [cat] = await db.insert(categories).values({
      ...data,
      enabled: true,
      isSystem: data.isSystem ?? false,
      sortOrder: data.sortOrder ?? 0,
      createdAt: new Date(),
    }).returning();

    await db.insert(auditLogs).values({
      action: 'create',
      targetType: 'category',
      targetId: cat!.id,
      detail: { slug: cat!.slug, nameZh: cat!.nameZh },
    });

    return cat;
  },

  async update(id: number, data: Partial<{ nameZh: string; nameEn: string; sortOrder: number; enabled: boolean }>) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const [cat] = await db.update(categories).set(data)
      .where(eq(categories.id, id)).returning();

    await db.insert(auditLogs).values({
      action: 'update',
      targetType: 'category',
      targetId: id,
      detail: { slug: existing.slug },
    });

    return cat;
  },

  async delete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return { deleted: false, reason: 'NOT_FOUND' };
    if (existing.isSystem) return { deleted: false, reason: 'SYSTEM_CATEGORY' };

    await db.delete(categories).where(eq(categories.id, id));
    await db.insert(auditLogs).values({
      action: 'delete',
      targetType: 'category',
      targetId: id,
      detail: { slug: existing.slug },
    });

    return { deleted: true };
  },
};