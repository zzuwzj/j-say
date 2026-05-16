import type { PartNumber } from './topic';

/** 练习模式 */
export type PracticeMode = 'full' | 'part1' | 'part2' | 'part3';

/** IELTS 四维评分 */
export interface IeltsScores {
  fluency: number;
  lexical: number;
  grammar: number;
  pronunciation: number;
}

/** 练习记录 */
export interface PracticeRecord {
  id: number;
  mode: PracticeMode;
  topicIds: number[];
  startedAt: number;
  completedAt: number;
  duration: number;
  scores: IeltsScores | null;
  notes: string;
  createdAt: number;
}

/** 录音片段 */
export interface RecordingSegment {
  id: number;
  practiceRecordId: number;
  part: PartNumber;
  questionIndex: number;
  audioBlobId: number;
  transcript: string;
  duration: number;
  createdAt: number;
}

/** 音频 Blob 独立存储 */
export interface AudioBlob {
  id: number;
  data: Blob;
  createdAt: number;
}

/** 练习会话阶段 */
export type SessionPhase =
  | 'idle'
  | 'part1-answering'
  | 'part2-preparing'
  | 'part2-speaking'
  | 'part3-answering'
  | 'paused'
  | 'completed';

/** 练习模式中文映射 */
export const PRACTICE_MODE_LABELS: Record<PracticeMode, string> = {
  full: '完整模拟',
  part1: 'Part 1 练习',
  part2: 'Part 2 练习',
  part3: 'Part 3 练习',
};

/** Part 中文映射 */
export const PART_LABELS: Record<PartNumber, string> = {
  1: 'Part 1',
  2: 'Part 2',
  3: 'Part 3',
};

/** 评分维度中文映射 */
export const SCORE_DIMENSION_LABELS: Record<keyof IeltsScores, string> = {
  fluency: '流利度与连贯性',
  lexical: '词汇多样性',
  grammar: '语法范围与准确性',
  pronunciation: '发音',
};