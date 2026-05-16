# J-Say — IELTS 口语练习 Web 应用 需求设计文档

## 1. 项目概述

### 1.1 项目名称

J-Say

### 1.2 项目定位

面向 IELTS 考生的 Web PC 端口语练习工具，纯前端应用，无需服务端，所有数据存储在浏览器 IndexedDB 中。

### 1.3 目标用户

- 备考 IELTS 的考生（目标分数 5.0–8.0）
- 需要提升英语口语流利度的英语学习者
- 希望通过模拟考试环境熟悉考试流程的用户

### 1.4 核心价值

- 随时随地练习，无需注册登录
- 完整还原 IELTS 口语考试三部分流程
- 录音回放 + 语音识别辅助自我评估
- 练习数据本地持久化，可追溯进步轨迹

---

## 2. IELTS 口语考试结构调研

### 2.1 考试总览

IELTS Speaking 考试时长 11–14 分钟，分为 3 个部分：

| 部分 | 名称 | 时长 | 考察重点 |
|------|------|------|----------|
| Part 1 | Introduction & Interview | 4–5 min | 日常话题问答，个人背景、爱好、习惯等 |
| Part 2 | Long Turn (Cue Card) | 3–4 min | 根据话题卡独白 1–2 分钟，含 1 分钟准备时间 |
| Part 3 | Discussion | 4–5 min | 基于 Part 2 话题的抽象讨论，表达观点与论证 |

### 2.2 评分标准（四维度等权）

| 维度 | 权重 | 说明 |
|------|------|------|
| Fluency & Coherence | 25% | 流利度与连贯性，语速、停顿、逻辑连接 |
| Lexical Resource | 25% | 词汇多样性，用词范围、准确性、搭配 |
| Grammatical Range & Accuracy | 25% | 语法范围与准确性，句式多样性、错误频率 |
| Pronunciation | 25% | 发音，音素准确度、重音、语调、节奏 |

### 2.3 话题分类

**Part 1 常见话题（约 30+ 类）：**
- 个人信息（Name, Hometown, Study/Work）
- 日常活动（Hobbies, Sports, Music, Reading）
- 生活环境（Accommodation, Weather, Transportation）
- 社会话题（Social Media, Shopping, Cooking）

**Part 2 话题卡类型（约 50+ 类）：**
- 描述人物（Describe a person who...）
- 描述经历（Describe an experience when...）
- 描述地点（Describe a place you...）
- 描述物品（Describe an object that...）
- 描述事件（Describe an event that...）

**Part 3 讨论方向：**
- 基于 Part 2 话题延伸至社会层面
- 比较过去与现在
- 预测未来趋势
- 表达并论证个人观点

---

## 3. 功能需求

### 3.1 功能架构

```
J-Say
├── 练习模式
│   ├── 完整模拟（Part 1 → Part 2 → Part 3）
│   ├── 单部分练习（选择任意 Part 单独练习）
│   └── 随机话题练习（随机抽取话题快速开始）
├── 话题管理
│   ├── 内置题库（按分类/季节/难度浏览）
│   ├── 自定义话题（用户添加话题卡）
│   ├── 话题收藏
│   └── 话题筛选（按分类/标签/难度/收藏）
├── 练习过程
│   ├── 录音功能（MediaRecorder API）
│   ├── 语音识别转写（Web Speech API）
│   ├── 倒计时器（Part 2 准备 1min + 独白 2min）
│   ├── 模拟考官提问（TTS 语音播报题目）
│   └── 练习暂停/继续
├── 练习回顾
│   ├── 录音回放
│   ├── 文字转写展示
│   ├── 自我评分（四维度打分）
│   ├── 练习笔记
│   └── 历史记录列表
├── 词汇本
│   ├── 话题相关词汇（按话题分组）
│   ├── 用户自定义词汇
│   ├── 词汇收藏/标记
│   └── 词汇搜索
└── 数据统计
    ├── 练习频次（日/周/月）
    ├── 练习时长统计
    ├── 评分趋势图
    └── 话题覆盖度
```

### 3.2 P0 — MVP 核心功能

#### 3.2.1 完整模拟考试

- 按真实考试流程依次完成 Part 1 → Part 2 → Part 3
- Part 1：展示 3 组话题，每组 2–3 个问题，用户口头回答
- Part 2：展示话题卡 + 提示点，1 分钟准备倒计时，2 分钟独白倒计时
- Part 3：展示 4–6 个深度讨论问题，用户口头回答
- 全程录音

#### 3.2.2 录音与回放

- 使用 MediaRecorder API 录制用户语音
- 每次回答独立录音片段
- 练习结束后可逐段回放
- 支持下载录音文件（WebM/WAV）

#### 3.2.3 语音识别转写

- 使用 Web Speech API（SpeechRecognition）实时识别用户语音
- 将识别文本展示在界面上，方便用户对照
- 识别结果与录音片段关联存储
- 浏览器不支持时降级为纯录音模式（提示用户使用 Chrome）

#### 3.2.4 内置题库

- 预置至少 50 个 Part 1 话题组、30 个 Part 2 话题卡、20 个 Part 3 讨论方向
- 话题按分类标签组织（人物/经历/地点/物品/事件/社会）
- 支持按分类筛选和随机抽取

#### 3.2.5 倒计时器

- Part 2 准备阶段：1 分钟倒计时（可视化进度条 + 数字显示）
- Part 2 独白阶段：2 分钟倒计时
- 倒计时结束前 15 秒提醒（颜色变化 + 可选提示音）
- 练习中可手动结束当前阶段进入下一阶段

#### 3.2.6 自我评分

- 练习结束后，用户对四个维度分别打分（1–9 分，对标 IELTS 评分）
- 可选填写练习笔记（反思、改进点等）
- 评分与笔记随练习记录一起存储

#### 3.2.7 练习历史

- 按时间倒序展示所有练习记录
- 每条记录显示：日期、练习模式、话题摘要、自评分
- 点击进入详情页：回放录音、查看转写文本、查看评分和笔记

### 3.3 P1 — 增强功能

#### 3.3.1 单部分练习

- 可选择仅练习 Part 1 / Part 2 / Part 3
- 适合针对性训练

#### 3.3.2 自定义话题

- 用户可创建自定义话题卡（标题 + 提示点 + 关联 Part 3 问题）
- 自定义话题与内置话题统一展示

#### 3.3.3 话题收藏

- 收藏常练或重点话题
- 收藏列表独立展示

#### 3.3.4 模拟考官语音（TTS）

- 使用 Web Speech API 的 SpeechSynthesis 播报考官提问
- 可选择英语口音（英式/美式）
- 可关闭语音播报

#### 3.3.5 词汇本

- 每个话题关联高频词汇和短语
- 用户可添加自定义词汇
- 支持搜索和标记

### 3.4 P2 — 优化功能

#### 3.4.1 数据统计仪表盘

- 练习频次日历热力图
- 评分趋势折线图
- 话题覆盖雷达图
- 练习时长统计

#### 3.4.2 数据导入导出

- 导出练习记录为 JSON
- 导入 JSON 恢复数据
- 支持清空所有数据

#### 3.4.3 暗色模式

- 跟随系统或手动切换

#### 3.4.4 快捷键

- 空格键：开始/暂停录音
- Enter：下一题
- Esc：退出练习

---

## 4. 技术设计

### 4.1 技术栈

| 类别 | 选型 | 说明 |
|------|------|------|
| 框架 | React 19 + TypeScript | 类型安全，组件化开发 |
| 构建 | Vite | 快速 HMR，生产优化 |
| 样式 | TailwindCSS 4 | 原子化 CSS，快速开发 |
| 路由 | React Router v7 | SPA 路由管理 |
| 状态管理 | Zustand | 轻量级，无 boilerplate |
| 数据库 | Dexie.js (IndexedDB) | 类型安全的 IndexedDB 封装 |
| 录音 | MediaRecorder API | 浏览器原生，无需第三方库 |
| 语音识别 | Web Speech API | 浏览器原生 SpeechRecognition |
| 语音合成 | Web Speech API | 浏览器原生 SpeechSynthesis |
| 图表 | Recharts | React 友好的图表库 |
| 日期 | date-fns | 轻量日期处理 |

### 4.2 项目目录结构

```
j-say/
├── docs/                          # 项目文档
├── public/                        # 静态资源
│   └── sounds/                    # 提示音效
├── src/
│   ├── assets/                    # 静态资源（图片等）
│   ├── components/                # 通用组件
│   │   ├── ui/                    # 基础 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Timer.tsx
│   │   │   └── ProgressBar.tsx
│   │   ├── layout/                # 布局组件
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── shared/                # 共享业务组件
│   │       ├── AudioRecorder.tsx
│   │       ├── SpeechRecognizer.tsx
│   │       ├── ScoreRadar.tsx
│   │       └── TopicCard.tsx
│   ├── pages/                     # 页面组件
│   │   ├── Home/                  # 首页/仪表盘
│   │   ├── Practice/              # 练习相关页面
│   │   │   ├── PracticeSetup.tsx  # 练习配置（选模式/话题）
│   │   │   ├── PracticeSession.tsx # 练习进行中
│   │   │   └── PracticeReview.tsx  # 练习回顾/评分
│   │   ├── Topics/                # 话题管理
│   │   │   ├── TopicList.tsx
│   │   │   └── TopicDetail.tsx
│   │   ├── History/               # 练习历史
│   │   │   ├── HistoryList.tsx
│   │   │   └── HistoryDetail.tsx
│   │   ├── Vocabulary/            # 词汇本
│   │   │   └── VocabList.tsx
│   │   └── Stats/                 # 数据统计
│   │       └── Dashboard.tsx
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useAudioRecorder.ts    # 录音 Hook
│   │   ├── useSpeechRecognition.ts # 语音识别 Hook
│   │   ├── useSpeechSynthesis.ts  # 语音合成 Hook
│   │   ├── useTimer.ts            # 倒计时 Hook
│   │   └── usePractice.ts         # 练习流程 Hook
│   ├── stores/                    # Zustand 状态管理
│   │   ├── practiceStore.ts       # 练习状态
│   │   ├── topicStore.ts          # 话题状态
│   │   └── settingsStore.ts       # 设置状态
│   ├── db/                        # IndexedDB 数据层
│   │   ├── index.ts               # Dexie 数据库实例
│   │   ├── schemas.ts             # 表结构定义
│   │   └── migrations.ts          # 数据库迁移
│   ├── types/                     # TypeScript 类型定义
│   │   ├── topic.ts               # 话题相关类型
│   │   ├── practice.ts            # 练习相关类型
│   │   └── vocabulary.ts          # 词汇相关类型
│   ├── utils/                     # 工具函数
│   │   ├── audio.ts               # 音频处理工具
│   │   ├── storage.ts             # IndexedDB 导入导出
│   │   └── format.ts              # 格式化工具
│   ├── data/                      # 内置数据
│   │   ├── topics/                # 内置题库
│   │   │   ├── part1.ts
│   │   │   ├── part2.ts
│   │   │   └── part3.ts
│   │   └── vocabulary.ts          # 内置词汇
│   ├── App.tsx                    # 应用根组件
│   ├── main.tsx                   # 入口文件
│   └── index.css                  # 全局样式
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 4.3 数据库设计（IndexedDB via Dexie.js）

#### 4.3.1 表结构

```typescript
// 话题表
interface Topic {
  id?: number;                    // 自增主键
  part: 1 | 2 | 3;               // 所属 Part
  category: string;               // 分类标签
  title: string;                  // 话题标题
  content: string;                // 话题内容/描述
  prompts?: string[];             // Part 2 提示点
  questions: string[];            // 问题列表
  followUpTopicId?: number;       // Part 3 关联的 Part 2 话题 ID
  difficulty: 'easy' | 'medium' | 'hard'; // 难度
  isCustom: boolean;              // 是否用户自定义
  isFavorite: boolean;            // 是否收藏
  createdAt: Date;
  updatedAt: Date;
}

// 练习记录表
interface PracticeRecord {
  id?: number;                    // 自增主键
  mode: 'full' | 'part1' | 'part2' | 'part3'; // 练习模式
  topicIds: number[];             // 涉及的话题 ID
  startedAt: Date;                // 开始时间
  completedAt: Date;              // 完成时间
  duration: number;               // 总时长（秒）
  scores?: {                      // 自评分数
    fluency: number;              // 流利度 1–9
    lexical: number;              // 词汇 1–9
    grammar: number;              // 语法 1–9
    pronunciation: number;        // 发音 1–9
  };
  notes?: string;                 // 练习笔记
  createdAt: Date;
}

// 录音片段表
interface RecordingSegment {
  id?: number;                    // 自增主键
  practiceRecordId: number;       // 关联练习记录
  part: 1 | 2 | 3;               // 所属 Part
  questionIndex: number;          // 问题序号
  audioBlob: Blob;                // 音频数据（WebM）
  transcript?: string;            // 语音识别转写文本
  duration: number;               // 录音时长（秒）
  createdAt: Date;
}

// 词汇表
interface Vocabulary {
  id?: number;                    // 自增主键
  word: string;                   // 单词/短语
  definition: string;             // 释义
  example?: string;               // 例句
  category?: string;              // 分类
  topicIds?: number[];            // 关联话题
  isCustom: boolean;              // 是否用户自定义
  isFavorite: boolean;            // 是否收藏
  createdAt: Date;
}
```

#### 4.3.2 Dexie 数据库定义

```typescript
import Dexie, { type Table } from 'dexie';

class JSayDB extends Dexie {
  topics!: Table<Topic>;
  practiceRecords!: Table<PracticeRecord>;
  recordingSegments!: Table<RecordingSegment>;
  vocabulary!: Table<Vocabulary>;

  constructor() {
    super('JSayDB');
    this.version(1).stores({
      topics: '++id, part, category, difficulty, isFavorite, isCustom',
      practiceRecords: '++id, mode, startedAt, completedAt',
      recordingSegments: '++id, practiceRecordId, part',
      vocabulary: '++id, word, category, isFavorite, isCustom',
    });
  }
}

export const db = new JSayDB();
```

### 4.4 核心 Hooks 设计

#### 4.4.1 useAudioRecorder

```typescript
interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Blob | null;
  audioLevel: number;             // 实时音量（0–1），用于音频可视化
  error: string | null;
}
```

- 使用 `navigator.mediaDevices.getUserMedia` 获取麦克风
- 使用 `MediaRecorder` 录制音频
- 使用 `AudioContext` + `AnalyserNode` 获取实时音量
- 录制结果为 WebM 格式 Blob

#### 4.4.2 useSpeechRecognition

```typescript
interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}
```

- 封装 `webkitSpeechRecognition` / `SpeechRecognition`
- 设置 `continuous: true`, `interimResults: true`
- 语言设置为 `en-US`
- 降级处理：不支持时 `isSupported = false`

#### 4.4.3 useTimer

```typescript
interface UseTimerReturn {
  timeLeft: number;               // 剩余秒数
  isRunning: boolean;
  isWarning: boolean;             // 最后 15 秒
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  onComplete?: () => void;        // 倒计时结束回调
}
```

### 4.5 页面路由设计

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | Home | 首页仪表盘，快速开始 + 最近练习 |
| `/practice/setup` | PracticeSetup | 选择练习模式和话题 |
| `/practice/session` | PracticeSession | 练习进行中页面 |
| `/practice/review/:id` | PracticeReview | 练习回顾与评分 |
| `/topics` | TopicList | 话题列表 |
| `/topics/:id` | TopicDetail | 话题详情 |
| `/history` | HistoryList | 练习历史列表 |
| `/history/:id` | HistoryDetail | 历史记录详情 |
| `/vocabulary` | VocabList | 词汇本 |
| `/stats` | Dashboard | 数据统计仪表盘 |
| `/settings` | Settings | 设置页面 |

### 4.6 关键交互流程

#### 4.6.1 完整模拟考试流程

```
[选择完整模拟] → [随机抽取 Part1 话题组]
  → Part1 开始
    → [显示问题1] → [用户录音回答] → [显示问题2] → ... → Part1 结束
  → Part2 开始
    → [显示话题卡+提示点] → [1分钟准备倒计时] → [2分钟独白倒计时] → Part2 结束
  → Part3 开始
    → [显示讨论问题1] → [用户录音回答] → [显示问题2] → ... → Part3 结束
  → [练习回顾页]
    → [逐段回放录音] → [查看转写文本] → [四维度自评打分] → [保存记录]
```

#### 4.6.2 录音流程

```
[点击开始录音]
  → 请求麦克风权限
  → 创建 MediaRecorder 实例
  → 同时启动 SpeechRecognition
  → 实时显示音量波形 + 识别文本
[点击停止录音 / 自动超时]
  → 停止 MediaRecorder → 获得 Blob
  → 停止 SpeechRecognition → 获得最终文本
  → 存储 {Blob, transcript, duration} 到 RecordingSegment
```

---

## 5. UI 设计规范

### 5.1 设计原则

- **专注沉浸**：练习进行时全屏沉浸，减少干扰
- **清晰引导**：流程步骤明确，用户不迷路
- **即时反馈**：录音状态、倒计时、识别文本实时展示
- **温和色调**：主色调蓝色系，练习环境舒适不紧张

### 5.2 色彩体系

| 用途 | 色值 | 说明 |
|------|------|------|
| Primary | #1a56db | 主色，按钮/链接 |
| Primary Light | #3b82f6 | 悬浮态 |
| Success | #10b981 | 录音中/完成 |
| Warning | #f59e0b | 倒计时警告 |
| Danger | #ef4444 | 错误/超时 |
| BG Main | #f9fafb | 页面背景 |
| BG Card | #ffffff | 卡片背景 |
| Text Primary | #111827 | 主文本 |
| Text Secondary | #6b7280 | 辅助文本 |

### 5.3 页面布局

```
┌──────────────────────────────────────────────┐
│  Header (Logo + 导航 + 设置)                   │
├────────┬─────────────────────────────────────┤
│        │                                     │
│ Side   │         Main Content                │
│ bar    │                                     │
│        │                                     │
│ 练习   │   根据路由渲染对应页面内容              │
│ 话题   │                                     │
│ 历史   │                                     │
│ 词汇   │                                     │
│ 统计   │                                     │
│        │                                     │
├────────┴─────────────────────────────────────┤
│  (练习模式时 Sidebar 隐藏，全屏沉浸)             │
└──────────────────────────────────────────────┘
```

### 5.4 练习进行中页面布局

```
┌──────────────────────────────────────────────┐
│  ← 退出    Part 2 of 3    ⏱ 00:45 / 02:00   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Topic Card                            │  │
│  │  Describe a memorable journey...       │  │
│  │  • Where you went                     │  │
│  │  • Who you went with                  │  │
│  │  • What made it memorable             │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  🎙️ Recording...  ●━━━━━━━━━━━━━━●    │  │
│  │  "I went to... last year with my..."  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│         [ ⏸ Pause ]   [ ⏭ Skip ]            │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 6. 浏览器兼容性

| 特性 | Chrome | Edge | Firefox | Safari |
|------|--------|------|---------|--------|
| MediaRecorder | ✅ | ✅ | ✅ | ✅ (14.1+) |
| SpeechRecognition | ✅ | ✅ | ❌ | ❌ |
| SpeechSynthesis | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |

> **降级策略**：Firefox/Safari 下语音识别不可用，自动降级为纯录音模式，界面提示用户推荐 Chrome 获得完整体验。

---

## 7. 性能考量

- **录音数据**：音频 Blob 存储在 IndexedDB，单次练习约 5–15MB，需注意存储配额
- **题库数据**：内置题库 JSON 约 100–200KB，首次加载时写入 IndexedDB
- **语音识别**：实时识别文本增量更新，避免频繁 setState 导致卡顿
- **音频可视化**：使用 `requestAnimationFrame` 控制帧率，避免过度渲染
- **数据清理**：提供录音清理功能，支持按时间范围删除旧录音释放空间

---

## 8. 开发计划

### Phase 1 — MVP（2 周）

- [ ] 项目基础设施搭建（路由、布局、数据库初始化）
- [ ] 内置题库数据编写（Part1/Part2/Part3）
- [ ] 录音功能（useAudioRecorder）
- [ ] 语音识别功能（useSpeechRecognition）
- [ ] 倒计时组件（useTimer + Timer UI）
- [ ] 完整模拟考试流程页面
- [ ] 练习回顾与自评页面
- [ ] 练习历史列表与详情页

### Phase 2 — 增强（1 周）

- [ ] 单部分练习模式
- [ ] 自定义话题 CRUD
- [ ] 话题收藏功能
- [ ] TTS 考官语音播报
- [ ] 词汇本基础功能

### Phase 3 — 优化（1 周）

- [ ] 数据统计仪表盘
- [ ] 数据导入导出
- [ ] 暗色模式
- [ ] 快捷键支持
- [ ] 录音可视化波形

---

## 9. 风险与应对

| 风险 | 影响 | 应对策略 |
|------|------|----------|
| SpeechRecognition 浏览器兼容性 | Firefox/Safari 用户无法使用语音识别 | 降级为纯录音模式，推荐 Chrome |
| IndexedDB 存储配额 | 大量录音可能超出浏览器存储限制 | 提供清理功能，单条录音压缩，超限时提醒 |
| 语音识别准确度 | 识别文本可能有误差 | 仅作辅助参考，不作为评分依据 |
| 麦克风权限被拒 | 无法录音 | 友好提示引导用户授权 |
| WebM 格式兼容性 | 部分浏览器不支持 WebM 播放 | 录音格式检测，必要时转码 |

---

## 10. 参考资料

- [IELTS Speaking Test Format](https://www.ielts.org/en-us/about-the-test/test-format-in-detail)
- [Web Speech API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaRecorder API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [Dexie.js Documentation](https://dexie.org/)
- [React Router v7](https://reactrouter.com/)
- [Zustand](https://github.com/pmndrs/zustand)