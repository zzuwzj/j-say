import { db } from './index';
import type { PracticeRecord, RecordingSegment, AudioBlob, IeltsScores, PartNumber } from '@/types';

export const practiceRepo = {
  async createRecord(record: Omit<PracticeRecord, 'id'>): Promise<number> {
    return db.practiceRecords.add(record as PracticeRecord);
  },

  async updateScoresAndNotes(id: number, scores: IeltsScores, notes: string): Promise<void> {
    await db.practiceRecords.update(id, { scores, notes });
  },

  async listRecords(page: number, pageSize: number): Promise<PracticeRecord[]> {
    return db.practiceRecords
      .orderBy('startedAt')
      .reverse()
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
  },

  async getRecord(id: number): Promise<PracticeRecord | undefined> {
    return db.practiceRecords.get(id);
  },

  async countRecords(): Promise<number> {
    return db.practiceRecords.count();
  },

  async saveSegment(
    recordId: number,
    part: PartNumber,
    questionIndex: number,
    audioBlob: Blob,
    transcript: string,
    duration: number,
  ): Promise<number> {
    const blobId = await db.audioBlobs.add({ data: audioBlob, createdAt: Date.now() } as AudioBlob);
    return db.recordingSegments.add({
      practiceRecordId: recordId,
      part,
      questionIndex,
      audioBlobId: blobId,
      transcript,
      duration,
      createdAt: Date.now(),
    } as RecordingSegment);
  },

  async getSegments(recordId: number): Promise<RecordingSegment[]> {
    return db.recordingSegments
      .where('practiceRecordId')
      .equals(recordId)
      .sortBy('questionIndex');
  },

  async getAudioBlob(blobId: number): Promise<Blob | undefined> {
    const record = await db.audioBlobs.get(blobId);
    return record?.data;
  },

  async deleteRecord(id: number): Promise<void> {
    const segments = await this.getSegments(id);
    const blobIds = segments.map((s) => s.audioBlobId);
    await db.transaction('rw', [db.practiceRecords, db.recordingSegments, db.audioBlobs], async () => {
      await db.practiceRecords.delete(id);
      await db.recordingSegments.where('practiceRecordId').equals(id).delete();
      if (blobIds.length > 0) {
        await db.audioBlobs.bulkDelete(blobIds);
      }
    });
  },

  async statsByDate(days: number): Promise<Array<{ date: string; count: number; totalDuration: number }>> {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const records = await db.practiceRecords.where('startedAt').above(since).toArray();
    const map = new Map<string, { count: number; totalDuration: number }>();
    for (const r of records) {
      const date = new Date(r.startedAt).toISOString().slice(0, 10);
      const entry = map.get(date) ?? { count: 0, totalDuration: 0 };
      entry.count += 1;
      entry.totalDuration += r.duration;
      map.set(date, entry);
    }
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async avgScoreTrend(days: number): Promise<Array<{ date: string; avgScore: number }>> {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const records = await db.practiceRecords
      .where('startedAt')
      .above(since)
      .filter((r) => r.scores !== null)
      .toArray();
    const map = new Map<string, { sum: number; count: number }>();
    for (const r of records) {
      const date = new Date(r.startedAt).toISOString().slice(0, 10);
      const avg = (r.scores!.fluency + r.scores!.lexical + r.scores!.grammar + r.scores!.pronunciation) / 4;
      const entry = map.get(date) ?? { sum: 0, count: 0 };
      entry.sum += avg;
      entry.count += 1;
      map.set(date, entry);
    }
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, avgScore: Math.round((v.sum / v.count) * 10) / 10 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  async topicCoverage(): Promise<Array<{ category: string; count: number }>> {
    const records = await db.practiceRecords.toArray();
    const topicIds = new Set<number>();
    for (const r of records) {
      for (const id of r.topicIds) {
        topicIds.add(id);
      }
    }
    const topics = await db.topics.where('id').anyOf([...topicIds]).toArray();
    const map = new Map<string, number>();
    for (const t of topics) {
      map.set(t.category, (map.get(t.category) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([category, count]) => ({ category, count }));
  },

  async totalDuration(): Promise<number> {
    const records = await db.practiceRecords.toArray();
    return records.reduce((sum, r) => sum + r.duration, 0);
  },
};