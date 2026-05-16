import type { TopicCategory } from './topic';

/** 词汇条目 */
export interface Vocabulary {
  id: number;
  word: string;
  definition: string;
  example: string;
  category: TopicCategory;
  relatedTopicIds: number[];
  isCustom: boolean;
  isFavorite: boolean;
  createdAt: number;
}