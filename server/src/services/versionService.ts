import { db } from '../db/index';
import { corpusVersions, systemConfig, topics, vocabularies, auditLogs } from '../db/schema';
import { eq, desc, asc, isNull, and, sql } from 'drizzle-orm';

interface VersionCreateRequest {
  version: string;
  summary?: string;
}

interface VersionDiff {
  addedTopics: number;
  removedTopics: number;
  modifiedTopics: number;
  addedVocabs: number;
  removedVocabs: number;
  modifiedVocabs: number;
  details: {
    addedTopicIds: number[];
    removedTopicIds: number[];
    modifiedTopicIds: number[];
    addedVocabIds: number[];
    removedVocabIds: number[];
    modifiedVocabIds: number[];
  };
}

export const versionService = {
  async list(page = 1, pageSize = 20) {
    const [data, countResult] = await Promise.all([
      db.select({
        id: corpusVersions.id,
        version: corpusVersions.version,
        summary: corpusVersions.summary,
        topicCount: corpusVersions.topicCount,
        vocabCount: corpusVersions.vocabCount,
        status: corpusVersions.status,
        publishedAt: corpusVersions.publishedAt,
        createdAt: corpusVersions.createdAt,
      }).from(corpusVersions)
        .orderBy(desc(corpusVersions.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ count: sql<number>`count(*)` }).from(corpusVersions),
    ]);

    const total = countResult[0]?.count ?? 0;
    return {
      data,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getById(id: number) {
    return db.query.corpusVersions.findFirst({
      where: eq(corpusVersions.id, id),
    });
  },

  async create(request: VersionCreateRequest) {
    // Snapshot all published topics and vocabularies
    const [publishedTopics, publishedVocabs] = await Promise.all([
      db.select().from(topics)
        .where(and(eq(topics.status, 'published'), isNull(topics.deletedAt)))
        .orderBy(asc(topics.id)),
      db.select().from(vocabularies)
        .where(and(eq(vocabularies.status, 'published'), isNull(vocabularies.deletedAt)))
        .orderBy(asc(vocabularies.id)),
    ]);

    const snapshot = {
      topics: publishedTopics,
      vocabularies: publishedVocabs,
      createdAt: new Date().toISOString(),
    };

    const [version] = await db.insert(corpusVersions).values({
      version: request.version,
      summary: request.summary ?? null,
      topicCount: publishedTopics.length,
      vocabCount: publishedVocabs.length,
      snapshot,
      status: 'unpublished',
    }).returning();

    await db.insert(auditLogs).values({
      action: 'create_version',
      targetType: 'version',
      targetId: version!.id,
      detail: { version: request.version, topicCount: publishedTopics.length, vocabCount: publishedVocabs.length },
    });

    return version;
  },

  async publish(id: number) {
    const version = await this.getById(id);
    if (!version) return null;

    // Unpublish current published version
    await db.update(corpusVersions)
      .set({ status: 'archived' })
      .where(eq(corpusVersions.status, 'published'));

    // Publish this version
    const [updated] = await db.update(corpusVersions)
      .set({ status: 'published', publishedAt: new Date() })
      .where(eq(corpusVersions.id, id))
      .returning();

    // Update system config
    await db.update(systemConfig)
      .set({ value: version.version, updatedAt: new Date() })
      .where(eq(systemConfig.key, 'current_version'));

    await db.insert(auditLogs).values({
      action: 'publish_version',
      targetType: 'version',
      targetId: id,
      detail: { version: version.version },
    });

    return updated;
  },

  async rollback(id: number) {
    const version = await this.getById(id);
    if (!version || !version.snapshot) return null;

    const snapshot = version.snapshot as { topics: any[]; vocabularies: any[] };

    // Restore topics from snapshot
    // First, set all current published topics to offline
    await db.update(topics)
      .set({ status: 'offline', updatedAt: new Date() })
      .where(and(eq(topics.status, 'published'), isNull(topics.deletedAt)));

    // Then restore snapshot topics
    for (const t of snapshot.topics) {
      const existing = await db.select({ id: topics.id }).from(topics)
        .where(eq(topics.id, t.id))
        .limit(1);

      if (existing.length > 0) {
        await db.update(topics).set({
          part: t.part,
          categoryId: t.categoryId,
          title: t.title,
          content: t.content,
          prompts: t.prompts,
          questions: t.questions,
          examples: t.examples,
          part2Example: t.part2Example,
          relatedPart2Id: t.relatedPart2Id,
          difficulty: t.difficulty,
          status: 'published',
          updatedAt: new Date(),
          deletedAt: null,
        }).where(eq(topics.id, t.id));
      } else {
        await db.insert(topics).values({
          id: t.id,
          part: t.part,
          categoryId: t.categoryId,
          title: t.title,
          content: t.content,
          prompts: t.prompts,
          questions: t.questions,
          examples: t.examples,
          part2Example: t.part2Example,
          relatedPart2Id: t.relatedPart2Id,
          difficulty: t.difficulty,
          status: 'published',
          version: t.version ?? 1,
        });
      }
    }

    // Restore vocabularies from snapshot
    await db.update(vocabularies)
      .set({ status: 'offline', updatedAt: new Date() })
      .where(and(eq(vocabularies.status, 'published'), isNull(vocabularies.deletedAt)));

    for (const v of snapshot.vocabularies) {
      const existing = await db.select({ id: vocabularies.id }).from(vocabularies)
        .where(eq(vocabularies.id, v.id))
        .limit(1);

      if (existing.length > 0) {
        await db.update(vocabularies).set({
          word: v.word,
          definition: v.definition,
          example: v.example,
          categoryId: v.categoryId,
          relatedTopicIds: v.relatedTopicIds,
          status: 'published',
          updatedAt: new Date(),
          deletedAt: null,
        }).where(eq(vocabularies.id, v.id));
      } else {
        await db.insert(vocabularies).values({
          id: v.id,
          word: v.word,
          definition: v.definition,
          example: v.example,
          categoryId: v.categoryId,
          relatedTopicIds: v.relatedTopicIds,
          status: 'published',
          version: v.version ?? 1,
        });
      }
    }

    // Publish the rolled-back version
    await db.update(corpusVersions)
      .set({ status: 'archived' })
      .where(eq(corpusVersions.status, 'published'));

    await db.update(corpusVersions)
      .set({ status: 'published', publishedAt: new Date() })
      .where(eq(corpusVersions.id, id));

    await db.update(systemConfig)
      .set({ value: version.version, updatedAt: new Date() })
      .where(eq(systemConfig.key, 'current_version'));

    await db.insert(auditLogs).values({
      action: 'rollback_version',
      targetType: 'version',
      targetId: id,
      detail: { version: version.version },
    });

    return { success: true, version: version.version };
  },

  async diff(fromId: number, toId: number): Promise<VersionDiff | null> {
    const [fromVersion, toVersion] = await Promise.all([
      this.getById(fromId),
      this.getById(toId),
    ]);

    if (!fromVersion?.snapshot || !toVersion?.snapshot) return null;

    const fromSnapshot = fromVersion.snapshot as { topics: any[]; vocabularies: any[] };
    const toSnapshot = toVersion.snapshot as { topics: any[]; vocabularies: any[] };

    const fromTopicMap = new Map(fromSnapshot.topics.map(t => [t.id, t]));
    const toTopicMap = new Map(toSnapshot.topics.map(t => [t.id, t]));
    const fromVocabMap = new Map(fromSnapshot.vocabularies.map(v => [v.id, v]));
    const toVocabMap = new Map(toSnapshot.vocabularies.map(v => [v.id, v]));

    const addedTopicIds: number[] = [];
    const removedTopicIds: number[] = [];
    const modifiedTopicIds: number[] = [];

    for (const [id] of toTopicMap) {
      if (!fromTopicMap.has(id)) addedTopicIds.push(id);
    }
    for (const [id, t] of fromTopicMap) {
      if (!toTopicMap.has(id)) removedTopicIds.push(id);
      else {
        const toT = toTopicMap.get(id);
        if (toT && (t.title !== toT.title || t.content !== toT.content || t.version !== toT.version)) {
          modifiedTopicIds.push(id);
        }
      }
    }

    const addedVocabIds: number[] = [];
    const removedVocabIds: number[] = [];
    const modifiedVocabIds: number[] = [];

    for (const [id] of toVocabMap) {
      if (!fromVocabMap.has(id)) addedVocabIds.push(id);
    }
    for (const [id, v] of fromVocabMap) {
      if (!toVocabMap.has(id)) removedVocabIds.push(id);
      else {
        const toV = toVocabMap.get(id);
        if (toV && (v.word !== toV.word || v.definition !== toV.definition || v.version !== toV.version)) {
          modifiedVocabIds.push(id);
        }
      }
    }

    return {
      addedTopics: addedTopicIds.length,
      removedTopics: removedTopicIds.length,
      modifiedTopics: modifiedTopicIds.length,
      addedVocabs: addedVocabIds.length,
      removedVocabs: removedVocabIds.length,
      modifiedVocabs: modifiedVocabIds.length,
      details: {
        addedTopicIds,
        removedTopicIds,
        modifiedTopicIds,
        addedVocabIds,
        removedVocabIds,
        modifiedVocabIds,
      },
    };
  },

  async delete(id: number) {
    const version = await this.getById(id);
    if (!version) return false;
    if (version.status === 'published') return false; // Can't delete published version

    await db.delete(corpusVersions).where(eq(corpusVersions.id, id));
    await db.insert(auditLogs).values({
      action: 'delete_version',
      targetType: 'version',
      targetId: id,
      detail: { version: version.version },
    });
    return true;
  },
};