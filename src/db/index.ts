import Dexie, { type Table } from 'dexie';
import type { Topic, PracticeRecord, RecordingSegment, AudioBlob, Vocabulary } from '@/types';

class JSayDB extends Dexie {
  topics!: Table<Topic>;
  practiceRecords!: Table<PracticeRecord>;
  recordingSegments!: Table<RecordingSegment>;
  audioBlobs!: Table<AudioBlob>;
  vocabulary!: Table<Vocabulary>;

  constructor() {
    super('JSayDB');

    this.version(1).stores({
      topics: '++id, part, category, difficulty, isFavorite, isCustom, [part+category]',
      practiceRecords: '++id, mode, startedAt, completedAt',
      recordingSegments: '++id, practiceRecordId, part, [practiceRecordId+part]',
      audioBlobs: '++id',
      vocabulary: '++id, word, category, isFavorite, isCustom, [category+isFavorite]',
    });
  }
}

export const db = new JSayDB();