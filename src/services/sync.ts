import { db } from '../db/index';

const SYNC_VERSION_KEY = 'jsay-sync-version';
const SYNC_TIMESTAMP_KEY = 'jsay-sync-timestamp';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface SyncData {
  version: string | null;
  syncedAt: string;
  categories: any[];
  topics: any[];
  vocabularies: any[];
}

/**
 * Check server version and sync if needed.
 * Falls back gracefully if server is unreachable.
 */
export async function syncFromServer(): Promise<{ synced: boolean; version: string | null; topicCount: number; vocabCount: number }> {
  if (!API_BASE) {
    console.log('[sync] VITE_API_BASE not configured, skipping sync');
    return { synced: false, version: null, topicCount: 0, vocabCount: 0 };
  }

  try {
    // Check server version
    const versionRes = await fetch(`${API_BASE}/api/sync/version`);
    if (!versionRes.ok) throw new Error(`Version check failed: ${versionRes.status}`);
    const versionData = await versionRes.json();
    const serverVersion = versionData.data?.version;

    if (!serverVersion) {
      console.log('[sync] No version on server, skipping sync');
      return { synced: false, version: null, topicCount: 0, vocabCount: 0 };
    }

    const localVersion = localStorage.getItem(SYNC_VERSION_KEY);
    if (localVersion === serverVersion) {
      console.log(`[sync] Already up to date (v${serverVersion})`);
      return { synced: false, version: serverVersion, topicCount: 0, vocabCount: 0 };
    }

    // Fetch full sync data
    const dataRes = await fetch(`${API_BASE}/api/sync/data`);
    if (!dataRes.ok) throw new Error(`Sync data fetch failed: ${dataRes.status}`);
    const dataJson = await dataRes.json();
    const syncData: SyncData = dataJson.data;

    if (!syncData.topics?.length && !syncData.vocabularies?.length) {
      console.log('[sync] No data to sync');
      return { synced: false, version: serverVersion, topicCount: 0, vocabCount: 0 };
    }

    // Map server topics to local Topic format
    const topicCategoryMap = new Map(syncData.categories.map((c: any) => [c.id, c.slug]));
    const mappedTopics = syncData.topics.map((t: any) => ({
      id: t.id,
      part: t.part as 1 | 2 | 3,
      category: topicCategoryMap.get(t.categoryId) || 'daily',
      title: t.title,
      content: t.content,
      prompts: t.prompts || [],
      questions: t.questions || [],
      examples: t.examples || [],
      part2Example: t.part2Example || undefined,
      relatedPart2Id: t.relatedPart2Id || null,
      difficulty: t.difficulty as 'easy' | 'medium' | 'hard',
      isCustom: false,
      isFavorite: false,
      createdAt: new Date(t.createdAt).getTime(),
      updatedAt: new Date(t.updatedAt).getTime(),
    }));

    // Map server vocabularies to local Vocabulary format
    const mappedVocabs = syncData.vocabularies.map((v: any) => ({
      id: v.id,
      word: v.word,
      definition: v.definition,
      example: v.example || '',
      category: topicCategoryMap.get(v.categoryId) || 'daily',
      relatedTopicIds: v.relatedTopicIds || [],
      isCustom: false,
      isFavorite: false,
      createdAt: new Date(v.createdAt || Date.now()).getTime(),
    }));

    // Write to IndexedDB in a transaction
    await db.transaction('rw', [db.topics, db.vocabulary], async () => {
      // Clear non-custom, non-favorite items and replace with server data
      // Keep user's custom topics and favorites
      await db.topics.filter(t => !t.isCustom).delete();
      await db.vocabulary.filter(v => !v.isCustom).delete();

      await db.topics.bulkAdd(mappedTopics as any);
      await db.vocabulary.bulkAdd(mappedVocabs as any);
    });

    // Update local version
    localStorage.setItem(SYNC_VERSION_KEY, serverVersion);
    localStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());

    console.log(`[sync] Synced v${serverVersion}: ${mappedTopics.length} topics, ${mappedVocabs.length} vocabs`);
    return { synced: true, version: serverVersion, topicCount: mappedTopics.length, vocabCount: mappedVocabs.length };
  } catch (err) {
    console.warn('[sync] Sync failed, using local data:', err);
    return { synced: false, version: null, topicCount: 0, vocabCount: 0 };
  }
}

/**
 * Get last sync info
 */
export function getSyncInfo(): { version: string | null; lastSyncAt: string | null } {
  return {
    version: localStorage.getItem(SYNC_VERSION_KEY),
    lastSyncAt: localStorage.getItem(SYNC_TIMESTAMP_KEY),
  };
}