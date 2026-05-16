import { db } from '../db/index';
import { topics, vocabularies, categories, auditLogs } from '../db/schema';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';

export const statsService = {
  async getOverview() {
    const [
      totalTopics,
      publishedTopics,
      draftTopics,
      offlineTopics,
      totalVocabs,
      publishedVocabs,
      totalCategories,
      enabledCategories,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(topics).where(isNull(topics.deletedAt)),
      db.select({ count: sql<number>`count(*)` }).from(topics).where(and(eq(topics.status, 'published'), isNull(topics.deletedAt))),
      db.select({ count: sql<number>`count(*)` }).from(topics).where(and(eq(topics.status, 'draft'), isNull(topics.deletedAt))),
      db.select({ count: sql<number>`count(*)` }).from(topics).where(and(eq(topics.status, 'offline'), isNull(topics.deletedAt))),
      db.select({ count: sql<number>`count(*)` }).from(vocabularies).where(isNull(vocabularies.deletedAt)),
      db.select({ count: sql<number>`count(*)` }).from(vocabularies).where(and(eq(vocabularies.status, 'published'), isNull(vocabularies.deletedAt))),
      db.select({ count: sql<number>`count(*)` }).from(categories),
      db.select({ count: sql<number>`count(*)` }).from(categories).where(eq(categories.enabled, true)),
    ]);

    // Topics by part
    const topicsByPart = await db.select({
      part: topics.part,
      count: sql<number>`count(*)`,
    }).from(topics).where(isNull(topics.deletedAt)).groupBy(topics.part);

    // Topics by difficulty
    const topicsByDifficulty = await db.select({
      difficulty: topics.difficulty,
      count: sql<number>`count(*)`,
    }).from(topics).where(isNull(topics.deletedAt)).groupBy(topics.difficulty);

    // Topics by category
    const topicsByCategory = await db.select({
      categoryId: topics.categoryId,
      count: sql<number>`count(*)`,
    }).from(topics).where(isNull(topics.deletedAt)).groupBy(topics.categoryId);

    // Vocabs by category
    const vocabsByCategory = await db.select({
      categoryId: vocabularies.categoryId,
      count: sql<number>`count(*)`,
    }).from(vocabularies).where(isNull(vocabularies.deletedAt)).groupBy(vocabularies.categoryId);

    // Get category names
    const allCategories = await db.select({ id: categories.id, nameZh: categories.nameZh }).from(categories);
    const catMap = new Map(allCategories.map(c => [c.id, c.nameZh]));

    // Recent 7 days creation trend
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentTopicCreations = await db.select({
      date: sql<string>`date(created_at / 1000, 'unixepoch')`,
      count: sql<number>`count(*)`,
    }).from(topics).where(sql`created_at > ${sevenDaysAgo}`).groupBy(sql`date(created_at / 1000, 'unixepoch')`).orderBy(sql`date(created_at / 1000, 'unixepoch')`);

    const recentVocabCreations = await db.select({
      date: sql<string>`date(created_at / 1000, 'unixepoch')`,
      count: sql<number>`count(*)`,
    }).from(vocabularies).where(sql`created_at > ${sevenDaysAgo}`).groupBy(sql`date(created_at / 1000, 'unixepoch')`).orderBy(sql`date(created_at / 1000, 'unixepoch')`);

    return {
      topics: {
        total: totalTopics[0]?.count ?? 0,
        published: publishedTopics[0]?.count ?? 0,
        draft: draftTopics[0]?.count ?? 0,
        offline: offlineTopics[0]?.count ?? 0,
        byPart: topicsByPart.reduce((acc, item) => { acc[item.part] = item.count; return acc; }, {} as Record<number, number>),
        byDifficulty: topicsByDifficulty.reduce((acc, item) => { acc[item.difficulty] = item.count; return acc; }, {} as Record<string, number>),
        byCategory: topicsByCategory.map(item => ({
          categoryId: item.categoryId,
          name: catMap.get(item.categoryId) ?? '未知',
          count: item.count,
        })),
      },
      vocabularies: {
        total: totalVocabs[0]?.count ?? 0,
        published: publishedVocabs[0]?.count ?? 0,
        byCategory: vocabsByCategory.map(item => ({
          categoryId: item.categoryId,
          name: catMap.get(item.categoryId) ?? '未知',
          count: item.count,
        })),
      },
      categories: {
        total: totalCategories[0]?.count ?? 0,
        enabled: enabledCategories[0]?.count ?? 0,
      },
      trends: {
        topicCreations: recentTopicCreations,
        vocabCreations: recentVocabCreations,
      },
    };
  },
};