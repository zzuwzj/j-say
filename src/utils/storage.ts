import { db } from '@/db/index';
import type { PracticeRecord, Topic, Vocabulary } from '@/types';

interface ExportData {
  version: 1;
  exportedAt: number;
  practiceRecords: PracticeRecord[];
  recordingSegments: { id: number; practiceRecordId: number; part: 1 | 2 | 3; questionIndex: number; transcript: string; duration: number; createdAt: number }[];
  topics: Topic[];
  vocabulary: Vocabulary[];
}

export async function exportData(): Promise<string> {
  const [practiceRecords, recordingSegments, topics, vocabulary] = await Promise.all([
    db.practiceRecords.toArray(),
    db.recordingSegments.toArray(),
    db.topics.toArray(),
    db.vocabulary.toArray(),
  ]);

  // Exclude audioBlobId from segments since we don't export blobs
  const segments = recordingSegments.map(({ audioBlobId, ...rest }) => rest);

  const data: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    practiceRecords,
    recordingSegments: segments as any,
    topics,
    vocabulary,
  };

  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  const data: ExportData = JSON.parse(jsonString);
  if (data.version !== 1) throw new Error('Unsupported export version');

  await db.transaction('rw', [db.topics, db.practiceRecords, db.recordingSegments, db.vocabulary], async () => {
    await db.topics.clear();
    await db.topics.bulkAdd(data.topics);
    await db.practiceRecords.clear();
    await db.practiceRecords.bulkAdd(data.practiceRecords);
    await db.recordingSegments.clear();
    await db.recordingSegments.bulkAdd(data.recordingSegments as any);
    await db.vocabulary.clear();
    await db.vocabulary.bulkAdd(data.vocabulary);
  });
}