import { db } from '../db/index';
import { vocabularies, auditLogs } from '../db/schema';
import { eq, and, like, desc, asc, sql, isNull, inArray } from 'drizzle-orm';

interface VocabQuery {
  page?: number; pageSize?: number; categoryId?: number; keyword?: string;
  sortBy?: 'updatedAt'|'createdAt'|'word'; sortOrder?: 'asc'|'desc';
}
interface VocabCreateRequest {
  word: string; definition: string; example?: string; categoryId: number;
  relatedTopicIds?: number[]; status?: 'draft'|'published';
}
interface VocabBatchRequest {
  action: 'delete'|'updateCategory'; ids: number[]; data?: { categoryId?: number };
}

export const vocabService = {
  async list(query: VocabQuery) {
    const {
      page = 1, pageSize = 20, categoryId, keyword,
      sortBy = 'updatedAt', sortOrder = 'desc',
    } = query;

    const conditions = [isNull(vocabularies.deletedAt)];
    if (categoryId) conditions.push(eq(vocabularies.categoryId, categoryId));
    if (keyword) {
      conditions.push(like(vocabularies.word, `%${keyword}%`));
    }

    const where = and(...conditions);
    const sortColumn = sortBy === 'createdAt' ? vocabularies.createdAt
      : sortBy === 'word' ? vocabularies.word
      : vocabularies.updatedAt;
    const order = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const [data, countResult] = await Promise.all([
      db.select().from(vocabularies).where(where).orderBy(order)
        .limit(pageSize).offset((page - 1) * pageSize),
      db.select({ count: sql<number>`count(*)` }).from(vocabularies).where(where),
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
    return db.query.vocabularies.findFirst({
      where: and(eq(vocabularies.id, id), isNull(vocabularies.deletedAt)),
    });
  },

  async create(data: VocabCreateRequest) {
    const [vocab] = await db.insert(vocabularies).values({
      ...data,
      status: data.status ?? 'draft',
      version: 1,
    }).returning();

    await this.logAction('create', 'vocabulary', vocab!.id, { word: vocab!.word });
    return vocab;
  },

  async update(id: number, data: Partial<VocabCreateRequest>) {
    const existing = await this.getById(id);
    if (!existing) return null;

    const [vocab] = await db.update(vocabularies).set({
      ...data,
      version: sql`${vocabularies.version} + 1`,
      updatedAt: new Date(),
    }).where(and(eq(vocabularies.id, id), isNull(vocabularies.deletedAt))).returning();

    await this.logAction('update', 'vocabulary', id, { word: existing.word });
    return vocab;
  },

  async softDelete(id: number) {
    const existing = await this.getById(id);
    if (!existing) return false;

    await db.update(vocabularies).set({ deletedAt: new Date() })
      .where(eq(vocabularies.id, id));
    await this.logAction('delete', 'vocabulary', id, { word: existing.word });
    return true;
  },

  async batchAction(request: VocabBatchRequest) {
    const { action, ids, data } = request;
    if (ids.length === 0) return { affected: 0 };

    switch (action) {
      case 'delete': {
        await db.update(vocabularies).set({ deletedAt: new Date() })
          .where(and(inArray(vocabularies.id, ids), isNull(vocabularies.deletedAt)));
        await this.logAction('batch_delete', 'vocabulary', 0, { count: ids.length });
        return { affected: ids.length };
      }
      case 'updateCategory': {
        if (!data?.categoryId) return { affected: 0 };
        await db.update(vocabularies).set({ categoryId: data.categoryId, updatedAt: new Date() })
          .where(and(inArray(vocabularies.id, ids), isNull(vocabularies.deletedAt)));
        await this.logAction('batch_update_category', 'vocabulary', 0, { count: ids.length, categoryId: data.categoryId });
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

    const [vocab] = await db.update(vocabularies).set(updateData)
      .where(eq(vocabularies.id, id)).returning();

    await this.logAction(status === 'published' ? 'publish' : 'offline', 'vocabulary', id, { word: existing.word });
    return vocab;
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