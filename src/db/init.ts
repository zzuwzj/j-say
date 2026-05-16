import { db } from './index';
import { part1Topics } from '@/data/topics/part1';
import { part2Topics } from '@/data/topics/part2';
import { part3Topics } from '@/data/topics/part3';
import { builtInVocabulary } from '@/data/vocabulary';
import { syncFromServer } from '@/services/sync';

const DATA_VERSION_KEY = 'jsay-data-version';
const DATA_VERSION = 3; // Bump when built-in data structure changes

export async function initDatabase(): Promise<void> {
  try {
    const storedVersion = parseInt(localStorage.getItem(DATA_VERSION_KEY) || '0', 10);
    const needsReseed = storedVersion < DATA_VERSION;

    await db.transaction('rw', [db.topics, db.vocabulary], async () => {
      if (needsReseed) {
        // Clear and re-seed topics with latest data
        await db.topics.clear();
        const allTopics = [...part1Topics, ...part2Topics, ...part3Topics];
        await db.topics.bulkAdd(allTopics as any);
      }

      const vocabCount = await db.vocabulary.count();
      if (vocabCount === 0) {
        await db.vocabulary.bulkAdd(builtInVocabulary as any);
      }
    });

    if (needsReseed) {
      localStorage.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
    }
  } catch (e) {
    console.error('Failed to initialize database:', e);
  }

  // Try to sync from server (non-blocking, graceful fallback)
  syncFromServer().then(result => {
    if (result.synced) {
      console.log(`[init] Synced from server: v${result.version}, ${result.topicCount} topics, ${result.vocabCount} vocabs`);
    }
  }).catch(() => {
    // Silently ignore sync errors - local data is always available
  });
}