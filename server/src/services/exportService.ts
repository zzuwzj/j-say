import { db } from '../db/index';
import { topics, vocabularies, categories } from '../db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';

interface ExportOptions {
  status?: 'draft' | 'published' | 'offline';
  part?: 1 | 2 | 3;
  categoryId?: number;
}

export const exportService = {
  async exportData(options: ExportOptions = {}) {
    const { status, part, categoryId } = options;

    // Build topic conditions
    const topicConditions = [isNull(topics.deletedAt)];
    if (status) topicConditions.push(eq(topics.status, status));
    if (part) topicConditions.push(eq(topics.part, part));
    if (categoryId) topicConditions.push(eq(topics.categoryId, categoryId));

    // Build vocab conditions
    const vocabConditions = [isNull(vocabularies.deletedAt)];
    if (status) vocabConditions.push(eq(vocabularies.status, status));
    if (categoryId) vocabConditions.push(eq(vocabularies.categoryId, categoryId));

    const [topicList, vocabList, categoryList] = await Promise.all([
      db.select().from(topics).where(and(...topicConditions)).orderBy(asc(topics.id)),
      db.select().from(vocabularies).where(and(...vocabConditions)).orderBy(asc(vocabularies.id)),
      db.select().from(categories).orderBy(asc(categories.id)),
    ]);

    // Build category map for slug resolution
    const catMap = new Map(categoryList.map(c => [c.id, c]));

    // Format topics for export (compatible with J-Say frontend data format)
    const exportedTopics = topicList.map(t => {
      const cat = catMap.get(t.categoryId);
      return {
        part: t.part,
        categorySlug: cat?.slug ?? '',
        title: t.title,
        content: t.content,
        prompts: t.prompts,
        questions: t.questions,
        examples: t.examples,
        part2Example: t.part2Example,
        relatedPart2Id: t.relatedPart2Id,
        difficulty: t.difficulty,
        status: t.status,
      };
    });

    // Format vocabularies for export
    const exportedVocabs = vocabList.map(v => {
      const cat = catMap.get(v.categoryId);
      return {
        word: v.word,
        definition: v.definition,
        example: v.example,
        categorySlug: cat?.slug ?? '',
        relatedTopicIds: v.relatedTopicIds,
        status: v.status,
      };
    });

    return {
      exportedAt: new Date().toISOString(),
      filters: options,
      categories: categoryList.map(c => ({ slug: c.slug, nameZh: c.nameZh, nameEn: c.nameEn })),
      topics: exportedTopics,
      vocabularies: exportedVocabs,
      summary: {
        topicCount: exportedTopics.length,
        vocabCount: exportedVocabs.length,
        categoryCount: categoryList.length,
      },
    };
  },
};