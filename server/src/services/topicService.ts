import { db } from '../db/index';
import { topics, auditLogs } from '../db/schema';
import { eq, and, like, desc, asc, sql, isNull, inArray } from 'drizzle-orm';

interface TopicQuery {
  page?: number; pageSize?: number; part?: 1|2|3; categoryId?: number;
  difficulty?: 'easy'|'medium'|'hard'; status?: 'draft'|'published'|'offline';
  keyword?: string; sortBy?: 'updatedAt'|'createdAt'; sortOrder?: 'asc'|'desc';
}
interface TopicCreateRequest {
  part: 1|2|3; categoryId: number; title: string; content: string;
  prompts?: string[]; questions: string[]; examples: Array<{simple:string;band7:string}>;
  part2Example?: {simple:string;band7:string}; relatedPart2Id?: number;
  difficulty: 'easy'|'medium'|'hard'; status?: 'draft'|'published';
}
interface TopicBatchRequest {
  action: 'delete'|'updateCategory'|'updateDifficulty'|'updateStatus'|'publish'|'offline';
  ids: number[]; data?: { categoryId?: number; difficulty?: 'easy'|'medium'|'hard'; status?: 'draft'|'published'|'offline' };
}

export const topicService = {
  async list(query: TopicQuery) {
    const {
      page = 1, pageSize = 20, part, categoryId, difficulty,
      status, keyword, sortBy = 'updatedAt', sortOrder = 'desc',
    } = query;

    const conditions = [isNull(topics.deletedAt)];
    if (part) conditions.push(eq(topics.part, part));
    if (categoryId) conditions.push(eq(topics.categoryId, categoryId));
    if (difficulty) conditions.push(eq(topics.difficulty, difficulty));
    if (status) conditions.push(eq(topics.status, status));
    if (keyword) {
      conditions.push(like(topics.title, `%${keyword}%`));
    }

    const where = and(...conditions);
    const sortColumn = sortBy === 'createdAt' ? topics.createdAt : topics.updatedAt;
    const order = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [data, countResult] = await Promise.all([
      db.select().from(topics).where(where).orderBy(order)
        .limit(pageSize).offset((page - 1) * pageSize),
      db.select({ count: sql<number>`count(*)` }).from(topics).where(where),
    ]);

    const total = countResult[0]?.count ?? 0;
    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  },

  async getById(id: number) {
    return db.query.topics.findFirst({
      where: and(eq(topics.id, id), isNull(topics.deletedAt)),
    });
  },

  async create(data: TopicCreateRequest) {
    const [topic] = await db.insert(topics).values({
      ...data,
      status: data.status ?? 'draft',
      version: 1,
      publishedAt: data.status === 'published' ? new Date() : undefined,
    }).returning();

    await this.logAction('create', 'topic', topic!.id, { title: topic!.title });
    return topic;
  },

  async update(id: number, data: Partial<TopicCreateRequest>) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const [topic] = await db.update(topics).set({
      ...data,
      version: sql`${topics.version} + 1`,
      updatedAt: new Date(),
    }).where(and(eq(topics.id, id), isNull(topics.deletedAt))).returning();

    await this.logAction('update', 'topic', id, { title: existing.title });
    return topic;
  },

  async softDelete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return false;

    await db.update(topics).set({ deletedAt: new Date() })
      .where(eq(topics.id, id));
    await this.logAction('delete', 'topic', id, { title: existing.title });
    return true;
  },

  async batchAction(request: TopicBatchRequest) {
    const { action, ids, data } = request;
    if (ids.length === 0) return { affected: 0 };

    switch (action) {
      case 'delete': {
        await db.update(topics).set({ deletedAt: new Date() })
          .where(and(inArray(topics.id, ids), isNull(topics.deletedAt)));
        await this.logAction('batch_delete', 'topic', 0, { count: ids.length });
        return { affected: ids.length };
      }
      case 'updateCategory': {
        if (!data?.categoryId) return { affected: 0 };
        await db.update(topics).set({ categoryId: data.categoryId, updatedAt: new Date() })
          .where(and(inArray(topics.id, ids), isNull(topics.deletedAt)));
        await this.logAction('batch_update_category', 'topic', 0, { count: ids.length, categoryId: data.categoryId });
        return { affected: ids.length };
      }
      case 'updateDifficulty': {
        if (!data?.difficulty) return { affected: 0 };
        await db.update(topics).set({ difficulty: data.difficulty, updatedAt: new Date() })
          .where(and(inArray(topics.id, ids), isNull(topics.deletedAt)));
        await this.logAction('batch_update_difficulty', 'topic', 0, { count: ids.length, difficulty: data.difficulty });
        return { affected: ids.length };
      }
      case 'updateStatus': {
        if (!data?.status) return { affected: 0 };
        const updateData: Record<string, unknown> = { status: data.status, updatedAt: new Date() };
        if (data.status === 'published') updateData.publishedAt = new Date();
        await db.update(topics).set(updateData)
          .where(and(inArray(topics.id, ids), isNull(topics.deletedAt)));
        await this.logAction('batch_update_status', 'topic', 0, { count: ids.length, status: data.status });
        return { affected: ids.length };
      }
      case 'publish': {
        await db.update(topics).set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
          .where(and(inArray(topics.id, ids), isNull(topics.deletedAt)));
        await this.logAction('batch_publish', 'topic', 0, { count: ids.length });
        return { affected: ids.length };
      }
      case 'offline': {
        await db.update(topics).set({ status: 'offline', updatedAt: new Date() })
          .where(and(inArray(topics.id, ids), isNull(topics.deletedAt)));
        await this.logAction('batch_offline', 'topic', 0, { count: ids.length });
        return { affected: ids.length };
      }
      default:
        return { affected: 0 };
    }
  },

  async updateStatus(id: number, status: 'published' | 'offline') {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
    if (status === 'published') updateData.publishedAt = new Date();

    const [topic] = await db.update(topics).set(updateData)
      .where(eq(topics.id, id)).returning();

    await this.logAction(status === 'published' ? 'publish' : 'offline', 'topic', id, { title: existing.title });
    return topic;
  },

  async logAction(action: string, targetType: string, targetId: number, detail?: object) {
    await db.insert(auditLogs).values({
      action,
      targetType,
      targetId,
      detail: detail ?? null,
    });
  },
};