# J-Say 语料库后台管理系统 — 技术方案

> 版本：v1.0 | 日期：2026-05-14

---

## 1. 文档说明

### 1.1 目的

基于《J-Say 语料库后台管理系统需求文档》，对系统进行详细的技术分析与设计，作为开发实施的依据。涵盖系统架构、模块划分、API 定义、数据模型、前端组件设计、与现有应用的集成方案等。

### 1.2 约束

- 单用户系统，无审核流程，用户直接编辑发布
- 后端服务轻量化部署，优先 SQLite
- 管理前端与现有 J-Say 应用共享类型定义
- 语料同步需兼容现有 IndexedDB 数据结构

---

## 2. 系统架构

### 2.1 总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        管理前端 (Admin)                       │
│            React + Ant Design + Vite                        │
│            端口 5174                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        后端服务 (Server)                      │
│            Hono + Drizzle ORM + SQLite                      │
│            端口 3001                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌────────────┐  │
│  │ Topic API │ │ Vocab API │ │ Category  │ │ Import/    │  │
│  │           │ │           │ │ API       │ │ Export API │  │
│  └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬──────┘  │
│        │              │             │              │         │
│  ┌─────┴──────────────┴─────────────┴──────────────┴──────┐  │
│  │                    Drizzle ORM                         │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │                               │
│  ┌──────────────────────────┴────────────────────────────┐  │
│  │                    SQLite / PostgreSQL                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ 同步 API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    现有前端应用 (J-Say)                       │
│            React + Zustand + Dexie (IndexedDB)              │
│            端口 5173                                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  新增 sync service ──→ 启动时检查版本 ──→ 增量同步    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选型

| 类别 | 选型 | 选型理由 |
|------|------|----------|
| 后端框架 | **Hono** | 轻量、类型安全、支持多运行时，比 Express 更现代 |
| ORM | **Drizzle ORM** | 轻量、类型安全、SQL-like API、SQLite 原生支持好 |
| 数据库 | **SQLite**（开发/单机）/ **PostgreSQL**（生产扩展） | 零配置起步，Drizzle 无缝切换 |
| 认证 | **简单密码 + Cookie Session** | 单用户场景，JWT 过重，Cookie Session 足够 |
| 管理前端 | **React 19 + Ant Design 5 + Vite** | 与 J-Say 技术栈统一，Ant Design 后台组件成熟 |
| 状态管理 | **Zustand** | 与 J-Say 统一，轻量 |
| HTTP 客户端 | **ky** | 轻量 fetch 封装，比 axios 更小 |
| 构建 | **Vite** | 与 J-Say 共享配置经验 |
| 部署 | **Docker Compose** | 服务端 + 数据库一键部署 |

### 2.3 为什么不选 Express + Prisma

| 维度 | Express + Prisma | Hono + Drizzle |
|------|------------------|----------------|
| 包体积 | Prisma Client ~10MB | Drizzle 零生成，~100KB |
| 启动速度 | Prisma generate 需要额外步骤 | Drizzle 直接用，无生成步骤 |
| 类型安全 | Prisma schema → 生成类型 | Drizzle schema 即类型，无中间层 |
| SQL 控制 | Prisma 抽象较重，复杂查询需 raw | Drizzle 贴近 SQL，灵活度高 |
| 运行时 | Node.js only | Node.js / Bun / Deno / Edge |
| 适合场景 | 大型团队、复杂关联查询 | 中小型项目、追求轻量 |

本系统数据模型简单（5 张表），查询模式固定，Drizzle 足够且更轻。

---

## 3. 项目结构

### 3.1 Monorepo 结构

```
j-say/                              # 现有项目根目录
├── src/                            # 现有前端应用
├── docs/                           # 文档
├── admin/                          # 新增：管理前端
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx                # 入口
│       ├── App.tsx                 # 根组件 + 路由
│       ├── api/                    # API 调用层
│       │   ├── client.ts           # ky 实例配置
│       │   ├── topics.ts           # 话题 API
│       │   ├── vocabularies.ts     # 词汇 API
│       │   ├── categories.ts       # 分类 API
│       │   ├── import-export.ts    # 导入导出 API
│       │   ├── stats.ts            # 统计 API
│       │   └── versions.ts         # 版本 API
│       ├── stores/                 # Zustand 状态
│       │   ├── authStore.ts        # 认证状态
│       │   └── appStore.ts         # 全局状态
│       ├── pages/                  # 页面组件
│       │   ├── Login/
│       │   │   └── LoginPage.tsx
│       │   ├── Dashboard/
│       │   │   └── DashboardPage.tsx
│       │   ├── Topics/
│       │   │   ├── TopicListPage.tsx
│       │   │   ├── TopicEditPage.tsx
│       │   │   └── TopicDetailPage.tsx
│       │   ├── Vocabularies/
│       │   │   ├── VocabListPage.tsx
│       │   │   ├── VocabEditPage.tsx
│       │   │   └── VocabDetailPage.tsx
│       │   ├── Categories/
│       │   │   └── CategoryPage.tsx
│       │   ├── ImportExport/
│       │   │   └── ImportExportPage.tsx
│       │   ├── Stats/
│       │   │   └── StatsPage.tsx
│       │   ├── Versions/
│       │   │   └── VersionPage.tsx
│       │   └── Logs/
│       │       └── AuditLogPage.tsx
│       ├── components/             # 通用组件
│       │   ├── layout/
│       │   │   ├── AdminLayout.tsx  # 管理后台布局
│       │   │   └── Sidebar.tsx      # 侧边栏
│       │   ├── topic/
│       │   │   ├── TopicForm.tsx    # 话题编辑表单
│       │   │   ├── QuestionEditor.tsx # 问题列表编辑器
│       │   │   └── ExampleEditor.tsx  # 示例回答编辑器
│       │   ├── vocab/
│       │   │   └── VocabForm.tsx    # 词汇编辑表单
│       │   └── shared/
│       │       ├── StatusTag.tsx    # 状态标签
│       │       └── BatchActions.tsx # 批量操作
│       └── types/                  # 类型定义
│           └── index.ts            # 从 shared/types 引用
├── server/                         # 新增：后端服务
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts           # Drizzle 配置
│   └── src/
│       ├── index.ts                # 入口，Hono app
│       ├── config.ts               # 环境配置
│       ├── db/
│       │   ├── index.ts            # 数据库连接
│       │   ├── schema.ts           # Drizzle Schema
│       │   ├── migrate.ts          # 迁移脚本
│       │   └── seed.ts             # 种子数据（从现有 JSON 导入）
│       ├── middleware/
│       │   ├── auth.ts             # 认证中间件
│       │   ├── logger.ts           # 请求日志
│       │   └── error.ts            # 错误处理
│       ├── routes/
│       │   ├── auth.ts             # 认证路由
│       │   ├── topics.ts           # 话题路由
│       │   ├── vocabularies.ts     # 词汇路由
│       │   ├── categories.ts       # 分类路由
│       │   ├── import-export.ts    # 导入导出路由
│       │   ├── stats.ts            # 统计路由
│       │   ├── versions.ts         # 版本路由
│       │   ├── sync.ts             # 客户端同步路由
│       │   └── audit-logs.ts       # 操作日志路由
│       ├── services/
│       │   ├── topicService.ts     # 话题业务逻辑
│       │   ├── vocabService.ts     # 词汇业务逻辑
│       │   ├── categoryService.ts  # 分类业务逻辑
│       │   ├── importService.ts    # 导入逻辑
│       │   ├── exportService.ts    # 导出逻辑
│       │   ├── versionService.ts   # 版本管理逻辑
│       │   ├── syncService.ts      # 同步逻辑
│       │   └── statsService.ts     # 统计逻辑
│       └── utils/
│           ├── validation.ts       # 校验工具
│           └── diff.ts             # 版本对比工具
└── shared/                         # 新增：共享类型
    └── types/
        ├── topic.ts                # 话题类型（与前端共用）
        ├── vocabulary.ts           # 词汇类型
        ├── category.ts             # 分类类型
        ├── api.ts                  # API 请求/响应类型
        └── index.ts                # 统一导出
```

### 3.2 包管理

使用 npm workspaces 管理 monorepo：

```json
// 根目录 package.json 新增
{
  "workspaces": ["admin", "server", "shared"]
}
```

---

## 4. 数据库设计

### 4.1 Drizzle Schema

```typescript
// server/src/db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ==================== 分类 ====================
export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  nameZh: text('name_zh').notNull(),
  nameEn: text('name_en').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
    .$defaultFn(() => new Date()),
});

// ==================== 话题 ====================
export const topics = sqliteTable('topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  part: integer('part').notNull(), // 1 | 2 | 3
  categoryId: integer('category_id').notNull()
    .references(() => categories.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  prompts: text('prompts', { mode: 'json' }).notNull().default('[]'),
  questions: text('questions', { mode: 'json' }).notNull(),
  examples: text('examples', { mode: 'json' }).notNull().default('[]'),
  part2Example: text('part2_example', { mode: 'json' }),
  relatedPart2Id: integer('related_part2_id'),
  difficulty: text('difficulty').notNull(), // 'easy' | 'medium' | 'hard'
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('draft'), // 'draft' | 'published' | 'offline'
  version: integer('version').notNull().default(1),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }), // 软删除
});

// ==================== 词汇 ====================
export const vocabularies = sqliteTable('vocabularies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word: text('word').notNull(),
  definition: text('definition').notNull(),
  example: text('example'),
  categoryId: integer('category_id').notNull()
    .references(() => categories.id),
  relatedTopicIds: text('related_topic_ids', { mode: 'json' }).notNull().default('[]'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
    .$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

// ==================== 语料版本 ====================
export const corpusVersions = sqliteTable('corpus_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  version: text('version').notNull().unique(), // semver: '1.0.0'
  summary: text('summary'),
  topicCount: integer('topic_count').notNull(),
  vocabCount: integer('vocab_count').notNull(),
  snapshot: text('snapshot', { mode: 'json' }).notNull(), // 语料快照
  status: text('status').notNull().default('unpublished'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
    .$defaultFn(() => new Date()),
});

// ==================== 操作日志 ====================
export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(), // create | update | delete | publish | offline | import | export
  targetType: text('target_type'), // topic | vocabulary | category | version
  targetId: integer('target_id'),
  detail: text('detail', { mode: 'json' }), // 变更详情
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
    .$defaultFn(() => new Date()),
});

// ==================== 系统配置 ====================
export const systemConfig = sqliteTable('system_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
    .$defaultFn(() => new Date()),
});
```

### 4.2 索引设计

```sql
-- 话题表索引
CREATE INDEX idx_topics_part ON topics(part);
CREATE INDEX idx_topics_category ON topics(category_id);
CREATE INDEX idx_topics_status ON topics(status);
CREATE INDEX idx_topics_difficulty ON topics(difficulty);
CREATE INDEX idx_topics_part_category ON topics(part, category_id);
CREATE INDEX idx_topics_updated_at ON topics(updated_at);

-- 词汇表索引
CREATE INDEX idx_vocabularies_category ON vocabularies(category_id);
CREATE INDEX idx_vocabularies_word ON vocabularies(word);
CREATE INDEX idx_vocabularies_status ON vocabularies(status);

-- 操作日志索引
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### 4.3 数据迁移策略

使用 Drizzle 内置迁移：

```bash
# 生成迁移文件
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit migrate
```

种子数据从现有 `src/data/topics/` 和 `src/data/vocabulary.ts` 导入，`server/src/db/seed.ts` 负责首次初始化。

---

## 5. API 设计

### 5.1 通用约定

**基础路径**：`/api`

**分页参数**：`?page=1&pageSize=20`

**排序参数**：`?sortBy=updatedAt&sortOrder=desc`

**响应格式**：

```typescript
// 成功响应
interface ApiResponse<T> {
  success: true;
  data: T;
}

// 分页响应
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
```

### 5.2 认证 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录，返回 Set-Cookie |
| POST | /api/auth/logout | 登出，清除 Cookie |
| GET | /api/auth/me | 获取当前用户信息 |

```typescript
// POST /api/auth/login
interface LoginRequest {
  password: string; // 简单密码认证，单用户无需用户名
}
interface LoginResponse {
  authenticated: boolean;
}

// GET /api/auth/me
interface MeResponse {
  authenticated: boolean;
}
```

认证方案说明：单用户系统，仅设密码保护。密码通过环境变量 `ADMIN_PASSWORD` 配置，登录后设置 HttpOnly Cookie（`admin_session`），有效期 7 天。Session 信息存储在 SQLite `systemConfig` 表中。

### 5.3 话题 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/topics | 话题列表（分页、筛选、排序） |
| GET | /api/topics/:id | 话题详情 |
| POST | /api/topics | 创建话题 |
| PUT | /api/topics/:id | 更新话题 |
| DELETE | /api/topics/:id | 删除话题（软删除） |
| POST | /api/topics/batch | 批量操作 |
| PUT | /api/topics/:id/status | 更新状态（发布/下架） |
| GET | /api/topics/:id/stats | 话题使用统计 |

```typescript
// GET /api/topics 筛选参数
interface TopicQuery {
  page?: number;
  pageSize?: number;
  part?: 1 | 2 | 3;
  categoryId?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'draft' | 'published' | 'offline';
  keyword?: string;        // 搜索标题和内容
  sortBy?: 'updatedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// POST /api/topics 创建/编辑
interface TopicCreateRequest {
  part: 1 | 2 | 3;
  categoryId: number;
  title: string;
  content: string;
  prompts?: string[];       // Part 2
  questions: string[];
  examples: QuestionExample[];
  part2Example?: QuestionExample;
  relatedPart2Id?: number;  // Part 3
  difficulty: 'easy' | 'medium' | 'hard';
  status?: 'draft' | 'published';
}

// POST /api/topics/batch
interface TopicBatchRequest {
  action: 'delete' | 'updateCategory' | 'updateDifficulty' | 'updateStatus' | 'publish' | 'offline';
  ids: number[];
  data?: {
    categoryId?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    status?: 'draft' | 'published' | 'offline';
  };
}

// PUT /api/topics/:id/status
interface TopicStatusRequest {
  status: 'published' | 'offline';
}
```

### 5.4 词汇 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/vocabularies | 词汇列表（分页、筛选） |
| GET | /api/vocabularies/:id | 词汇详情 |
| POST | /api/vocabularies | 创建词汇 |
| PUT | /api/vocabularies/:id | 更新词汇 |
| DELETE | /api/vocabularies/:id | 删除词汇（软删除） |
| POST | /api/vocabularies/batch | 批量操作 |

```typescript
// GET /api/vocabularies 筛选参数
interface VocabQuery {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  keyword?: string;        // 搜索单词和释义
  sortBy?: 'updatedAt' | 'createdAt' | 'word';
  sortOrder?: 'asc' | 'desc';
}

// POST /api/vocabularies 创建/编辑
interface VocabCreateRequest {
  word: string;
  definition: string;
  example?: string;
  categoryId: number;
  relatedTopicIds?: number[];
  status?: 'draft' | 'published';
}
```

### 5.5 分类 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 分类列表（含统计） |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/:id | 更新分类 |
| DELETE | /api/categories/:id | 删除分类（系统分类禁删） |

```typescript
// GET /api/categories 响应增加统计
interface CategoryWithStats {
  id: number;
  slug: string;
  nameZh: string;
  nameEn: string;
  sortOrder: number;
  enabled: boolean;
  isSystem: boolean;
  topicCount: number;    // 该分类下话题数
  vocabCount: number;    // 该分类下词汇数
}
```

### 5.6 导入导出 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/import/preview | 导入预览（校验不写入） |
| POST | /api/import | 执行导入 |
| GET | /api/export | 导出语料（下载 JSON） |

```typescript
// POST /api/import/preview
// Content-Type: multipart/form-data, field: file
interface ImportPreviewResult {
  topics: {
    total: number;
    new: number;          // 新增
    duplicate: number;    // 重复（按 title + part 判断）
    invalid: number;      // 校验失败
    errors: Array<{ index: number; reason: string }>;
  };
  vocabularies: {
    total: number;
    new: number;
    duplicate: number;    // 按 word 判断
    invalid: number;
    errors: Array<{ index: number; reason: string }>;
  };
}

// POST /api/import
interface ImportRequest {
  // 与 preview 相同的文件上传
  duplicateStrategy: 'skip' | 'overwrite' | 'keep_both';
}

// GET /api/export 导出参数
interface ExportQuery {
  type: 'all' | 'topics' | 'vocabularies';
  part?: 1 | 2 | 3;           // 仅话题
  categoryId?: number;
  status?: 'draft' | 'published' | 'offline';
}
```

导出格式与现有前端数据格式完全兼容：

```typescript
// 导出的 JSON 结构
interface ExportData {
  version: 2;  // 区别于前端 v1 导出格式
  exportedAt: number;
  topics: Omit<Topic, 'id'>[];
  vocabularies: Omit<Vocabulary, 'id'>[];
}
```

### 5.7 统计 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stats/overview | 语料总览 |
| GET | /api/stats/usage | 使用分析 |
| GET | /api/stats/quality | 质量分析 |

```typescript
// GET /api/stats/overview
interface StatsOverview {
  topics: {
    total: number;
    byPart: Record<1 | 2 | 3, number>;
    byCategory: Record<string, number>;
    byDifficulty: Record<'easy' | 'medium' | 'hard', number>;
    byStatus: Record<'draft' | 'published' | 'offline', number>;
    withExamples: number;      // 有示例回答的话题数
    exampleCoverage: number;   // 示例覆盖率百分比
  };
  vocabularies: {
    total: number;
    byCategory: Record<string, number>;
    withTopics: number;        // 已关联话题的词汇数
  };
  recentTrend: Array<{
    date: string;              // YYYY-MM-DD
    topicsAdded: number;
    vocabsAdded: number;
  }>;
}
```

### 5.8 版本与发布 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/versions | 版本列表 |
| POST | /api/versions | 创建版本（快照当前已发布语料） |
| POST | /api/versions/:id/publish | 发布版本 |
| POST | /api/versions/:id/rollback | 回滚版本 |
| GET | /api/versions/:id/diff | 版本对比 |

```typescript
// POST /api/versions 创建版本
interface VersionCreateRequest {
  version: string;       // semver 格式
  summary?: string;
}

// GET /api/versions/:id/diff
interface VersionDiff {
  topicsAdded: number;
  topicsRemoved: number;
  topicsModified: number;
  vocabsAdded: number;
  vocabsRemoved: number;
  vocabsModified: number;
  details: Array<{
    type: 'topic' | 'vocabulary';
    id: number;
    action: 'added' | 'removed' | 'modified';
    before?: object;
    after?: object;
  }>;
}
```

### 5.9 客户端同步 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/sync/version | 获取当前发布版本号 |
| GET | /api/sync/topics | 获取话题数据 |
| GET | /api/sync/vocabularies | 获取词汇数据 |

```typescript
// GET /api/sync/version
interface SyncVersion {
  version: string;       // 当前发布版本号，如 '1.2.0'
  publishedAt: number;
  topicCount: number;
  vocabCount: number;
}

// GET /api/sync/topics
// 查询参数：since=版本号，增量同步
interface SyncTopicsResponse {
  version: string;
  topics: Array<{
    id: number;
    part: 1 | 2 | 3;
    category: string;      // 分类 slug
    title: string;
    content: string;
    prompts: string[];
    questions: string[];
    examples: QuestionExample[];
    part2Example?: QuestionExample;
    relatedPart2Id: number | null;
    difficulty: 'easy' | 'medium' | 'hard';
    isCustom: boolean;
    isFavorite: boolean;
    updatedAt: number;
  }>;
  deletedIds: number[];   // 已删除的话题 ID
}

// GET /api/sync/vocabularies 同理
```

**同步策略**：

- 客户端启动时调用 `/api/sync/version`，比对本地存储的版本号
- 版本不同时，调用 `/api/sync/topics?since=本地版本` 和 `/api/sync/vocabularies?since=本地版本`
- 返回的是全量已发布数据 + 已删除 ID 列表，客户端执行 upsert + delete
- 如果服务端不可达，使用本地缓存数据，不阻塞使用

### 5.10 操作日志 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/audit-logs | 操作日志列表 |

```typescript
// GET /api/audit-logs
interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  targetType?: string;
  startDate?: string;    // ISO date
  endDate?: string;
}
```

### 5.11 系统配置 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/config | 获取配置 |
| PUT | /api/config | 更新配置 |

```typescript
interface SystemConfigResponse {
  currentVersion: string;       // 当前语料版本
  importLimit: number;          // 单次导入上限，默认 5000
  syncEnabled: boolean;         // 是否启用客户端同步
}
```

---

## 6. 后端模块设计

### 6.1 项目初始化

```typescript
// server/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun'; // 或 @hono/node-server
import { authRoutes } from './routes/auth';
import { topicRoutes } from './routes/topics';
import { vocabRoutes } from './routes/vocabularies';
import { categoryRoutes } from './routes/categories';
import { importExportRoutes } from './routes/import-export';
import { statsRoutes } from './routes/stats';
import { versionRoutes } from './routes/versions';
import { syncRoutes } from './routes/sync';
import { auditLogRoutes } from './routes/audit-logs';
import { configRoutes } from './routes/config';
import { errorHandler } from './middleware/error';
import { authMiddleware } from './middleware/auth';

const app = new Hono();

// 全局中间件
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use('*', logger());

// 公开路由
app.route('/api/auth', authRoutes);
app.route('/api/sync', syncRoutes); // 同步 API 不需要认证

// 需要认证的路由
app.use('/api/*', authMiddleware);
app.route('/api/topics', topicRoutes);
app.route('/api/vocabularies', vocabRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/import', importExportRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/versions', versionRoutes);
app.route('/api/audit-logs', auditLogRoutes);
app.route('/api/config', configRoutes);

// 错误处理
app.onError(errorHandler);

export default app;
```

### 6.2 认证中间件

```typescript
// server/src/middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { db } from '../db';
import { systemConfig } from '../db/schema';
import { eq } from 'drizzle-orm';

const SESSION_COOKIE = 'admin_session';

export const authMiddleware = createMiddleware(async (c, next) => {
  const sessionToken = getCookie(c, SESSION_COOKIE);
  if (!sessionToken) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, 401);
  }

  // 验证 session
  const session = await db.query.systemConfig.findFirst({
    where: eq(systemConfig.key, `session_${sessionToken}`),
  });

  if (!session) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: '会话已过期' } }, 401);
  }

  // 检查过期（7 天）
  const expiresAt = Number(session.value);
  if (Date.now() > expiresAt) {
    await db.delete(systemConfig).where(eq(systemConfig.key, `session_${sessionToken}`));
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: '会话已过期' } }, 401);
  }

  await next();
});
```

### 6.3 话题 Service 核心逻辑

```typescript
// server/src/services/topicService.ts
import { db } from '../db';
import { topics, auditLogs } from '../db/schema';
import { eq, and, like, desc, asc, sql, isNull } from 'drizzle-orm';
import type { TopicQuery, TopicCreateRequest, TopicBatchRequest } from '@shared/types';

export const topicService = {
  async list(query: TopicQuery) {
    const { page = 1, pageSize = 20, part, categoryId, difficulty, status, keyword, sortBy = 'updatedAt', sortOrder = 'desc' } = query;

    const conditions = [isNull(topics.deletedAt)];
    if (part) conditions.push(eq(topics.part, part));
    if (categoryId) conditions.push(eq(topics.categoryId, categoryId));
    if (difficulty) conditions.push(eq(topics.difficulty, difficulty));
    if (status) conditions.push(eq(topics.status, status));
    if (keyword) conditions.push(like(topics.title, `%${keyword}%`));

    const where = and(...conditions);
    const order = sortOrder === 'asc' ? asc(topics[sortBy]) : desc(topics[sortBy]);

    const [data, countResult] = await Promise.all([
      db.select().from(topics).where(where).orderBy(order)
        .limit(pageSize).offset((page - 1) * pageSize),
      db.select({ count: sql<number>`count(*)` }).from(topics).where(where),
    ]);

    return {
      data,
      pagination: {
        page,
        pageSize,
        total: countResult[0]?.count ?? 0,
        totalPages: Math.ceil((countResult[0]?.count ?? 0) / pageSize),
      },
    };
  },

  async getById(id: number) {
    return db.query.topics.findFirst({
      where: and(eq(topics.id, id), isNull(topics.deletedAt)),
    });
  },

  async create(data: TopicCreateRequest) {
    const [topic] = await db.insert(topics).values({
      ...data,
      status: data.status ?? 'draft',
      version: 1,
    }).returning();

    await this.logAction('create', 'topic', topic.id, { title: topic.title });
    return topic;
  },

  async update(id: number, data: Partial<TopicCreateRequest>) {
    const [topic] = await db.update(topics).set({
      ...data,
      version: sql`${topics.version} + 1`,
      updatedAt: new Date(),
    }).where(and(eq(topics.id, id), isNull(topics.deletedAt))).returning();

    await this.logAction('update', 'topic', id, { title: topic?.title });
    return topic;
  },

  async softDelete(id: number) {
    await db.update(topics).set({ deletedAt: new Date() })
      .where(eq(topics.id, id));
    await this.logAction('delete', 'topic', id);
  },

  async batchAction(request: TopicBatchRequest) {
    // 批量操作逻辑
  },

  async updateStatus(id: number, status: 'published' | 'offline') {
    const [topic] = await db.update(topics).set({
      status,
      publishedAt: status === 'published' ? new Date() : undefined,
      updatedAt: new Date(),
    }).where(eq(topics.id, id)).returning();

    await this.logAction(status === 'published' ? 'publish' : 'offline', 'topic', id);
    return topic;
  },

  async logAction(action: string, targetType: string, targetId: number, detail?: object) {
    await db.insert(auditLogs).values({
      action,
      targetType,
      targetId,
      detail: detail ?? null,
    });
  },
};
```

### 6.4 导入 Service

```typescript
// server/src/services/importService.ts
export const importService = {
  async preview(fileContent: string) {
    const data = JSON.parse(fileContent);
    const result = { topics: { total: 0, new: 0, duplicate: 0, invalid: 0, errors: [] }, vocabularies: { total: 0, new: 0, duplicate: 0, invalid: 0, errors: [] } };

    // 校验话题
    if (data.topics) {
      for (let i = 0; i < data.topics.length; i++) {
        const topic = data.topics[i];
        const validation = validateTopic(topic);
        if (!validation.valid) {
          result.topics.invalid++;
          result.topics.errors.push({ index: i, reason: validation.reason });
          continue;
        }
        // 查重（按 title + part）
        const exists = await db.query.topics.findFirst({
          where: and(eq(topics.title, topic.title), eq(topics.part, topic.part), isNull(topics.deletedAt)),
        });
        if (exists) {
          result.topics.duplicate++;
        } else {
          result.topics.new++;
        }
        result.topics.total++;
      }
    }

    // 校验词汇（同理）
    // ...

    return result;
  },

  async execute(fileContent: string, strategy: 'skip' | 'overwrite' | 'keep_both') {
    // 根据策略执行导入
  },
};
```

### 6.5 版本与同步 Service

```typescript
// server/src/services/versionService.ts
export const versionService = {
  async create(version: string, summary?: string) {
    // 快照当前所有已发布语料
    const [publishedTopics, publishedVocabs] = await Promise.all([
      db.select().from(topics).where(eq(topics.status, 'published')),
      db.select().from(vocabularies).where(eq(vocabularies.status, 'published')),
    ]);

    const [record] = await db.insert(corpusVersions).values({
      version,
      summary,
      topicCount: publishedTopics.length,
      vocabCount: publishedVocabs.length,
      snapshot: { topics: publishedTopics, vocabularies: publishedVocabs },
    }).returning();

    return record;
  },

  async publish(versionId: number) {
    // 将版本标记为已发布，更新 systemConfig 中的当前版本号
  },

  async rollback(versionId: number) {
    // 从快照恢复语料数据
    const version = await db.query.corpusVersions.findFirst({
      where: eq(corpusVersions.id, versionId),
    });
    if (!version?.snapshot) throw new Error('版本快照不存在');

    const { topics: topicSnapshots, vocabularies: vocabSnapshots } = version.snapshot as any;

    await db.transaction(async (tx) => {
      // 清空并恢复
      await tx.update(topics).set({ status: 'offline' }).where(eq(topics.status, 'published'));
      // 从快照 upsert
      for (const t of topicSnapshots) {
        await tx.insert(topics).values(t).onConflictDoUpdate({ target: topics.id, set: t });
      }
      // 同理处理词汇
    });
  },
};

// server/src/services/syncService.ts
export const syncService = {
  async getVersion() {
    const config = await db.query.systemConfig.findFirst({
      where: eq(systemConfig.key, 'current_version'),
    });
    return config?.value ?? '0.0.0';
  },

  async getTopics(since?: string) {
    // 如果有 since 版本号，返回该版本之后的变更
    // 简化实现：直接返回所有已发布话题
    const publishedTopics = await db.select({
      id: topics.id,
      part: topics.part,
      // ... 只返回同步需要的字段
    }).from(topics).where(eq(topics.status, 'published'));

    const deletedTopicIds = await db.select({ id: topics.id })
      .from(topics).where(isNotNull(topics.deletedAt));

    return {
      topics: publishedTopics,
      deletedIds: deletedTopicIds.map(t => t.id),
    };
  },
};
```

---

## 7. 管理前端设计

### 7.1 路由配置

```typescript
// admin/src/App.tsx
import { createBrowserRouter } from 'react-router';
import { AdminLayout } from './components/layout/AdminLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AdminLayout />,  // 含认证检查
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/topics', element: <TopicListPage /> },
      { path: '/topics/create', element: <TopicEditPage /> },
      { path: '/topics/:id/edit', element: <TopicEditPage /> },
      { path: '/topics/:id', element: <TopicDetailPage /> },
      { path: '/vocabularies', element: <VocabListPage /> },
      { path: '/vocabularies/create', element: <VocabEditPage /> },
      { path: '/vocabularies/:id/edit', element: <VocabEditPage /> },
      { path: '/vocabularies/:id', element: <VocabDetailPage /> },
      { path: '/categories', element: <CategoryPage /> },
      { path: '/import', element: <ImportExportPage /> },
      { path: '/stats', element: <StatsPage /> },
      { path: '/versions', element: <VersionPage /> },
      { path: '/logs', element: <AuditLogPage /> },
    ],
  },
]);
```

### 7.2 页面组件设计

#### 话题列表页（TopicListPage）

```
┌──────────────────────────────────────────────────────────────┐
│ 话题管理                                        [+ 新建话题] │
├──────────────────────────────────────────────────────────────┤
│ Part: [全部▾]  分类: [全部▾]  难度: [全部▾]  状态: [全部▾]   │
│ 搜索: [________________] [搜索]                     [导出▼]  │
├──────────────────────────────────────────────────────────────┤
│ ☐ │ ID │ Part │ 分类   │ 标题          │ 难度 │ 状态  │ 操作 │
│ ☐ │ 1  │ P2   │ 经历   │ A memorable.. │ 中等 │ 已发布│ 编辑 │
│ ☐ │ 2  │ P1   │ 日常   │ Hometown      │ 简单 │ 草稿  │ 编辑 │
│ ☐ │ 3  │ P3   │ 社会   │ Education ..  │ 困难 │ 已发布│ 编辑 │
│ ...                                                          │
├──────────────────────────────────────────────────────────────┤
│ 已选 2 项  [批量删除] [批量修改分类] [批量发布]                │
│                          < 1 2 3 ... 5 >    每页 20 条       │
└──────────────────────────────────────────────────────────────┘
```

#### 话题编辑页（TopicEditPage）

```
┌──────────────────────────────────────────────────────────────┐
│ ← 返回列表                               [保存草稿] [发布]  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Part *      [1 ▾]        分类 *    [日常生活 ▾]             │
│  难度 *      [中等 ▾]      标题 *    [________________]       │
│                                                              │
│  内容描述 *                                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Questions about your hometown...                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  问题列表 ───────────────────────────────────── [+ 添加问题] │
│  ┌─ 问题 1 ─────────────────────────────────────────────┐   │
│  │ Where is your hometown?                              │   │
│  │ 简单示例: My hometown is Zhengzhou.                   │   │
│  │ Band 7 示例: I was born and raised in Zhengzhou...   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─ 问题 2 ─────────────────────────────────────────────┐   │
│  │ What do you like most about your hometown?           │   │
│  │ ...                                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠ Part 2 专属字段 (当前 Part = 2 时显示)                    │
│  提示点:                                                     │
│  • Where you went                    [×]                    │
│  • Who you went with                 [×]                    │
│  [+ 添加提示点]                                              │
│  独白示例:                                                   │
│  简单示例: [...]                                             │
│  Band 7 示例: [...]                                          │
│                                                              │
│  ⚠ Part 3 专属字段 (当前 Part = 3 时显示)                    │
│  关联 Part 2 话题: [A memorable journey ▾]                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.3 核心组件

| 组件 | 说明 |
|------|------|
| `AdminLayout` | 管理后台布局，含侧边栏导航 + 主内容区 |
| `TopicForm` | 话题编辑表单，根据 Part 动态显示字段 |
| `QuestionEditor` | 问题列表编辑器，支持拖拽排序、增删、示例编辑 |
| `ExampleEditor` | 示例回答编辑器（简单版 + Band 7 版） |
| `VocabForm` | 词汇编辑表单，含话题关联多选 |
| `StatusTag` | 状态标签组件（草稿/已发布/已下架） |
| `BatchActions` | 批量操作工具栏 |
| `ImportModal` | 导入对话框（上传 → 预览 → 选择策略 → 执行） |
| `VersionDiff` | 版本对比展示组件 |

---

## 8. 前端应用集成方案

### 8.1 同步流程

```
J-Say 前端启动
    │
    ▼
检查 localStorage 中的 jsay-corpus-version
    │
    ├── 版本相同 → 使用 IndexedDB 缓存数据
    │
    └── 版本不同或首次启动
         │
         ▼
    GET /api/sync/version
         │
         ├── 服务不可达 → 使用 IndexedDB 缓存数据（降级）
         │
         └── 获取到版本号
              │
              ▼
         GET /api/sync/topics
         GET /api/sync/vocabularies
              │
              ▼
         写入 IndexedDB（upsert + delete）
              │
              ▼
         更新 localStorage 版本号
```

### 8.2 前端改造点

#### 新增文件

```
src/services/sync.ts       # 同步服务
```

#### 修改文件

```
src/db/init.ts             # 增加远程同步逻辑
src/db/topic-repo.ts       # 增加 upsert 方法
src/db/vocab-repo.ts       # 增加 upsert 方法
src/types/topic.ts         # 无需修改，类型已兼容
```

#### 同步服务实现

```typescript
// src/services/sync.ts
import { db } from '@/db/index';
import { topicRepo } from '@/db/topic-repo';
import { vocabRepo } from '@/db/vocab-repo';

const SYNC_VERSION_KEY = 'jsay-corpus-version';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface SyncVersion {
  version: string;
  publishedAt: number;
  topicCount: number;
  vocabCount: number;
}

export async function syncCorpus(): Promise<{ synced: boolean; version?: string }> {
  try {
    // 1. 获取服务端版本号
    const versionRes = await fetch(`${API_BASE}/sync/version`);
    if (!versionRes.ok) return { synced: false };

    const { data: serverVersion } = await versionRes.json() as { data: SyncVersion };
    const localVersion = localStorage.getItem(SYNC_VERSION_KEY);

    // 2. 版本相同，无需同步
    if (localVersion === serverVersion.version) {
      return { synced: true, version: localVersion ?? undefined };
    }

    // 3. 拉取数据
    const [topicsRes, vocabsRes] = await Promise.all([
      fetch(`${API_BASE}/sync/topics`),
      fetch(`${API_BASE}/sync/vocabularies`),
    ]);

    if (!topicsRes.ok || !vocabsRes.ok) return { synced: false };

    const { data: topicsData } = await topicsRes.json();
    const { data: vocabsData } = await vocabsRes.json();

    // 4. 写入 IndexedDB
    await db.transaction('rw', [db.topics, db.vocabulary], async () => {
      // 话题 upsert
      for (const topic of topicsData.topics) {
        await db.topics.put(topic);
      }
      // 删除已移除的话题
      if (topicsData.deletedIds?.length) {
        await db.topics.bulkDelete(topicsData.deletedIds);
      }

      // 词汇 upsert
      for (const vocab of vocabsData.vocabularies) {
        await db.vocabulary.put(vocab);
      }
      if (vocabsData.deletedIds?.length) {
        await db.vocabulary.bulkDelete(vocabsData.deletedIds);
      }
    });

    // 5. 更新本地版本号
    localStorage.setItem(SYNC_VERSION_KEY, serverVersion.version);

    return { synced: true, version: serverVersion.version };
  } catch {
    // 服务不可达，静默降级
    return { synced: false };
  }
}
```

#### 修改 db/init.ts

```typescript
// src/db/init.ts — 修改后
import { db } from './index';
import { part1Topics } from '@/data/topics/part1';
import { part2Topics } from '@/data/topics/part2';
import { part3Topics } from '@/data/topics/part3';
import { builtInVocabulary } from '@/data/vocabulary';
import { syncCorpus } from '@/services/sync';

const DATA_VERSION_KEY = 'jsay-data-version';
const DATA_VERSION = 4; // Bump: 新增同步支持

export async function initDatabase(): Promise<void> {
  try {
    const storedVersion = parseInt(localStorage.getItem(DATA_VERSION_KEY) || '0', 10);
    const needsReseed = storedVersion < DATA_VERSION;

    await db.transaction('rw', [db.topics, db.vocabulary], async () => {
      if (needsReseed) {
        await db.topics.clear();
        const allTopics = [...part1Topics, ...part2Topics, ...part3Topics];
        await db.topics.bulkAdd(allTopics as any);
      }

      const vocabCount = await db.vocabulary.count();
      if (vocabCount === 0) {
        await db.vocabulary.bulkAdd(builtInVocabulary as any);
      }
    });

    if (needsReseed) {
      localStorage.setItem(DATA_VERSION_KEY, String(DATA_VERSION));
    }

    // 尝试从服务端同步
    const result = await syncCorpus();
    if (result.synced) {
      console.log(`Corpus synced to version ${result.version}`);
    } else {
      console.log('Using local corpus data (sync unavailable)');
    }
  } catch (e) {
    console.error('Failed to initialize database:', e);
  }
}
```

### 8.3 环境变量

```env
# .env（J-Say 前端）
VITE_API_BASE=http://localhost:3001/api
```

前端通过环境变量配置后端地址。未配置时不同步，纯本地模式运行。

---

## 9. 种子数据与初始化

### 9.1 从现有数据导入

```typescript
// server/src/db/seed.ts
import { db } from './index';
import { categories, topics, vocabularies } from './schema';

// 系统预置分类，与前端 TopicCategory 对齐
const SYSTEM_CATEGORIES = [
  { slug: 'person', nameZh: '人物', nameEn: 'Person', sortOrder: 1, isSystem: true },
  { slug: 'experience', nameZh: '经历', nameEn: 'Experience', sortOrder: 2, isSystem: true },
  { slug: 'place', nameZh: '地点', nameEn: 'Place', sortOrder: 3, isSystem: true },
  { slug: 'object', nameZh: '物品', nameEn: 'Object', sortOrder: 4, isSystem: true },
  { slug: 'event', nameZh: '事件', nameEn: 'Event', sortOrder: 5, isSystem: true },
  { slug: 'society', nameZh: '社会', nameEn: 'Society', sortOrder: 6, isSystem: true },
  { slug: 'daily', nameZh: '日常生活', nameEn: 'Daily Life', sortOrder: 7, isSystem: true },
  { slug: 'education', nameZh: '教育', nameEn: 'Education', sortOrder: 8, isSystem: true },
  { slug: 'technology', nameZh: '科技', nameEn: 'Technology', sortOrder: 9, isSystem: true },
  { slug: 'culture', nameZh: '文化', nameEn: 'Culture', sortOrder: 10, isSystem: true },
];

export async function seed() {
  // 插入分类
  for (const cat of SYSTEM_CATEGORIES) {
    await db.insert(categories).values(cat)
      .onConflictDoNothing({ target: categories.slug });
  }

  // 从 JSON 文件导入话题和词汇
  // 读取 admin/data/topics.json 和 admin/data/vocabulary.json
  // 这些文件从现有 src/data/ 目录转换生成
  // ...

  // 设置初始版本号
  await db.insert(systemConfig).values([
    { key: 'current_version', value: '1.0.0' },
    { key: 'import_limit', value: '5000' },
  ]).onConflictDoNothing({ target: systemConfig.key });

  console.log('Seed completed');
}
```

### 9.2 数据转换脚本

提供一个脚本将现有 `src/data/topics/` 和 `src/data/vocabulary.ts` 转换为服务端可导入的 JSON：

```bash
# 将前端内置数据导出为管理后台种子数据
npx tsx scripts/convert-data.ts
# 输出到 admin/data/topics.json 和 admin/data/vocabulary.json
```

---

## 10. 部署方案

### 10.1 Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin123}
      - DATABASE_PATH=/data/j-say-admin.db
      - CORS_ORIGINS=http://localhost:5173,http://localhost:5174
    volumes:
      - admin-data:/data
    restart: unless-stopped

  admin:
    build:
      context: ./admin
      dockerfile: Dockerfile
    ports:
      - "5174:80"
    environment:
      - VITE_API_BASE=http://localhost:3001/api
    depends_on:
      - server
    restart: unless-stopped

volumes:
  admin-data:
```

### 10.2 开发环境配置

```bash
# 启动后端
cd server && npm run dev    # http://localhost:3001

# 启动管理前端
cd admin && npm run dev     # http://localhost:5174

# 启动 J-Say 前端
cd . && npm run dev         # http://localhost:5173
```

---

## 11. 关键技术决策

### 11.1 为什么选择 Hono 而不是 Express

| 维度 | Express | Hono |
|------|---------|------|
| 类型安全 | 需要额外类型定义 | 内置 TypeScript 类型推断 |
| 中间件 | 回调式，需手动处理 async 错误 | 原生 async/await |
| 体积 | ~200KB | ~14KB |
| 运行时 | Node.js only | Node / Bun / Deno / Edge |
| 路由 | 需要额外库（express-router） | 内置，支持类型安全路由参数 |

### 11.2 为什么选择 Drizzle 而不是 Prisma

- **零生成步骤**：Drizzle schema 即类型，不需要 `prisma generate`
- **SQL 贴近度**：Drizzle API 更接近 SQL，复杂查询更直观
- **包体积**：Drizzle runtime ~100KB vs Prisma Client ~10MB
- **SQLite 支持**：Drizzle 对 SQLite 的 `better-sqlite3` 支持更原生
- **迁移**：Drizzle Kit 提供 `generate` 和 `migrate`，与 Prisma Migrate 体验相当

### 11.3 为什么不用 JWT

单用户系统，JWT 的无状态优势不明显。Cookie Session 方案更简单：
- 不需要 Refresh Token 机制
- 不需要客户端存储 Token
- 更容易实现「单设备登录」
- HttpOnly Cookie 防 XSS

### 11.4 同步策略选择

选择**全量同步**而非增量同步（基于 since 版本号）：
- 语料数据量小（话题 < 1000 条，词汇 < 500 条），全量传输成本低
- 全量同步逻辑简单，不易出 bug
- 避免增量同步的版本链依赖问题
- 后续数据量增长时再考虑增量

---

## 12. 开发规范

### 12.1 代码风格

- 缩进 2 空格（与 J-Say 项目一致）
- 优先 async/await
- 变量命名 camelCase
- 常量命名 UPPER_SNAKE_CASE
- 文件命名 kebab-case（服务端），PascalCase（React 组件）

### 12.2 Git 规范

- 分支命名：`feat/admin-topics`、`fix/sync-version`
- Commit 格式：`feat(admin): add topic list page`、`fix(server): fix import duplicate check`

### 12.3 API 命名规范

- 路径使用 kebab-case：`/api/audit-logs`
- 查询参数使用 camelCase：`?sortBy=updatedAt`
- 响应字段使用 camelCase：`{ publishedAt, relatedPart2Id }`