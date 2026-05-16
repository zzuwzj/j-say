# J-Say 系统分析设计文档（系分文档）

> 版本：v1.0 | 日期：2026-05-11

---

## 1. 文档说明

### 1.1 目的

本文档基于《J-Say 需求设计文档》，对系统进行详细的技术分析与设计，作为开发实施的依据。涵盖系统架构、模块划分、接口定义、数据模型、状态管理、组件设计、异常处理等完整技术方案。

### 1.2 读者

前端开发工程师

### 1.3 术语

| 术语 | 说明 |
|------|------|
| Session | 一次完整的练习会话，包含 1–3 个 Part |
| Segment | 一次录音片段，对应一个问题的回答 |
| Cue Card | IELTS Part 2 的话题卡片 |
| Transcript | 语音识别转写的文本 |
| TTS | Text-to-Speech，语音合成 |
| STT | Speech-to-Text，语音识别 |

---

## 2. 系统架构

### 2.1 总体架构

纯前端 SPA 架构，无服务端依赖。浏览器承担全部计算与存储。

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Runtime                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Presentation Layer                   │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────┐  │   │
│  │  │  Pages   │  │Components│  │   Hooks (UI)   │  │   │
│  │  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │   │
│  └───────┼──────────────┼────────────────┼───────────┘   │
│          │              │                │                │
│  ┌───────┼──────────────┼────────────────┼───────────┐   │
│  │       │        Business Layer          │           │   │
│  │  ┌────▼─────┐  ┌──────▼──────┐  ┌─────▼──────┐  │   │
│  │  │  Stores   │  │PracticeFlow │  │  Hooks     │  │   │
│  │  │ (Zustand) │  │  (状态机)    │  │ (业务逻辑) │  │   │
│  │  └────┬─────┘  └──────┬──────┘  └─────┬──────┘  │   │
│  └───────┼───────────────┼───────────────┼──────────┘   │
│          │               │               │               │
│  ┌───────┼───────────────┼───────────────┼───────────┐   │
│  │       │        Infrastructure Layer    │           │   │
│  │  ┌────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐  │   │
│  │  │  Dexie DB  │  │AudioEngine │  │SpeechEngine │  │   │
│  │  │ (IndexedDB)│  │(MediaRec.) │  │(WebSpeech)  │  │   │
│  │  └───────────┘  └────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │             Browser APIs                          │   │
│  │  IndexedDB │ MediaRecorder │ Web Speech API       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 分层职责

| 层次 | 职责 | 关键模块 |
|------|------|----------|
| Presentation | 页面渲染、用户交互、UI 状态 | Pages、Components、UI Hooks |
| Business | 练习流程控制、状态管理、业务规则 | Zustand Stores、PracticeFlow、Business Hooks |
| Infrastructure | 数据持久化、音频录制/播放、语音识别/合成 | Dexie DB、AudioEngine、SpeechEngine |

### 2.3 数据流

```
User Action → Component → Store Action → Infrastructure Call → Store State Update → Component Re-render
```

单向数据流，Store 为唯一数据源。Infrastructure 层通过 Promise/Callback 将结果返回 Store，不直接操作 UI。

---

## 3. 模块设计

### 3.1 模块总览

```
src/
├── components/
│   ├── ui/              # 基础 UI 组件（无业务逻辑）
│   ├── layout/          # 布局组件
│   └── shared/          # 共享业务组件
├── pages/
│   ├── Home/
│   ├── Practice/
│   ├── Topics/
│   ├── History/
│   ├── Vocabulary/
│   ├── Stats/
│   └── Settings/
├── hooks/               # 自定义 Hooks
├── stores/              # Zustand 状态管理
├── db/                  # 数据访问层
├── types/               # TypeScript 类型定义
├── utils/               # 纯工具函数
└── data/                # 内置静态数据
```

### 3.2 模块依赖规则

```
pages → components + stores + hooks
components/ui → 无依赖（最底层）
components/shared → components/ui + hooks
hooks → stores + db + utils
stores → db + types
db → types
utils → 无依赖（纯函数）
data → types
```

禁止反向依赖：`db` 不依赖 `stores`，`stores` 不依赖 `pages`。

---

## 4. 类型系统设计

### 4.1 核心类型定义

```typescript
// src/types/topic.ts

/** IELTS 口语考试 Part 枚举 */
type PartNumber = 1 | 2 | 3;

/** 话题难度 */
type Difficulty = 'easy' | 'medium' | 'hard';

/** 话题分类 */
type TopicCategory =
  | 'person'        // 人物
  | 'experience'    // 经历
  | 'place'         // 地点
  | 'object'        // 物品
  | 'event'         // 事件
  | 'society'       // 社会
  | 'daily'         // 日常生活
  | 'education'     // 教育
  | 'technology'    // 科技
  | 'culture';      // 文化

/** 话题 */
interface Topic {
  id: number;
  part: PartNumber;
  category: TopicCategory;
  title: string;
  content: string;
  /** Part 2 话题卡的提示点，仅 part=2 时有值 */
  prompts: string[];
  /** 该话题下的问题列表 */
  questions: string[];
  /** Part 3 关联的 Part 2 话题 ID，仅 part=3 时有值 */
  relatedPart2Id: number | null;
  difficulty: Difficulty;
  isCustom: boolean;
  isFavorite: boolean;
  createdAt: number;  // 时间戳
  updatedAt: number;
}

/** Part 1 话题组（一组相关问答） */
interface Part1TopicGroup {
  topic: Topic;
  /** 每个问题对应建议的回答时长（秒） */
  suggestedDurations: number[];
}

/** Part 2 话题卡（含准备和独白阶段） */
interface Part2CueCard {
  topic: Topic;
  preparationSeconds: number;  // 默认 60
  speakingSeconds: number;     // 默认 120
}

/** Part 3 讨论组 */
interface Part3Discussion {
  topic: Topic;
  relatedPart2Title: string;
}
```

```typescript
// src/types/practice.ts

/** 练习模式 */
type PracticeMode = 'full' | 'part1' | 'part2' | 'part3';

/** IELTS 四维评分 */
interface IeltsScores {
  fluency: number;       // 1–9
  lexical: number;       // 1–9
  grammar: number;       // 1–9
  pronunciation: number; // 1–9
}

/** 练习记录 */
interface PracticeRecord {
  id: number;
  mode: PracticeMode;
  topicIds: number[];
  startedAt: number;     // 时间戳
  completedAt: number;
  duration: number;      // 总时长（秒）
  scores: IeltsScores | null;
  notes: string;
  createdAt: number;
}

/** 录音片段 */
interface RecordingSegment {
  id: number;
  practiceRecordId: number;
  part: PartNumber;
  questionIndex: number;
  /** 音频 Blob 引用（IndexedDB 存储） */
  audioBlobId: number;   // 关联 AudioBlob 表
  transcript: string;
  duration: number;      // 录音时长（秒）
  createdAt: number;
}

/** 音频 Blob 独立存储（避免大 Blob 影响主表查询） */
interface AudioBlob {
  id: number;
  data: Blob;
  createdAt: number;
}

/** 练习会话中的当前状态 */
type SessionPhase =
  | 'idle'               // 未开始
  | 'part1-answering'    // Part 1 回答中
  | 'part2-preparing'    // Part 2 准备中
  | 'part2-speaking'     // Part 2 独白中
  | 'part3-answering'    // Part 3 回答中
  | 'paused'             // 暂停
  | 'completed';         // 已完成

/** 练习会话（仅存在于内存/Zustand，不持久化） */
interface PracticeSession {
  mode: PracticeMode;
  phase: SessionPhase;
  currentPart: PartNumber;
  currentQuestionIndex: number;
  topics: {
    part1: Part1TopicGroup | null;
    part2: Part2CueCard | null;
    part3: Part3Discussion | null;
  };
  segments: RecordingSegment[];
  startedAt: number;
  timeRemaining: number;
}
```

```typescript
// src/types/vocabulary.ts

/** 词汇条目 */
interface Vocabulary {
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
```

```typescript
// src/types/settings.ts

/** 应用设置（持久化到 localStorage） */
interface AppSettings {
  /** 语音合成口音 */
  ttsAccent: 'en-GB' | 'en-US';
  /** 是否启用考官语音 */
  ttsEnabled: boolean;
  /** 倒计时提示音 */
  timerSoundEnabled: boolean;
  /** 主题 */
  theme: 'light' | 'dark' | 'system';
  /** 是否已初始化题库 */
  topicsInitialized: boolean;
}
```

### 4.2 类型导出索引

```typescript
// src/types/index.ts
export type { Topic, Part1TopicGroup, Part2CueCard, Part3Discussion,
              TopicCategory, Difficulty, PartNumber } from './topic';
export type { PracticeMode, IeltsScores, PracticeRecord, RecordingSegment,
              AudioBlob, SessionPhase, PracticeSession } from './practice';
export type { Vocabulary } from './vocabulary';
export type { AppSettings } from './settings';
```

---

## 5. 数据层设计

### 5.1 数据库 Schema

采用 Dexie.js 封装 IndexedDB。将 `audioBlob` 独立为表，避免大 Blob 拖慢主表查询。

```typescript
// src/db/index.ts
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
```

### 5.2 索引设计说明

| 表 | 索引 | 用途 |
|------|------|------|
| topics | `part` | 按 Part 筛选话题 |
| topics | `category` | 按分类筛选 |
| topics | `[part+category]` | 复合查询：某 Part 下某分类的话题 |
| topics | `isFavorite` | 查询收藏话题 |
| topics | `isCustom` | 区分内置/自定义话题 |
| practiceRecords | `startedAt` | 按时间排序历史记录 |
| recordingSegments | `practiceRecordId` | 查询某次练习的所有录音 |
| recordingSegments | `[practiceRecordId+part]` | 查询某次练习某 Part 的录音 |
| vocabulary | `word` | 词汇搜索 |
| vocabulary | `[category+isFavorite]` | 按分类查收藏词汇 |

### 5.3 数据访问层（Repository）

对 Dexie 操作做一层封装，隔离业务层与数据库细节。

```typescript
// src/db/topic-repo.ts
import { db } from './index';
import type { Topic, TopicCategory, PartNumber, Difficulty } from '@/types';

export const topicRepo = {
  /** 按 Part 和可选条件查询话题 */
  async list(part?: PartNumber, category?: TopicCategory): Promise<Topic[]> {
    let collection = db.topics.orderBy('id');
    if (part && category) {
      return db.topics.where('[part+category]').equals([part, category]).toArray();
    }
    if (part) {
      return db.topics.where('part').equals(part).toArray();
    }
    return collection.toArray();
  },

  /** 随机抽取一个话题 */
  async random(part: PartNumber, category?: TopicCategory): Promise<Topic> {
    const list = await this.list(part, category);
    if (list.length === 0) throw new Error(`No topics found for part ${part}`);
    return list[Math.floor(Math.random() * list.length)];
  },

  /** 获取收藏话题 */
  async favorites(): Promise<Topic[]> {
    return db.topics.where('isFavorite').equals(1).toArray();
  },

  /** 切换收藏 */
  async toggleFavorite(id: number): Promise<void> {
    const topic = await db.topics.get(id);
    if (topic) {
      await db.topics.update(id, { isFavorite: !topic.isFavorite, updatedAt: Date.now() });
    }
  },

  /** 创建自定义话题 */
  async create(topic: Omit<Topic, 'id'>): Promise<number> {
    return db.topics.add(topic as Topic);
  },

  /** 删除自定义话题 */
  async deleteCustom(id: number): Promise<void> {
    const topic = await db.topics.get(id);
    if (topic?.isCustom) {
      await db.topics.delete(id);
    }
  },

  /** 批量写入内置题库（仅首次） */
  async bulkInit(topics: Topic[]): Promise<void> {
    const count = await db.topics.count();
    if (count > 0) return;
    await db.topics.bulkAdd(topics);
  },
};
```

```typescript
// src/db/practice-repo.ts
import { db } from './index';
import type { PracticeRecord, RecordingSegment, AudioBlob, IeltsScores } from '@/types';

export const practiceRepo = {
  /** 创建练习记录 */
  async createRecord(record: Omit<PracticeRecord, 'id'>): Promise<number> {
    return db.practiceRecords.add(record as PracticeRecord);
  },

  /** 更新评分和笔记 */
  async updateScoresAndNotes(id: number, scores: IeltsScores, notes: string): Promise<void> {
    await db.practiceRecords.update(id, { scores, notes });
  },

  /** 获取练习记录列表（分页，按时间倒序） */
  async listRecords(page: number, pageSize: number): Promise<PracticeRecord[]> {
    return db.practiceRecords
      .orderBy('startedAt')
      .reverse()
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
  },

  /** 获取单条练习记录 */
  async getRecord(id: number): Promise<PracticeRecord | undefined> {
    return db.practiceRecords.get(id);
  },

  /** 获取练习记录总数 */
  async countRecords(): Promise<number> {
    return db.practiceRecords.count();
  },

  /** 保存录音片段 */
  async saveSegment(
    recordId: number,
    part: 1 | 2 | 3,
    questionIndex: number,
    audioBlob: Blob,
    transcript: string,
    duration: number,
  ): Promise<number> {
    // 先存 Blob
    const blobId = await db.audioBlobs.add({ data: audioBlob, createdAt: Date.now() } as AudioBlob);
    // 再存片段记录
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

  /** 获取某次练习的所有录音片段 */
  async getSegments(recordId: number): Promise<RecordingSegment[]> {
    return db.recordingSegments
      .where('practiceRecordId')
      .equals(recordId)
      .sortBy('questionIndex');
  },

  /** 获取录音 Blob 数据 */
  async getAudioBlob(blobId: number): Promise<Blob | undefined> {
    const record = await db.audioBlobs.get(blobId);
    return record?.data;
  },

  /** 删除练习记录及关联数据 */
  async deleteRecord(id: number): Promise<void> {
    const segments = await this.getSegments(id);
    const blobIds = segments.map((s) => s.audioBlobId);
    await db.transaction('rw', [db.practiceRecords, db.recordingSegments, db.audioBlobs], async () => {
      await db.practiceRecords.delete(id);
      await db.recordingSegments.where('practiceRecordId').equals(id).delete();
      await db.audioBlobs.bulkDelete(blobIds);
    });
  },

  /** 统计数据：按日期聚合练习次数 */
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

  /** 统计数据：平均评分趋势 */
  async avgScoreTrend(days: number): Promise<Array<{ date: string; avgScore: number }>> {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const records = await db.practiceRecords
      .where('startedAt').above(since)
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
};
```

```typescript
// src/db/vocab-repo.ts
import { db } from './index';
import type { Vocabulary, TopicCategory } from '@/types';

export const vocabRepo = {
  async list(category?: TopicCategory): Promise<Vocabulary[]> {
    if (category) return db.vocabulary.where('category').equals(category).toArray();
    return db.vocabulary.toArray();
  },

  async search(query: string): Promise<Vocabulary[]> {
    const lower = query.toLowerCase();
    return db.vocabulary.filter((v) => v.word.toLowerCase().includes(lower)).toArray();
  },

  async favorites(): Promise<Vocabulary[]> {
    return db.vocabulary.where('isFavorite').equals(1).toArray();
  },

  async toggleFavorite(id: number): Promise<void> {
    const vocab = await db.vocabulary.get(id);
    if (vocab) await db.vocabulary.update(id, { isFavorite: !vocab.isFavorite });
  },

  async create(vocab: Omit<Vocabulary, 'id'>): Promise<number> {
    return db.vocabulary.add(vocab as Vocabulary);
  },

  async deleteCustom(id: number): Promise<void> {
    const vocab = await db.vocabulary.get(id);
    if (vocab?.isCustom) await db.vocabulary.delete(id);
  },

  async bulkInit(items: Vocabulary[]): Promise<void> {
    const count = await db.vocabulary.count();
    if (count > 0) return;
    await db.vocabulary.bulkAdd(items);
  },
};
```

### 5.4 数据库版本迁移策略

```typescript
// src/db/migrations.ts
// Dexie 支持 version() 链式升级，每个版本只定义增量变更

// 示例：未来 v2 新增字段
// db.version(2).stores({
//   topics: '++id, part, category, difficulty, isFavorite, isCustom, season, [part+category]',
// }).upgrade(tx => {
//   return tx.table('topics').toCollection().modify(topic => {
//     topic.season = 'all'; // 新增字段默认值
//   });
// });
```

---

## 6. 状态管理设计

### 6.1 Store 划分

| Store | 职责 | 持久化 |
|-------|------|--------|
| `practiceStore` | 当前练习会话状态（流程控制、录音状态、倒计时） | 不持久化（会话级） |
| `settingsStore` | 应用设置（TTS、主题等） | localStorage |
| 话题/历史/词汇 | 不设 Store，通过 React Query 风格的 hooks 直接从 DB 读取 | IndexedDB |

> **设计决策**：话题列表、练习历史、词汇本等数据量较大且变更不频繁，不适合放入 Zustand。采用"查询时从 DB 读取 + 操作后局部刷新"的模式，由自定义 Hooks 封装。

### 6.2 practiceStore

```typescript
// src/stores/practiceStore.ts
import { create } from 'zustand';
import type { PracticeMode, PartNumber, SessionPhase, IeltsScores, RecordingSegment,
              Part1TopicGroup, Part2CueCard, Part3Discussion } from '@/types';

interface PracticeState {
  // --- 会话元信息 ---
  mode: PracticeMode;
  phase: SessionPhase;
  currentPart: PartNumber;
  currentQuestionIndex: number;

  // --- 话题 ---
  part1Topic: Part1TopicGroup | null;
  part2Topic: Part2CueCard | null;
  part3Topic: Part3Discussion | null;

  // --- 录音 ---
  isRecording: boolean;
  segments: RecordingSegment[];
  currentTranscript: string;

  // --- 倒计时 ---
  timeRemaining: number;
  isTimerRunning: boolean;

  // --- 时间戳 ---
  sessionStartedAt: number;

  // --- Actions ---
  startSession: (mode: PracticeMode, topics: {
    part1?: Part1TopicGroup;
    part2?: Part2CueCard;
    part3?: Part3Discussion;
  }) => void;
  setPhase: (phase: SessionPhase) => void;
  nextQuestion: () => void;
  goToPart: (part: PartNumber) => void;
  startRecording: () => void;
  stopRecording: () => void;
  addSegment: (segment: RecordingSegment) => void;
  setCurrentTranscript: (text: string) => void;
  setTimeRemaining: (seconds: number) => void;
  setTimerRunning: (running: boolean) => void;
  completeSession: () => void;
  resetSession: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  // 初始状态
  mode: 'full',
  phase: 'idle',
  currentPart: 1,
  currentQuestionIndex: 0,
  part1Topic: null,
  part2Topic: null,
  part3Topic: null,
  isRecording: false,
  segments: [],
  currentTranscript: '',
  timeRemaining: 0,
  isTimerRunning: false,
  sessionStartedAt: 0,

  startSession: (mode, topics) => set({
    mode,
    phase: mode === 'full' ? 'part1-answering' :
           mode === 'part1' ? 'part1-answering' :
           mode === 'part2' ? 'part2-preparing' : 'part3-answering',
    currentPart: mode === 'full' ? 1 : (mode === 'part2' ? 2 : mode === 'part3' ? 3 : 1),
    currentQuestionIndex: 0,
    part1Topic: topics.part1 ?? null,
    part2Topic: topics.part2 ?? null,
    part3Topic: topics.part3 ?? null,
    segments: [],
    currentTranscript: '',
    sessionStartedAt: Date.now(),
  }),

  setPhase: (phase) => set({ phase }),

  nextQuestion: () => set((state) => ({
    currentQuestionIndex: state.currentQuestionIndex + 1,
  })),

  goToPart: (part) => set({
    currentPart: part,
    currentQuestionIndex: 0,
    phase: part === 2 ? 'part2-preparing' : `part${part}-answering` as SessionPhase,
  }),

  startRecording: () => set({ isRecording: true, currentTranscript: '' }),
  stopRecording: () => set({ isRecording: false }),

  addSegment: (segment) => set((state) => ({
    segments: [...state.segments, segment],
  })),

  setCurrentTranscript: (text) => set({ currentTranscript: text }),
  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),
  setTimerRunning: (running) => set({ isTimerRunning: running }),

  completeSession: () => set({ phase: 'completed', isRecording: false, isTimerRunning: false }),

  resetSession: () => set({
    phase: 'idle',
    currentPart: 1,
    currentQuestionIndex: 0,
    part1Topic: null,
    part2Topic: null,
    part3Topic: null,
    isRecording: false,
    segments: [],
    currentTranscript: '',
    timeRemaining: 0,
    isTimerRunning: false,
  }),
}));
```

### 6.3 settingsStore

```typescript
// src/stores/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  ttsAccent: 'en-GB',
  ttsEnabled: true,
  timerSoundEnabled: true,
  theme: 'system',
  topicsInitialized: false,
};

interface SettingsState extends AppSettings {
  updateSettings: (partial: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (partial) => set(partial),
    }),
    { name: 'jsay-settings' },  // localStorage key
  ),
);
```

---

## 7. 核心 Hooks 设计

### 7.1 useAudioRecorder

```typescript
// src/hooks/useAudioRecorder.ts

interface UseAudioRecorderOptions {
  /** 录音结束回调 */
  onStop?: (blob: Blob, duration: number) => void;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  audioLevel: number;            // 0–1 实时音量
  duration: number;              // 已录制时长（秒）
  start: () => Promise<void>;    // 开始录音（请求权限 + 录制）
  stop: () => void;              // 停止录音，触发 onStop
  pause: () => void;             // 暂停
  resume: () => void;            // 继续
  error: MediaError | null;
}

type MediaError =
  | { type: 'permission_denied' }
  | { type: 'not_supported' }
  | { type: 'device_not_found' };
```

**内部实现要点：**

1. `start()` 调用 `navigator.mediaDevices.getUserMedia({ audio: true })`
2. 成功获取 stream 后创建 `MediaRecorder`，`mimeType` 优先 `'audio/webm;codecs=opus'`，降级 `'audio/webm'`
3. 同时创建 `AudioContext` + `AnalyserNode` 连接 stream，通过 `getByteFrequencyData` 计算音量
4. 使用 `requestAnimationFrame` 循环读取音量，更新 `audioLevel` 状态
5. `stop()` 时调用 `mediaRecorder.stop()`，在 `ondataavailable` 中收集 Blob
6. 组件卸载时释放 stream 和 AudioContext

### 7.2 useSpeechRecognition

```typescript
// src/hooks/useSpeechRecognition.ts

interface UseSpeechRecognitionOptions {
  lang?: string;                 // 默认 'en-US'
  continuous?: boolean;          // 默认 true
  interimResults?: boolean;      // 默认 true
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;            // 最终识别文本
  interimTranscript: string;     // 中间识别文本
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: SpeechRecognitionError | null;
}

type SpeechRecognitionError =
  | { type: 'not_supported' }
  | { type: 'no_speech' }
  | { type: 'audio_capture' }
  | { type: 'not_allowed' }
  | { type: 'network' }
  | { type: 'aborted' };
```

**内部实现要点：**

1. 检测 `window.SpeechRecognition || window.webkitSpeechRecognition`，不支持则 `isSupported = false`
2. 创建实例，设置 `lang`、`continuous`、`interimResults`
3. `onresult` 回调中区分 `isFinal` 和 interim 结果，分别更新 `transcript` 和 `interimTranscript`
4. `onerror` 回调映射为类型化的 error
5. `onend` 回调：如果 `isListening` 仍为 true 且非手动停止，自动 restart（浏览器的 SpeechRecognition 会在静默一段时间后自动停止）
6. 组件卸载时调用 `recognition.stop()`

### 7.3 useAudioPlayer

```typescript
// src/hooks/useAudioPlayer.ts

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  currentTime: number;           // 当前播放位置（秒）
  duration: number;              // 总时长（秒）
  play: (blob: Blob) => void;    // 加载并播放
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;  // 跳转到指定位置
  stop: () => void;
}
```

**内部实现要点：**

1. 使用 `URL.createObjectURL(blob)` 创建播放 URL
2. 创建 `Audio` 元素，监听 `timeupdate`、`loadedmetadata`、`ended` 事件
3. 组件卸载时调用 `URL.revokeObjectURL()` 释放内存

### 7.4 useTimer

```typescript
// src/hooks/useTimer.ts

interface UseTimerOptions {
  /** 倒计时结束回调 */
  onComplete?: () => void;
  /** 警告阈值（秒），默认 15 */
  warningThreshold?: number;
  /** 每秒 tick 回调 */
  onTick?: (remaining: number) => void;
}

interface UseTimerReturn {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  isWarning: boolean;            // 剩余时间 <= warningThreshold
  progress: number;              // 0–1 进度
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}
```

**内部实现要点：**

1. 使用 `setInterval` 每 1000ms 递减 `timeLeft`
2. `timeLeft` 降到 0 时清除 interval，触发 `onComplete`
3. `isWarning = timeLeft <= warningThreshold`
4. `progress = 1 - timeLeft / totalTime`
5. 组件卸载时清除 interval

### 7.5 usePractice（练习流程编排）

```typescript
// src/hooks/usePractice.ts

interface UsePracticeReturn {
  // 状态（来自 practiceStore）
  session: PracticeSession;

  // 流程控制
  startFullExam: (part1: Part1TopicGroup, part2: Part2CueCard, part3: Part3Discussion) => void;
  startPartPractice: (part: PartNumber, topic: Topic) => void;
  startAnswering: () => void;      // 开始录音 + 识别
  stopAnswering: () => void;       // 停止录音 + 保存片段
  nextQuestion: () => void;        // 进入下一题
  nextPart: () => void;            // 进入下一 Part
  finishPart2Preparation: () => void;  // Part2 准备结束，进入独白
  completeSession: () => Promise<number>;  // 结束会话，返回 recordId
  abandonSession: () => void;      // 放弃本次练习

  // 当前问题信息
  currentQuestion: string | null;
  totalQuestions: number;
}
```

**流程编排逻辑：**

```
startFullExam()
  → store.startSession('full', {part1, part2, part3})
  → phase = 'part1-answering'

用户点击"开始回答" → startAnswering()
  → audioRecorder.start()
  → speechRecognition.startListening()

用户点击"停止回答" → stopAnswering()
  → audioRecorder.stop() → 获得 blob + duration
  → speechRecognition.stopListening() → 获得 transcript
  → practiceRepo.saveSegment(...) → 获得 segmentId
  → store.addSegment(segment)

当前 Part 最后一题 → nextPart()
  Part1 → Part2:  store.goToPart(2), phase = 'part2-preparing', timer.start(60)
  Part2 → Part3:  store.goToPart(3), phase = 'part3-answering'

Part2 准备倒计时结束 → finishPart2Preparation()
  → phase = 'part2-speaking', timer.start(120)

所有 Part 完成 → completeSession()
  → store.completeSession()
  → practiceRepo.createRecord(...)  // 写入 IndexedDB
  → return recordId
  → navigate to /practice/review/:id
```

### 7.6 useTopics（话题查询）

```typescript
// src/hooks/useTopics.ts

interface UseTopicsReturn {
  topics: Topic[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

function useTopics(filters?: {
  part?: PartNumber;
  category?: TopicCategory;
  favoritesOnly?: boolean;
}): UseTopicsReturn;
```

使用 `useState` + `useEffect` 从 IndexedDB 查询，操作后调用 `refresh()` 局部刷新。不引入 React Query 以保持零依赖。

### 7.7 usePracticeHistory（历史记录查询）

```typescript
// src/hooks/usePracticeHistory.ts

interface UsePracticeHistoryReturn {
  records: PracticeRecord[];
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  loadMore: () => void;
  refresh: () => void;
}

function usePracticeHistory(pageSize?: number): UsePracticeHistoryReturn;
```

### 7.8 useStats（统计数据）

```typescript
// src/hooks/useStats.ts

interface UseStatsReturn {
  dailyActivity: Array<{ date: string; count: number; totalDuration: number }>;
  scoreTrend: Array<{ date: string; avgScore: number }>;
  totalPractices: number;
  totalDuration: number;
  loading: boolean;
  refresh: () => void;
}

function useStats(days?: number): UseStatsReturn;  // days 默认 30
```

---

## 8. 组件设计

### 8.1 组件树

```
App
├── AppLayout
│   ├── Header
│   │   ├── Logo
│   │   ├── NavLinks
│   │   └── ThemeToggle / SettingsLink
│   ├── Sidebar
│   │   └── NavItem × 5 (练习/话题/历史/词汇/统计)
│   └── MainContent (Outlet)
│
├── Pages
│   ├── HomePage
│   │   ├── QuickStartCard
│   │   ├── RecentPracticeList
│   │   └── StatsOverview
│   │
│   ├── PracticeSetupPage
│   │   ├── ModeSelector (完整模拟 / 单部分练习)
│   │   ├── TopicSelector
│   │   │   ├── CategoryFilter
│   │   │   ├── TopicCardList
│   │   │   └── TopicCard
│   │   └── StartButton
│   │
│   ├── PracticeSessionPage
│   │   ├── SessionHeader (进度/退出)
│   │   ├── Part1View
│   │   │   ├── QuestionDisplay
│   │   │   ├── AudioRecorderPanel
│   │   │   │   ├── RecordButton
│   │   │   │   ├── AudioWaveform
│   │   │   │   └── TranscriptDisplay
│   │   │   └── NextButton
│   │   ├── Part2View
│   │   │   ├── CueCard
│   │   │   ├── TimerBar
│   │   │   └── AudioRecorderPanel
│   │   ├── Part3View
│   │   │   ├── QuestionDisplay
│   │   │   └── AudioRecorderPanel
│   │   └── SessionControlBar (暂停/跳过/退出)
│   │
│   ├── PracticeReviewPage
│   │   ├── ScoreForm (四维度滑块)
│   │   ├── NotesTextarea
│   │   ├── SegmentList
│   │   │   └── SegmentPlayer
│   │   │       ├── AudioPlayer
│   │   │       └── TranscriptText
│   │   └── SaveButton
│   │
│   ├── HistoryListPage
│   │   ├── HistoryFilter
│   │   └── HistoryCardList
│   │       └── HistoryCard
│   │
│   ├── HistoryDetailPage
│   │   ├── RecordInfo
│   │   ├── ScoreRadar
│   │   ├── SegmentList (复用)
│   │   └── NotesDisplay
│   │
│   ├── TopicListPage
│   │   ├── TopicFilter (Part/Category/Favorite)
│   │   ├── TopicGrid
│   │   │   └── TopicCard
│   │   └── AddTopicButton
│   │
│   ├── TopicDetailPage
│   │   ├── TopicInfo
│   │   ├── QuestionList
│   │   ├── RelatedVocabulary
│   │   └── StartPracticeButton
│   │
│   ├── VocabListPage
│   │   ├── VocabSearch
│   │   ├── VocabFilter
│   │   ├── VocabCardList
│   │   │   └── VocabCard
│   │   └── AddVocabButton
│   │
│   ├── StatsPage
│   │   ├── ActivityHeatmap
│   │   ├── ScoreTrendChart
│   │   ├── TopicCoverageRadar
│   │   └── DurationStats
│   │
│   └── SettingsPage
│       ├── TtsSettings
│       ├── TimerSettings
│       ├── ThemeSettings
│       ├── DataManagement (导入/导出/清空)
│       └── AboutSection
```

### 8.2 关键组件 Props 设计

```typescript
// --- UI 基础组件 ---

interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

interface TimerProps {
  timeLeft: number;
  totalTime: number;
  isWarning: boolean;
  isRunning: boolean;
  label?: string;              // 如 "Preparation" / "Speaking"
}

interface ProgressBarProps {
  value: number;               // 0–1
  color?: string;
  showLabel?: boolean;
}

// --- 共享业务组件 ---

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob, duration: number) => void;
  onTranscriptUpdate?: (text: string) => void;
  autoStart?: boolean;
  maxDuration?: number;        // 最大录音时长（秒）
}

interface SpeechRecognizerProps {
  isListening: boolean;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: SpeechRecognitionError) => void;
  lang?: string;
}

interface TopicCardProps {
  topic: Topic;
  onSelect: (topic: Topic) => void;
  showFavorite?: boolean;
  compact?: boolean;
}

interface ScoreRadarProps {
  scores: IeltsScores;
  size?: number;
}

interface SegmentPlayerProps {
  segment: RecordingSegment;
  audioBlob: Blob;
}

// --- 页面级组件 ---

interface PracticeSetupProps {
  mode: PracticeMode;
  onStart: (topics: { part1?: Topic; part2?: Topic; part3?: Topic }) => void;
}

interface Part1ViewProps {
  topic: Topic;
  currentQuestionIndex: number;
  onAnswerComplete: (blob: Blob, duration: number, transcript: string) => void;
  onNext: () => void;
  isLastQuestion: boolean;
}

interface Part2ViewProps {
  topic: Topic;
  phase: 'preparing' | 'speaking';
  onPreparationEnd: () => void;
  onSpeakingComplete: (blob: Blob, duration: number, transcript: string) => void;
}

interface Part3ViewProps {
  topic: Topic;
  currentQuestionIndex: number;
  onAnswerComplete: (blob: Blob, duration: number, transcript: string) => void;
  onNext: () => void;
  isLastQuestion: boolean;
}
```

### 8.3 组件状态管理策略

| 组件类型 | 状态位置 | 说明 |
|----------|----------|------|
| UI 基础组件 | 组件内 `useState` | 开关、loading 等局部状态 |
| 表单组件 | 组件内 `useState` | 输入值、校验状态 |
| 页面级数据 | 自定义 Hook (`useTopics`, `usePracticeHistory`) | 从 IndexedDB 查询 |
| 练习会话 | `practiceStore` (Zustand) | 跨组件共享的流程状态 |
| 应用设置 | `settingsStore` (Zustand + persist) | 持久化到 localStorage |
| 音频/语音 | 自定义 Hook 内部 `useState` | 录音状态、识别文本等 |

---

## 9. 路由设计

### 9.1 路由配置

```typescript
// src/router.tsx
import { createBrowserRouter } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { PracticeLayout } from '@/pages/Practice/PracticeLayout';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,       // 带 Sidebar 的主布局
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/topics', element: <TopicListPage /> },
      { path: '/topics/:id', element: <TopicDetailPage /> },
      { path: '/history', element: <HistoryListPage /> },
      { path: '/history/:id', element: <HistoryDetailPage /> },
      { path: '/vocabulary', element: <VocabListPage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  {
    element: <PracticeLayout />,  // 练习模式全屏布局（无 Sidebar）
    children: [
      { path: '/practice/setup', element: <PracticeSetupPage /> },
      { path: '/practice/session', element: <PracticeSessionPage /> },
      { path: '/practice/review/:id', element: <PracticeReviewPage /> },
    ],
  },
]);
```

### 9.2 布局切换

- **AppLayout**：Header + Sidebar + Main，常规浏览页面使用
- **PracticeLayout**：全屏沉浸，仅顶部进度条 + 内容区，练习进行时使用
- 从 AppLayout 页面点击"开始练习" → 跳转到 `/practice/setup`（PracticeLayout）
- 练习完成或退出 → 跳转回 `/` 或 `/history/:id`（AppLayout）

---

## 10. 页面详细设计

### 10.1 HomePage

**功能：** 快速开始练习入口 + 最近练习摘要 + 统计概览

**布局：**
```
┌─────────────────────────────────────────────────────┐
│  Welcome back! Ready to practice?                    │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │  🎯 Full Exam │  │ 📝 Part Only │  │ 🎲 Random  ││
│  │  Start       │  │ Practice     │  │ Topic      ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│                                                      │
│  Recent Practices                Quick Stats         │
│  ┌────────────────────────┐    ┌──────────────────┐ │
│  │ 2026-05-10 Full 7.0   │    │ This Week        │ │
│  │ 2026-05-08 Part2 6.5  │    │ Practices: 5     │ │
│  │ 2026-05-07 Part1 --   │    │ Avg Score: 6.5   │ │
│  └────────────────────────┘    │ Time: 45min      │ │
│                                └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**数据来源：**
- 最近练习：`practiceRepo.listRecords(1, 5)`
- 统计概览：`practiceRepo.statsByDate(7)`

### 10.2 PracticeSetupPage

**功能：** 选择练习模式和话题

**交互流程：**
1. 选择模式：完整模拟 / Part 1 / Part 2 / Part 3
2. 根据模式显示话题选择器
   - 完整模拟：自动随机抽取，或手动选择 Part 2 话题后自动关联 Part 1 和 Part 3
   - 单部分练习：显示话题列表，可按分类筛选
3. 点击"Start Practice"进入 `/practice/session`

**关键逻辑：**
- Part 2 话题选择后，自动查找同分类的 Part 1 和 Part 3 话题
- 话题选择器支持"Random"快捷按钮

### 10.3 PracticeSessionPage

**功能：** 练习进行中的核心页面，根据 `currentPart` 和 `phase` 切换视图

**状态机：**

```
                    ┌─────────────┐
                    │    idle     │
                    └──────┬──────┘
                           │ startSession()
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
   ┌───────────────┐ ┌──────────────┐ ┌───────────────┐
   │part1-answering│ │part2-preparing│ │part3-answering│
   └───────┬───────┘ └──────┬───────┘ └───────┬───────┘
           │                │ timer end        │
           │ last Q         ▼                  │ last Q
           ▼        ┌──────────────┐           ▼
   ┌───────────────┐│part2-speaking││  ┌───────────────┐
   │  nextPart(2)  │└──────┬───────┘│  │  nextPart(3)  │←── 仅 full 模式
   └───────┬───────┘       │        │  └───────┬───────┘
           │               │        │          │
           │ timer end     │        │          │
           ▼               ▼        │          ▼
     ┌──────────┐   ┌──────────┐    │    ┌──────────┐
     │  paused  │   │nextPart(3)│   │    │completed │
     └──────────┘   └──────────┘    │    └──────────┘
                                    │
              单部分模式直接 → completed
```

**每个问题/阶段的录音流程：**

```
startAnswering()
  → audioRecorder.start()
  → speechRecognition.startListening()
  → store.startRecording()

stopAnswering()
  → audioRecorder.stop() → blob
  → speechRecognition.stopListening() → finalTranscript
  → practiceRepo.saveSegment(recordId, part, qIndex, blob, transcript, duration)
  → store.stopRecording()
```

### 10.4 PracticeReviewPage

**功能：** 练习结束后的回顾与自评

**交互：**
1. 顶部显示练习概要（模式、时长、话题）
2. 中部逐段回放录音 + 转写文本
3. 底部四维度评分滑块（1–9，步长 0.5）+ 笔记文本框
4. 点击"Save"保存评分和笔记

**数据流：**
- 从 URL 参数 `:id` 获取 recordId
- `practiceRepo.getRecord(id)` 获取记录
- `practiceRepo.getSegments(id)` 获取录音片段
- `practiceRepo.getAudioBlob(blobId)` 获取 Blob 播放

### 10.5 HistoryListPage

**功能：** 练习历史列表

**交互：**
- 按时间倒序展示，每页 20 条
- 每条显示：日期、模式图标、话题摘要、总分（四维均分）、时长
- 点击进入 HistoryDetailPage
- 支持删除（二次确认）

### 10.6 HistoryDetailPage

**功能：** 历史记录详情，复用 PracticeReviewPage 的 SegmentList 和 ScoreRadar

### 10.7 TopicListPage

**功能：** 话题浏览与管理

**交互：**
- 顶部 Tab 切换 Part 1 / Part 2 / Part 3
- 左侧分类筛选器
- 卡片网格展示话题
- 每个卡片显示标题、分类标签、难度、收藏按钮
- 点击进入 TopicDetailPage
- P1+：右上角"Add Custom Topic"按钮

### 10.8 StatsPage

**功能：** 数据统计仪表盘

**图表：**
1. **练习热力图**：最近 90 天，每天一个色块，深浅表示练习次数
2. **评分趋势**：折线图，X 轴日期，Y 轴平均分
3. **话题覆盖**：雷达图，各分类的练习次数
4. **累计统计**：总练习次数、总时长、平均分、最高分

**依赖库：** Recharts

---

## 11. 内置题库数据设计

### 11.1 数据结构

```typescript
// src/data/topics/part1.ts
import type { Topic } from '@/types';

export const part1Topics: Topic[] = [
  {
    id: 0,  // 内置话题使用负数 ID 避免与自增 ID 冲突
    part: 1,
    category: 'daily',
    title: 'Hometown',
    content: 'Questions about your hometown',
    prompts: [],
    questions: [
      'Where is your hometown?',
      'What do you like most about your hometown?',
      'Would you say your hometown is a good place to live?',
    ],
    relatedPart2Id: null,
    difficulty: 'easy',
    isCustom: false,
    isFavorite: false,
    createdAt: 0,
    updatedAt: 0,
  },
  // ... 更多话题
];
```

> **ID 策略**：内置话题不预设 ID，由 Dexie 自增分配。初始化时按顺序写入，通过 `title + part` 唯一索引去重。

### 11.2 初始化流程

```typescript
// src/db/init.ts
import { db } from './index';
import { part1Topics } from '@/data/topics/part1';
import { part2Topics } from '@/data/topics/part2';
import { part3Topics } from '@/data/topics/part3';
import { builtInVocabulary } from '@/data/vocabulary';

export async function initDatabase(): Promise<void> {
  const settings = localStorage.getItem('jsay-settings');
  const parsed = settings ? JSON.parse(settings) : {};
  if (parsed.state?.topicsInitialized) return;

  const allTopics = [...part1Topics, ...part2Topics, ...part3Topics];
  await db.transaction('rw', [db.topics, db.vocabulary], async () => {
    const topicCount = await db.topics.count();
    if (topicCount === 0) {
      await db.topics.bulkAdd(allTopics);
    }
    const vocabCount = await db.vocabulary.count();
    if (vocabCount === 0) {
      await db.vocabulary.bulkAdd(builtInVocabulary);
    }
  });

  // 标记初始化完成
  parsed.state = { ...parsed.state, topicsInitialized: true };
  localStorage.setItem('jsay-settings', JSON.stringify(parsed));
}
```

### 11.3 题库规模规划

| Part | 话题数 | 每话题问题数 | 总问题数 |
|------|--------|-------------|---------|
| Part 1 | 50 组 | 3 个/组 | 150 |
| Part 2 | 30 卡片 | 1 主题 + 4 提示点 | 30 |
| Part 3 | 20 方向 | 5 个/方向 | 100 |
| 词汇 | 200 条 | — | 200 |

---

## 12. 错误处理设计

### 12.1 错误分类

| 错误类型 | 场景 | 处理策略 |
|----------|------|----------|
| **权限错误** | 麦克风权限被拒 | 显示友好引导弹窗，说明如何开启权限 |
| **兼容性错误** | 浏览器不支持 SpeechRecognition | 显示降级提示，语音识别按钮置灰 |
| **存储错误** | IndexedDB 配额超限 | 提示用户清理旧录音，提供清理入口 |
| **数据错误** | 数据库读写失败 | Toast 提示，操作重试按钮 |
| **录音错误** | MediaRecorder 创建失败 | 显示错误信息，建议检查设备 |
| **识别错误** | SpeechRecognition 网络错误 | 提示网络问题，自动降级为纯录音模式 |

### 12.2 错误边界

```typescript
// src/components/ErrorBoundary.tsx
// 捕获渲染错误，显示 fallback UI，避免白屏

interface ErrorBoundaryProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // 标准实现...
}
```

### 12.3 全局 Toast 通知

使用 React Context + Portal 实现轻量 Toast，不引入第三方库。

```typescript
// src/components/ui/Toast.tsx
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;  // 默认 3000ms
}

interface ToastContextValue {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}
```

---

## 13. 性能优化设计

### 13.1 代码分割

```typescript
// 路由级懒加载
const StatsPage = React.lazy(() => import('@/pages/Stats/Dashboard'));
const VocabListPage = React.lazy(() => import('@/pages/Vocabulary/VocabList'));
const SettingsPage = React.lazy(() => import('@/pages/Settings/Settings'));
```

### 13.2 录音数据优化

- **Blob 分表存储**：`audioBlobs` 表独立于 `recordingSegments`，查询列表时不加载 Blob
- **延迟加载**：只在用户点击播放时才读取 `audioBlob.data`
- **清理策略**：设置页面提供"清理 30 天前的录音"功能

### 13.3 题库初始化优化

- 首次加载时异步写入 IndexedDB，不阻塞 UI
- 使用 `db.transaction('rw', ...)` 批量写入，避免逐条写入的开销
- 通过 `settingsStore.topicsInitialized` 标记避免重复初始化

### 13.4 语音识别节流

- `interimTranscript` 更新频率高，使用 `useRef` + `requestAnimationFrame` 节流渲染
- `transcript`（最终结果）直接更新 state

### 13.5 列表虚拟化

- 历史记录列表、话题列表在数据量 > 100 时考虑虚拟滚动
- MVP 阶段暂不引入，预留接口

---

## 14. 数据导入导出设计

### 14.1 导出

```typescript
// src/utils/storage.ts

interface ExportData {
  version: 1;
  exportedAt: number;
  practiceRecords: PracticeRecord[];
  recordingSegments: RecordingSegment[];
  // 不导出 audioBlobs（太大），仅导出元数据
  topics: Topic[];
  vocabulary: Vocabulary[];
  settings: AppSettings;
}

async function exportData(): Promise<string> {
  const data: ExportData = {
    version: 1,
    exportedAt: Date.now(),
    practiceRecords: await db.practiceRecords.toArray(),
    recordingSegments: await db.recordingSegments.toArray(),
    topics: await db.topics.toArray(),
    vocabulary: await db.vocabulary.toArray(),
    settings: useSettingsStore.getState(),
  };
  return JSON.stringify(data, null, 2);
}
```

### 14.2 导入

```typescript
async function importData(jsonString: string): Promise<void> {
  const data: ExportData = JSON.parse(jsonString);
  if (data.version !== 1) throw new Error('Unsupported export version');

  await db.transaction('rw', [db.topics, db.practiceRecords, db.recordingSegments, db.vocabulary], async () => {
    await db.topics.clear();
    await db.topics.bulkAdd(data.topics);
    await db.practiceRecords.clear();
    await db.practiceRecords.bulkAdd(data.practiceRecords);
    await db.recordingSegments.clear();
    await db.recordingSegments.bulkAdd(data.recordingSegments);
    await db.vocabulary.clear();
    await db.vocabulary.bulkAdd(data.vocabulary);
  });

  // 恢复设置
  useSettingsStore.getState().updateSettings(data.settings);
}
```

> **注意**：导入为全量覆盖，需二次确认弹窗。音频 Blob 不导出（JSON 不支持 Blob 序列化）。

---

## 15. 快捷键设计

| 快捷键 | 上下文 | 动作 |
|--------|--------|------|
| `Space` | 练习页面 | 开始/停止录音 |
| `Enter` | 练习页面 | 下一题/下一阶段 |
| `Escape` | 练习页面 | 暂停/退出确认 |
| `R` | 回顾页面 | 重新播放当前录音 |

**实现：** 在 PracticeSessionPage 组件内注册 `keydown` 事件监听，组件卸载时移除。使用 `useCallback` + `useEffect` 封装为 `useHotkeys` Hook。

```typescript
// src/hooks/useHotkeys.ts
function useHotkeys(handlers: Record<string, () => void>, enabled: boolean = true): void;
// 用法：useHotkeys({ 'Space': toggleRecording, 'Enter': nextStep, 'Escape': pauseSession })
```

---

## 16. 暗色模式设计

### 16.1 实现方案

使用 TailwindCSS 4 的 `@variant dark` + CSS 变量实现。

```css
/* src/index.css */
@import 'tailwindcss';

@theme {
  --color-primary: #1a56db;
  --color-primary-light: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-bg-main: #f9fafb;
  --color-bg-card: #ffffff;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
}

@media (prefers-color-scheme: dark) {
  :root.dark {
    --color-primary: #60a5fa;
    --color-primary-light: #93bbfd;
    --color-bg-main: #111827;
    --color-bg-card: #1f2937;
    --color-text-primary: #f9fafb;
    --color-text-secondary: #9ca3af;
  }
}
```

### 16.2 主题切换

`settingsStore.theme` 支持 `'light' | 'dark' | 'system'`，切换时修改 `<html>` 的 class。

---

## 17. 测试策略

### 17.1 测试分层

| 层次 | 工具 | 覆盖范围 |
|------|------|----------|
| 单元测试 | Vitest | 工具函数、Repository、Store 逻辑 |
| 组件测试 | Vitest + Testing Library | UI 组件渲染、交互 |
| E2E 测试 | Playwright (P2) | 核心流程：开始练习→录音→回顾→保存 |

### 17.2 关键测试用例

1. **数据库操作**：CRUD、批量初始化、事务回滚
2. **练习流程状态机**：Phase 切换、录音开始/停止、计时器
3. **录音 Hook**：权限拒绝、设备不可用、录音开始/停止生命周期
4. **语音识别 Hook**：不支持降级、识别结果累积、错误处理
5. **计时器 Hook**：倒计时、暂停/恢复、警告阈值、完成回调
6. **数据导入导出**：版本校验、全量覆盖、异常数据

---

## 18. 部署方案

### 18.1 构建产物

```bash
npm run build
# 输出 dist/ 目录，纯静态文件
```

### 18.2 部署方式

纯静态 SPA，可部署到任意静态托管：

- **GitHub Pages**：`vite.config.ts` 设置 `base` 路径
- **Vercel / Netlify**：零配置部署，自动处理 SPA fallback
- **本地使用**：`npm run preview` 或直接打开 `dist/index.html`

### 18.3 PWA 支持（P2）

未来可通过 `vite-plugin-pwa` 添加 Service Worker，实现离线访问和安装到桌面。

---

## 19. 开发里程碑

### Phase 1 — MVP（第 1–2 周）

| 序号 | 任务 | 优先级 | 预估工时 |
|------|------|--------|----------|
| 1 | 项目基建：路由、布局、DB 初始化、类型定义 | P0 | 1d |
| 2 | 内置题库数据（Part1 50组 + Part2 30卡 + Part3 20方向） | P0 | 1d |
| 3 | useAudioRecorder Hook | P0 | 0.5d |
| 4 | useSpeechRecognition Hook | P0 | 0.5d |
| 5 | useTimer Hook + Timer 组件 | P0 | 0.5d |
| 6 | PracticeSetupPage（模式选择 + 话题选择） | P0 | 0.5d |
| 7 | PracticeSessionPage（Part1/2/3 视图 + 流程控制） | P0 | 2d |
| 8 | PracticeReviewPage（评分 + 笔记 + 录音回放） | P0 | 1d |
| 9 | HistoryListPage + HistoryDetailPage | P0 | 0.5d |
| 10 | HomePage（快速入口 + 最近练习） | P0 | 0.5d |

### Phase 2 — 增强（第 3 周）

| 序号 | 任务 | 优先级 | 预估工时 |
|------|------|--------|----------|
| 11 | 单部分练习模式 | P1 | 0.5d |
| 12 | 自定义话题 CRUD | P1 | 0.5d |
| 13 | 话题收藏 | P1 | 0.5d |
| 14 | TTS 考官语音播报（useSpeechSynthesis） | P1 | 0.5d |
| 15 | 词汇本页面 | P1 | 1d |
| 16 | TopicListPage + TopicDetailPage 完善 | P1 | 0.5d |

### Phase 3 — 优化（第 4 周）

| 序号 | 任务 | 优先级 | 预估工时 |
|------|------|--------|----------|
| 17 | StatsPage（Recharts 图表） | P2 | 1d |
| 18 | 数据导入导出 | P2 | 0.5d |
| 19 | 暗色模式 | P2 | 0.5d |
| 20 | 快捷键支持 | P2 | 0.5d |
| 21 | 录音波形可视化 | P2 | 1d |
| 22 | 设置页面 | P2 | 0.5d |

---

## 20. 依赖清单

### 20.1 运行时依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `react` | ^19 | UI 框架 |
| `react-dom` | ^19 | DOM 渲染 |
| `react-router` | ^7 | SPA 路由 |
| `zustand` | ^5 | 状态管理 |
| `dexie` | ^4 | IndexedDB 封装 |
| `recharts` | ^2 | 图表（P2） |
| `date-fns` | ^4 | 日期格式化 |

### 20.2 开发依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `typescript` | ^6 | 类型检查 |
| `vite` | ^8 | 构建工具 |
| `@vitejs/plugin-react` | ^6 | React Fast Refresh |
| `tailwindcss` | ^4 | CSS 框架 |
| `@tailwindcss/vite` | ^4 | Tailwind Vite 插件 |
| `vitest` | ^3 | 单元测试 |
| `@testing-library/react` | ^16 | 组件测试 |