# J-Say

> 雅思口语练习 Web 应用 —— 在浏览器中完整模拟雅思口语考试，支持录音、转写、回放与练习追踪。

English: [README.md](./README.md)

## 项目简介

J-Say 是一款面向雅思考生和英语学习者的 PC Web 应用，完整还原雅思口语考试三部分流程，内置录音、语音识别、模拟考官 TTS、四维度自评和本地练习历史。主应用纯前端运行，数据存储在浏览器 IndexedDB 中，**无需注册、无需服务端**。同时提供可选的语料后台（`server/` + `admin/`），用于在线维护题库并向客户端推送更新。

## 核心功能

- **完整模拟考试** —— Part 1 → Part 2（1 分钟准备 + 2 分钟独白）→ Part 3，倒计时全程可视化，每题独立录音。
- **单部分 / 随机练习** —— 可针对性练习单个 Part,或随机抽取话题快速开始。
- **录音与回放** —— 基于 MediaRecorder 录制，按问题分段，可下载为 WebM/WAV。
- **实时转写** —— Web Speech API 语音识别,转写文本与录音对照展示。
- **模拟考官语音** —— 可插拔的 TTS 层：`kokoro-webgpu`（端侧高质量,开发中）+ `web-speech` 兜底；可切换英式/美式口音。
- **内置题库** —— 50+ Part 1 话题组、30+ Part 2 话题卡、20+ Part 3 讨论方向；支持分类、筛选、收藏，亦可自定义话题。
- **词汇本** —— 话题关联高频词汇 + 用户自定义词条，支持搜索与标记。
- **自我评分** —— 按雅思四维度（流利度、词汇、语法、发音）打分,并可写练习笔记。
- **历史与统计** —— 按时间倒序的历史记录可完整回放；仪表盘提供频次热力图、评分趋势、话题覆盖度。
- **本地优先存储** —— 全部数据存于 IndexedDB；支持 JSON 导入导出,方便备份和迁移。
- **可选语料后台** —— Hono + SQLite 后端 + Ant Design 管理前端，支持在线编辑、版本发布,通过 `VITE_API_BASE` 单向同步到客户端。

## 技术栈

| 模块 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite |
| 样式 | TailwindCSS 4 |
| 路由 | React Router v7 |
| 状态 | Zustand |
| 本地数据库 | Dexie.js (IndexedDB) |
| 音频 | MediaRecorder API |
| 语音识别 / 合成 | Web Speech API、Kokoro-82M on WebGPU (Transformers.js) |
| 图表 | Recharts |
| 后台服务 | Hono + Drizzle ORM + better-sqlite3 |
| 后台前端 | React + Ant Design 5 |

## 目录结构

```
j-say/
├── src/              # 主应用 (端口 5173)
│   ├── pages/        # Home / Practice / Topics / History / Vocabulary / Stats / Settings
│   ├── components/   # ui / layout / shared
│   ├── hooks/        # useAudioRecorder、useSpeechRecognition、useSpeechSynthesis、useTimer 等
│   ├── services/tts/ # Provider 抽象层（web-speech / kokoro-webgpu / azure / elevenlabs / openai）
│   ├── stores/       # Zustand 状态
│   ├── db/           # Dexie 表结构
│   └── data/         # 内置话题与词汇种子数据
├── server/           # 可选语料后端 (Hono + SQLite, 端口 3001)
├── admin/            # 可选语料后台 (Ant Design, 端口 5174)
├── shared/           # server 与 admin 共享类型
├── docs/             # 需求与技术设计文档
└── features/         # 各 Feature 计划与状态
```

## 快速开始

需要 Node.js 20+。

```bash
# 安装依赖（workspaces 已包含 server/ 与 admin/）
npm install

# 启动主应用 http://localhost:5173
npm run dev
```

可选 —— 启动语料后台：

```bash
# 后端 http://localhost:3001
cd server && npm run dev

# 管理后台 http://localhost:5174
cd admin && npm run dev
```

或使用 Docker Compose 一键启动 `server` + `admin`：

```bash
docker compose up -d
```

## 内置语料导入数据库

`src/data/topics/*.ts` 与 `src/data/vocabulary.ts` 是主应用的内置语料，可一键导入到后端 SQLite 中供管理后台使用：

```bash
# 一步到位：转换 TS 数据 → 写入 server/data/*.json → 清空内置记录后重新导入 DB
npm run seed

# 也可分步执行
npm run seed:convert   # 生成 server/data/seed-topics.json + seed-vocabularies.json
npm run seed:db        # 等价于 cd server && npm run seed
```

`seed` 会保留用户自定义记录(`isCustom=true`)，仅清空并刷新内置部分；导入后状态为 `published`。当 `src/data/` 内置语料更新时，重新执行 `npm run seed` 即可同步到 DB。

## 环境变量

复制 `.env.example` 为 `.env` 并按需修改：

| 变量 | 用途 |
|------|------|
| `VITE_API_BASE` | 主应用同步语料的后端地址；不配置则完全离线使用内置数据 |
| `PORT` | 后端端口（默认 `3001`） |
| `ADMIN_PASSWORD` | 后台登录密码 |
| `CORS_ORIGINS` | 后端允许的 CORS 来源，逗号分隔 |
| `IMPORT_LIMIT` | 单次语料导入条数上限 |

## 浏览器支持

- **推荐**：桌面端 Chrome 119+，可启用完整语音识别 + WebGPU TTS。
- **语音识别**需要基于 Chromium 的浏览器；其他浏览器会自动降级为仅录音模式。
- **Kokoro WebGPU TTS** 需要 Chrome 119+ 或 Safari 17.4+，否则自动回退到 Web Speech。

## 文档索引

- [`docs/requirements-design.md`](./docs/requirements-design.md) —— 完整产品需求
- [`docs/technical-design.md`](./docs/technical-design.md) —— 主应用技术设计
- [`docs/tts-research.md`](./docs/tts-research.md) / [`docs/tts-implementation.md`](./docs/tts-implementation.md) —— TTS 方案与实现
- [`docs/corpus-admin-requirements.md`](./docs/corpus-admin-requirements.md) / [`docs/corpus-admin-technical-design.md`](./docs/corpus-admin-technical-design.md) —— 语料后台系统
- [`features/STATUS.md`](./features/STATUS.md) —— 当前 Feature 进展

## License

ISC
