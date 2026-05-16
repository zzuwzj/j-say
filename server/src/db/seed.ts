import { db } from './index';
import { categories, topics, vocabularies, systemConfig } from './schema';
import { eq, sql } from 'drizzle-orm';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

const SYSTEM_CATEGORIES = [
  { slug: 'person', nameZh: '人物', nameEn: 'Person', sortOrder: 1, isSystem: true },
  { slug: 'experience', nameZh: '经历', nameEn: 'Experience', sortOrder: 2, isSystem: true },
  { slug: 'place', nameZh: '地点', nameEn: 'Place', sortOrder: 3, isSystem: true },
  { slug: 'object', nameZh: '物品', nameEn: 'Object', sortOrder: 4, isSystem: true },
  { slug: 'event', nameZh: '事件', nameEn: 'Event', sortOrder: 5, isSystem: true },
  { slug: 'society', nameZh: '社会', nameEn: 'Society', sortOrder: 6, isSystem: true },
  { slug: 'daily', nameZh: '日常生活', nameEn: 'Daily Life', sortOrder: 7, isSystem: true },
  { slug: 'education', nameZh: '教育', nameEn: 'Education', sortOrder: 8, isSystem: true },
  { slug: 'technology', nameZh: '科技', nameEn: 'Technology', sortOrder: 9, isSystem: true },
  { slug: 'culture', nameZh: '文化', nameEn: 'Culture', sortOrder: 10, isSystem: true },
];

interface SeedTopic {
  part: number;
  categorySlug: string;
  title: string;
  content: string;
  prompts: string[];
  questions: string[];
  examples: Array<{ simple: string; band7: string }>;
  part2Example: { simple: string; band7: string } | null;
  relatedPart2Id: number | null;
  difficulty: 'easy' | 'medium' | 'hard';
  isCustom: boolean;
  isFavorite: boolean;
  status: string;
  version: number;
}

interface SeedVocab {
  word: string;
  definition: string;
  example: string | null;
  categorySlug: string;
  relatedTopicIds: number[];
  isCustom: boolean;
  isFavorite: boolean;
  status: string;
  version: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TOPICS_JSON = path.join(DATA_DIR, 'seed-topics.json');
const VOCAB_JSON = path.join(DATA_DIR, 'seed-vocabularies.json');

async function seed() {
  console.log('Seeding database...');

  for (const cat of SYSTEM_CATEGORIES) {
    await db.insert(categories).values({
      ...cat,
      enabled: true,
      createdAt: new Date(),
    }).onConflictDoNothing({ target: categories.slug });
  }
  console.log(`Inserted ${SYSTEM_CATEGORIES.length} categories`);

  const allCategories = await db.select().from(categories);
  const slugMap = new Map(allCategories.map(c => [c.slug, c.id]));

  // 清空非自定义的内置话题与词汇,然后重导
  const delTopics = await db.delete(topics).where(eq(topics.isCustom, false));
  console.log(`Cleared built-in topics: ${delTopics.changes ?? '?'}`);
  const delVocab = await db.delete(vocabularies).where(eq(vocabularies.isCustom, false));
  console.log(`Cleared built-in vocabularies: ${delVocab.changes ?? '?'}`);

  // 导入 topics
  if (existsSync(TOPICS_JSON)) {
    const seedTopics: SeedTopic[] = JSON.parse(readFileSync(TOPICS_JSON, 'utf-8'));
    let inserted = 0;
    let skipped = 0;
    for (const t of seedTopics) {
      const catId = slugMap.get(t.categorySlug);
      if (!catId) {
        console.warn(`  skip topic "${t.title}": unknown category slug "${t.categorySlug}"`);
        skipped++;
        continue;
      }
      await db.insert(topics).values({
        part: t.part,
        categoryId: catId,
        title: t.title,
        content: t.content,
        prompts: t.prompts,
        questions: t.questions,
        examples: t.examples,
        part2Example: t.part2Example,
        relatedPart2Id: t.relatedPart2Id,
        difficulty: t.difficulty,
        isCustom: t.isCustom,
        isFavorite: t.isFavorite,
        status: t.status,
        version: t.version,
        publishedAt: t.status === 'published' ? new Date() : null,
      });
      inserted++;
    }
    console.log(`Imported topics: inserted=${inserted}, skipped=${skipped}`);
  } else {
    console.log(`No ${TOPICS_JSON}. Run: npx tsx scripts/convert-data.ts`);
  }

  // 导入 vocabularies
  if (existsSync(VOCAB_JSON)) {
    const seedVocabs: SeedVocab[] = JSON.parse(readFileSync(VOCAB_JSON, 'utf-8'));
    let inserted = 0;
    let skipped = 0;
    for (const v of seedVocabs) {
      const catId = slugMap.get(v.categorySlug);
      if (!catId) {
        console.warn(`  skip vocab "${v.word}": unknown category slug "${v.categorySlug}"`);
        skipped++;
        continue;
      }
      await db.insert(vocabularies).values({
        word: v.word,
        definition: v.definition,
        example: v.example,
        categoryId: catId,
        relatedTopicIds: v.relatedTopicIds,
        isCustom: v.isCustom,
        isFavorite: v.isFavorite,
        status: v.status,
        version: v.version,
      });
      inserted++;
    }
    console.log(`Imported vocabularies: inserted=${inserted}, skipped=${skipped}`);
  } else {
    console.log(`No ${VOCAB_JSON}. Run: npx tsx scripts/convert-data.ts`);
  }

  await db.insert(systemConfig).values([
    { key: 'current_version', value: '1.0.0', updatedAt: new Date() },
    { key: 'import_limit', value: '5000', updatedAt: new Date() },
    { key: 'sync_enabled', value: 'true', updatedAt: new Date() },
  ]).onConflictDoNothing({ target: systemConfig.key });

  console.log('System config initialized.');

  const topicTotal = await db.select({ count: sql<number>`count(*)` }).from(topics);
  const vocabTotal = await db.select({ count: sql<number>`count(*)` }).from(vocabularies);
  console.log(`DB totals: topics=${topicTotal[0]?.count}, vocabularies=${vocabTotal[0]?.count}`);
  console.log('Seed completed.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
