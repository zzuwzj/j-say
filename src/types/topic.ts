/** IELTS 口语考试 Part 枚举 */
export type PartNumber = 1 | 2 | 3;

/** 话题难度 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** 话题分类 */
export type TopicCategory =
  | 'person'
  | 'experience'
  | 'place'
  | 'object'
  | 'event'
  | 'society'
  | 'daily'
  | 'education'
  | 'technology'
  | 'culture';

/** 话题分类中文映射 */
export const TOPIC_CATEGORY_LABELS: Record<TopicCategory, string> = {
  person: '人物',
  experience: '经历',
  place: '地点',
  object: '物品',
  event: '事件',
  society: '社会',
  daily: '日常生活',
  education: '教育',
  technology: '科技',
  culture: '文化',
};

/** 难度中文映射 */
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

/** 问题示例（简单回答 + 7 分回答） */
export interface QuestionExample {
  /** 一句话简单示例 */
  simple: string;
  /** 7 分水平的示例回答 */
  band7: string;
}

/** 话题 */
export interface Topic {
  id: number;
  part: PartNumber;
  category: TopicCategory;
  title: string;
  content: string;
  /** Part 2 话题卡的提示点，仅 part=2 时有值 */
  prompts: string[];
  /** 该话题下的问题列表 */
  questions: string[];
  /** 每个问题的示例回答，与 questions 一一对应 */
  examples: QuestionExample[];
  /** Part 2 独白示例（仅 part=2 时有值） */
  part2Example?: QuestionExample;
  /** Part 3 关联的 Part 2 话题 ID，仅 part=3 时有值 */
  relatedPart2Id: number | null;
  difficulty: Difficulty;
  isCustom: boolean;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

/** Part 1 话题组（一组相关问答） */
export interface Part1TopicGroup {
  topic: Topic;
  /** 每个问题对应建议的回答时长（秒） */
  suggestedDurations: number[];
}

/** Part 2 话题卡（含准备和独白阶段） */
export interface Part2CueCard {
  topic: Topic;
  preparationSeconds: number;
  speakingSeconds: number;
}

/** Part 3 讨论组 */
export interface Part3Discussion {
  topic: Topic;
  relatedPart2Title: string;
}