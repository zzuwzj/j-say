/**
 * 将前端 src/data/ 目录下的内置数据转换为服务端种子数据 JSON
 * 用法: npx tsx scripts/convert-data.ts
 * 输出: server/data/seed-topics.json + server/data/seed-vocabularies.json
 */
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'server', 'data');

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log('Importing source data files...');

  const part1Url = pathToFileURL(resolve(ROOT, 'src', 'data', 'topics', 'part1.ts')).href;
  const part2Url = pathToFileURL(resolve(ROOT, 'src', 'data', 'topics', 'part2.ts')).href;
  const part3Url = pathToFileURL(resolve(ROOT, 'src', 'data', 'topics', 'part3.ts')).href;
  const vocabUrl = pathToFileURL(resolve(ROOT, 'src', 'data', 'vocabulary.ts')).href;

  const [{ part1Topics }, { part2Topics }, { part3Topics }, { builtInVocabulary }] = await Promise.all([
    import(part1Url),
    import(part2Url),
    import(part3Url),
    import(vocabUrl),
  ]);

  const allTopics = [...part1Topics, ...part2Topics, ...part3Topics];
  console.log(`Found ${allTopics.length} topics and ${builtInVocabulary.length} vocabularies`);

  const seedTopics = allTopics.map((t: any) => ({
    part: t.part,
    categorySlug: t.category || 'daily',
    title: t.title,
    content: t.content,
    prompts: t.prompts || [],
    questions: t.questions || [],
    examples: t.examples || [],
    part2Example: t.part2Example || null,
    relatedPart2Id: t.relatedPart2Id || null,
    difficulty: t.difficulty || 'medium',
    isCustom: t.isCustom ?? false,
    isFavorite: t.isFavorite ?? false,
    status: 'published' as const,
    version: 1,
  }));

  const seedVocabs = builtInVocabulary.map((v: any) => ({
    word: v.word,
    definition: v.definition,
    example: v.example || null,
    categorySlug: v.category || 'education',
    relatedTopicIds: v.relatedTopicIds || [],
    isCustom: v.isCustom ?? false,
    isFavorite: v.isFavorite ?? false,
    status: 'published' as const,
    version: 1,
  }));

  writeFileSync(resolve(OUT_DIR, 'seed-topics.json'), JSON.stringify(seedTopics, null, 2), 'utf-8');
  writeFileSync(resolve(OUT_DIR, 'seed-vocabularies.json'), JSON.stringify(seedVocabs, null, 2), 'utf-8');

  console.log(`Seed data written to ${OUT_DIR}`);
  console.log(`  - seed-topics.json: ${seedTopics.length} topics`);
  console.log(`  - seed-vocabularies.json: ${seedVocabs.length} vocabularies`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
