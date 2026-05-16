import { db } from '../db/index';
import { topics, vocabularies, categories, systemConfig } from '../db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';

export const syncService = {
  async getVersion() {
    const result = await db.select().from(systemConfig).where(eq(systemConfig.key, 'current_version'));
    return result[0]?.value ?? null;
  },

  async getSyncData() {
    const [publishedTopics, publishedVocabs, allCategories, versionRow] = await Promise.all([
      db.select({
        id: topics.id,
        part: topics.part,
        categoryId: topics.categoryId,
        title: topics.title,
        content: topics.content,
        prompts: topics.prompts,
        questions: topics.questions,
        examples: topics.examples,
        part2Example: topics.part2Example,
        relatedPart2Id: topics.relatedPart2Id,
        difficulty: topics.difficulty,
        version: topics.version,
        updatedAt: topics.updatedAt,
      }).from(topics)
        .where(and(eq(topics.status, 'published'), isNull(topics.deletedAt)))
        .orderBy(asc(topics.id)),
      db.select({
        id: vocabularies.id,
        word: vocabularies.word,
        definition: vocabularies.definition,
        example: vocabularies.example,
        categoryId: vocabularies.categoryId,
        relatedTopicIds: vocabularies.relatedTopicIds,
        version: vocabularies.version,
        updatedAt: vocabularies.updatedAt,
      }).from(vocabularies)
        .where(and(eq(vocabularies.status, 'published'), isNull(vocabularies.deletedAt)))
        .orderBy(asc(vocabularies.id)),
      db.select().from(categories).where(eq(categories.enabled, true)).orderBy(asc(categories.sortOrder)),
      db.select().from(systemConfig).where(eq(systemConfig.key, 'current_version')),
    ]);

    return {
      version: versionRow[0]?.value ?? null,
      syncedAt: new Date().toISOString(),
      categories: allCategories,
      topics: publishedTopics,
      vocabularies: publishedVocabs,
    };
  },
};