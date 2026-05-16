import { db } from '../db/index';
import { topics, vocabularies, categories, auditLogs } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { config } from '../config';

interface ImportTopic {
  part: number;
  categoryId?: number;
  categorySlug?: string;
  title: string;
  content: string;
  prompts?: string[];
  questions: string[];
  examples?: Array<{ simple: string; band7: string }>;
  part2Example?: { simple: string; band7: string };
  relatedPart2Id?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ImportVocab {
  word: string;
  definition: string;
  example?: string;
  categoryId?: number;
  categorySlug?: string;
  relatedTopicIds?: number[];
}

interface ImportData {
  topics?: ImportTopic[];
  vocabularies?: ImportVocab[];
}

interface PreviewResult {
  topics: { total: number; valid: number; duplicate: number; invalid: number; duplicates: Array<{ title: string; part: number }> };
  vocabularies: { total: number; valid: number; duplicate: number; invalid: number; duplicates: Array<{ word: string }> };
}

type ImportStrategy = 'skip' | 'overwrite' | 'keep_both';

export const importService = {
  async preview(data: ImportData): Promise<PreviewResult> {
    const topicList = data.topics ?? [];
    const vocabList = data.vocabularies ?? [];

    // Build category slug map
    const allCategories = await db.select().from(categories);
    const slugMap = new Map(allCategories.map(c => [c.slug, c.id]));

    // Check topic duplicates
    const topicResult = { total: topicList.length, valid: 0, duplicate: 0, invalid: 0, duplicates: [] as Array<{ title: string; part: number }> };
    for (const t of topicList) {
      if (!t.title || !t.content || !t.questions?.length || !t.part || !t.difficulty) {
        topicResult.invalid++;
        continue;
      }
      const catId = t.categoryId ?? (t.categorySlug ? slugMap.get(t.categorySlug) : undefined);
      if (!catId) {
        topicResult.invalid++;
        continue;
      }
      const existing = await db.select({ id: topics.id }).from(topics)
        .where(and(eq(topics.title, t.title), eq(topics.part, t.part), isNull(topics.deletedAt)))
        .limit(1);
      if (existing.length > 0) {
        topicResult.duplicate++;
        topicResult.duplicates.push({ title: t.title, part: t.part });
      } else {
        topicResult.valid++;
      }
    }

    // Check vocab duplicates
    const vocabResult = { total: vocabList.length, valid: 0, duplicate: 0, invalid: 0, duplicates: [] as Array<{ word: string }> };
    for (const v of vocabList) {
      if (!v.word || !v.definition) {
        vocabResult.invalid++;
        continue;
      }
      const catId = v.categoryId ?? (v.categorySlug ? slugMap.get(v.categorySlug) : undefined);
      if (!catId) {
        vocabResult.invalid++;
        continue;
      }
      const existing = await db.select({ id: vocabularies.id }).from(vocabularies)
        .where(and(eq(vocabularies.word, v.word), isNull(vocabularies.deletedAt)))
        .limit(1);
      if (existing.length > 0) {
        vocabResult.duplicate++;
        vocabResult.duplicates.push({ word: v.word });
      } else {
        vocabResult.valid++;
      }
    }

    return { topics: topicResult, vocabularies: vocabResult };
  },

  async execute(data: ImportData, strategy: ImportStrategy = 'skip'): Promise<{ topicsImported: number; vocabsImported: number; topicsSkipped: number; vocabsSkipped: number }> {
    const limit = config.importLimit;
    const topicList = (data.topics ?? []).slice(0, limit);
    const vocabList = (data.vocabularies ?? []).slice(0, limit);

    // Build category slug map
    const allCategories = await db.select().from(categories);
    const slugMap = new Map(allCategories.map(c => [c.slug, c.id]));

    let topicsImported = 0;
    let topicsSkipped = 0;
    let vocabsImported = 0;
    let vocabsSkipped = 0;

    // Import topics
    for (const t of topicList) {
      if (!t.title || !t.content || !t.questions?.length || !t.part || !t.difficulty) {
        topicsSkipped++;
        continue;
      }
      const catId = t.categoryId ?? (t.categorySlug ? slugMap.get(t.categorySlug) : undefined);
      if (!catId) {
        topicsSkipped++;
        continue;
      }

      const existing = await db.select({ id: topics.id }).from(topics)
        .where(and(eq(topics.title, t.title), eq(topics.part, t.part), isNull(topics.deletedAt)))
        .limit(1);

      if (existing.length > 0) {
        if (strategy === 'skip') {
          topicsSkipped++;
          continue;
        }
        if (strategy === 'overwrite') {
          await db.update(topics).set({
            part: t.part,
            categoryId: catId,
            content: t.content,
            prompts: t.prompts ?? [],
            questions: t.questions,
            examples: t.examples ?? [],
            part2Example: t.part2Example ?? null,
            relatedPart2Id: t.relatedPart2Id ?? null,
            difficulty: t.difficulty,
            version: 1,
            updatedAt: new Date(),
          }).where(eq(topics.id, existing[0].id));
          topicsImported++;
          continue;
        }
        // keep_both: just insert as new
      }

      await db.insert(topics).values({
        part: t.part,
        categoryId: catId,
        title: t.title,
        content: t.content,
        prompts: t.prompts ?? [],
        questions: t.questions,
        examples: t.examples ?? [],
        part2Example: t.part2Example ?? null,
        relatedPart2Id: t.relatedPart2Id ?? null,
        difficulty: t.difficulty,
        status: 'draft',
        version: 1,
      });
      topicsImported++;
    }

    // Import vocabularies
    for (const v of vocabList) {
      if (!v.word || !v.definition) {
        vocabsSkipped++;
        continue;
      }
      const catId = v.categoryId ?? (v.categorySlug ? slugMap.get(v.categorySlug) : undefined);
      if (!catId) {
        vocabsSkipped++;
        continue;
      }

      const existing = await db.select({ id: vocabularies.id }).from(vocabularies)
        .where(and(eq(vocabularies.word, v.word), isNull(vocabularies.deletedAt)))
        .limit(1);

      if (existing.length > 0) {
        if (strategy === 'skip') {
          vocabsSkipped++;
          continue;
        }
        if (strategy === 'overwrite') {
          await db.update(vocabularies).set({
            definition: v.definition,
            example: v.example ?? null,
            categoryId: catId,
            relatedTopicIds: v.relatedTopicIds ?? [],
            version: 1,
            updatedAt: new Date(),
          }).where(eq(vocabularies.id, existing[0].id));
          vocabsImported++;
          continue;
        }
      }

      await db.insert(vocabularies).values({
        word: v.word,
        definition: v.definition,
        example: v.example ?? null,
        categoryId: catId,
        relatedTopicIds: v.relatedTopicIds ?? [],
        status: 'draft',
        version: 1,
      });
      vocabsImported++;
    }

    await db.insert(auditLogs).values({
      action: 'import',
      targetType: 'system',
      targetId: 0,
      detail: { topicsImported, vocabsImported, topicsSkipped, vocabsSkipped, strategy },
    });

    return { topicsImported, vocabsImported, topicsSkipped, vocabsSkipped };
  },
};