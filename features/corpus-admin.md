# Feature 计划：语料库后台管理系统

> 版本：v1.0 | 日期：2026-05-15
> 技术方案：[`corpus-admin-technical-design.md`](../docs/corpus-admin-technical-design.md)
> 需求文档：[`corpus-admin-requirements.md`](../docs/corpus-admin-requirements.md)

---

## 1. 目标

为 J-Say 构建语料库后台管理系统，实现话题/词汇的在线 CRUD、导入导出、版本发布与客户端同步，替代现有硬编码 JSON 语料维护方式。

## 2. 架构概览

```
admin/ (React + Ant Design, port 5174)  ←→  server/ (Hono + Drizzle + SQLite, port 3001)
                                              ↕ sync API
                                         src/ (现有 J-Say 前端, port 5173)
shared/types/ (共享类型定义)
```

## 3. Phase 规划

| Phase | 内容 | 预估工期 | 依赖 |
|-------|------|---------|------|
| Phase 1 | 后端基础框架 + 话题管理 | 4 天 | 无 |
| Phase 2 | 词汇管理 + 分类管理 | 2 天 | Phase 1 |
| Phase 3 | 管理前端基础框架 + 话题/词汇页面 | 4 天 | Phase 1, Phase 2 |
| Phase 4 | 导入导出 + 版本管理 + 客户端同步 | 3 天 | Phase 3 |
| Phase 5 | 统计 + 操作日志 + 系统配置 | 2 天 | Phase 3 |
| Phase 6 | 联调 + 优化 + 部署 | 2 天 | Phase 1–5 |

---

## Phase 1：后端基础框架 + 话题管理

**目标**：搭建后端服务骨架，完成话题完整 CRUD + 列表筛选排序 + 软删除 + 操作日志。

### 任务清单

| ID | 任务 | 产物 | 验收标准 |
|----|------|------|---------|
| P1-T1 | 初始化 server 项目 | `server/package.json`, `server/tsconfig.json`, `server/vite.config.ts` | `npm run dev` 启动，Hono 返回 health check |
| P1-T2 | 配置 Drizzle + SQLite | `server/src/db/index.ts`, `server/src/db/schema.ts`, `server/drizzle.config.ts` | `npx drizzle-kit generate` 生成迁移，`npx drizzle-kit migrate` 执行成功 |
| P1-T3 | 编写 Schema：categories, topics, vocabularies, corpusVersions, auditLogs, systemConfig | `server/src/db/schema.ts` | 6 张表定义完整，类型推导正确 |
| P1-T4 | 种子数据脚本 | `server/src/db/seed.ts` | 10 个系统分类 + 现有话题/词汇数据导入成功 |
| P1-T5 | 数据转换脚本 | `scripts/convert-data.ts` | 从 `src/data/topics/*.ts` 和 `src/data/vocabulary.ts` 导出为 JSON |
| P1-T6 | 认证中间件 | `server/src/middleware/auth.ts`, `server/src/routes/auth.ts` | 简单密码登录 → Cookie Session，未认证请求返回 401 |
| P1-T7 | 错误处理中间件 | `server/src/middleware/error.ts`, `server/src/middleware/logger.ts` | 统一错误响应格式，请求日志输出 |
| P1-T8 | 话题 CRUD 路由 | `server/src/routes/topics.ts`, `server/src/services/topicService.ts` | GET/POST/PUT/DELETE /api/topics 全部通过 |
| P1-T9 | 话题列表筛选排序+分页 | `topicService.list()` | part/category/difficulty/status/keyword 筛选 + 分页 + 排序 |
| P1-T10 | 话题批量操作 | `topicService.batchAction()` | 批量删除/修改分类/修改难度/修改状态/发布/下架 |
| P1-T11 | 话题状态变更 | `topicService.updateStatus()` | 草稿→发布、发布→下架、下架→草稿 |
| P1-T12 | 操作日志自动记录 | `auditLogs` 表写入 | 话题 create/update/delete/publish/offline 自动写日志 |
| P1-T13 | 路由注册 + 入口文件 | `server/src/index.ts` | 所有已实现路由注册，CORS 配置正确 |

### 新增文件

```
server/
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── src/
    ├── index.ts
    ├── config.ts
    ├── db/
    │   ├── index.ts
    │   ├── schema.ts
    │   └── seed.ts
    ├── middleware/
    │   ├── auth.ts
    │   ├── error.ts
    │   └── logger.ts
    ├── routes/
    │   ├── auth.ts
    │   └── topics.ts
    └── services/
        └── topicService.ts

scripts/
└── convert-data.ts
```

### 出口验收

- [ ] `npm run dev` 启动后端，health check 返回 200
- [ ] POST /api/auth/login 登录成功，Set-Cookie 返回 session
- [ ] GET /api/topics 未认证返回 401
- [ ] GET /api/topics 认证后返回分页数据
- [ ] POST /api/topics 创建话题，返回 201
- [ ] PUT /api/topics/:id 更新话题，version +1
- [ ] DELETE /api/topics/:id 软删除，deletedAt 非空
- [ ] POST /api/topics/batch 批量操作正常
- [ ] PUT /api/topics/:id/status 状态变更正常
- [ ] audit_logs 表有对应记录

---

## Phase 2：词汇管理 + 分类管理

**目标**：完成词汇 CRUD、分类 CRUD，复用 Phase 1 的框架模式。

### 任务清单

| ID | 任务 | 产物 | 验收标准 |
|----|------|------|---------|
| P2-T1 | 词汇 CRUD 路由 | `server/src/routes/vocabularies.ts`, `server/src/services/vocabService.ts` | GET/POST/PUT/DELETE /api/vocabularies 全部通过 |
| P2-T2 | 词汇列表筛选+分页 | `vocabService.list()` | category/keyword 筛选 + 分页 + 排序 |
| P2-T3 | 词汇批量操作 | `vocabService.batchAction()` | 批量删除/修改分类 |
| P2-T4 | 分类 CRUD 路由 | `server/src/routes/categories.ts`, `server/src/services/categoryService.ts` | GET/POST/PUT/DELETE /api/categories 全部通过 |
| P2-T5 | 分类统计 | `categoryService.listWithStats()` | 每个分类返回 topicCount 和 vocabCount |
| P2-T6 | 系统分类保护 | `categoryService.delete()` | isSystem=true 的分类禁止删除，返回 400 |

### 新增文件

```
server/src/
├── routes/
│   ├── vocabularies.ts
│   └── categories.ts
└── services/
    ├── vocabService.ts
    └── categoryService.ts
```

### 出口验收

- [ ] 词汇 CRUD + 列表筛选 + 批量操作正常
- [ ] 分类 CRUD + 统计正常
- [ ] 系统分类不可删除
- [ ] 操作日志自动记录

---

## Phase 3：管理前端基础框架 + 话题/词汇页面

**目标**：搭建管理前端项目，完成话题管理、词汇管理、分类管理的完整页面。

### 任务清单

| ID | 任务 | 产物 | 验收标准 |
|----|------|------|---------|
| P3-T1 | 初始化 admin 项目 | `admin/package.json`, `admin/vite.config.ts`, `admin/tsconfig.json` | `npm run dev` 启动，Ant Design 渲染正常 |
| P3-T2 | API 客户端封装 | `admin/src/api/client.ts` | ky 实例，统一处理认证、错误、基础路径 |
| P3-T3 | 话题/词汇/分类 API 封装 | `admin/src/api/topics.ts`, `admin/src/api/vocabularies.ts`, `admin/src/api/categories.ts` | 所有 API 调用函数类型安全 |
| P3-T4 | 共享类型包初始化 | `shared/types/` 目录 + 导出 | 话题、词汇、分类、API 类型定义，前后端共用 |
| P3-T5 | 认证状态管理 | `admin/src/stores/authStore.ts` | Zustand store，登录/登出/认证检查 |
| P3-T6 | 布局组件 | `admin/src/components/layout/AdminLayout.tsx`, `Sidebar.tsx` | 侧边栏导航 + 主内容区，未登录跳转登录页 |
| P3-T7 | 登录页 | `admin/src/pages/Login/LoginPage.tsx` | 密码输入 → 调用 API → 设置 Cookie → 跳转首页 |
| P3-T8 | 仪表盘页 | `admin/src/pages/Dashboard/DashboardPage.tsx` | 语料总览统计卡片（话题数、词汇数、分类数） |
| P3-T9 | 话题列表页 | `admin/src/pages/Topics/TopicListPage.tsx` | 表格 + 筛选 + 分页 + 排序 + 批量操作 |
| P3-T10 | 话题编辑页 | `admin/src/pages/Topics/TopicEditPage.tsx`, `TopicForm.tsx`, `QuestionEditor.tsx`, `ExampleEditor.tsx` | 创建/编辑话题，Part 2/3 动态字段，保存草稿/发布 |
| P3-T11 | 话题详情页 | `admin/src/pages/Topics/TopicDetailPage.tsx` | 展示话题完整信息 + 状态切换 |
| P3-T12 | 词汇列表页 | `admin/src/pages/Vocabularies/VocabListPage.tsx` | 表格 + 筛选 + 分页 + 批量操作 |
| P3-T13 | 词汇编辑页 | `admin/src/pages/Vocabularies/VocabEditPage.tsx`, `VocabForm.tsx` | 创建/编辑词汇，关联话题多选 |
| P3-T14 | 词汇详情页 | `admin/src/pages/Vocabularies/VocabDetailPage.tsx` | 展示词汇完整信息 |
| P3-T15 | 分类管理页 | `admin/src/pages/Categories/CategoryPage.tsx` | 分类列表 + 内联编辑 + 排序 + 禁用/启用 |
| P3-T16 | 路由配置 | `admin/src/App.tsx` | 所有页面路由注册，认证守卫 |

### 新增文件

```
admin/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/
    │   ├── client.ts
    │   ├── topics.ts
    │   ├── vocabularies.ts
    │   ├── categories.ts
    │   ├── auth.ts
    │   └── types.ts
    ├── stores/
    │   └── authStore.ts
    ├── components/
    │   ├── layout/
    │   │   ├── AdminLayout.tsx
    │   │   └── Sidebar.tsx
    │   ├── topic/
    │   │   ├── TopicForm.tsx
    │   │   ├── QuestionEditor.tsx
    │   │   └── ExampleEditor.tsx
    │   ├── vocab/
    │   │   └── VocabForm.tsx
    │   └── shared/
    │       ├── StatusTag.tsx
    │       └── BatchActions.tsx
    ├── pages/
    │   ├── Login/
    │   │   └── LoginPage.tsx
    │   ├── Dashboard/
    │   │   └── DashboardPage.tsx
    │   ├── Topics/
    │   │   ├── TopicListPage.tsx
    │   │   ├── TopicEditPage.tsx
    │   │   └── TopicDetailPage.tsx
    │   ├── Vocabularies/
    │   │   ├── VocabListPage.tsx
    │   │   ├── VocabEditPage.tsx
    │   │   └── VocabDetailPage.tsx
    │   └── Categories/
    │       └── CategoryPage.tsx
    └── types/
        └── index.ts

shared/
└── types/
    ├── topic.ts
    ├── vocabulary.ts
    ├── category.ts
    ├── api.ts
    └── index.ts
```

### 出口验收

- [ ] 管理前端启动正常，登录后进入仪表盘
- [ ] 话题列表：筛选、分页、排序、批量操作正常
- [ ] 话题创建/编辑：Part 2/3 动态字段显隐正确，保存草稿/发布正常
- [ ] 话题详情：信息展示完整，状态切换正常
- [ ] 词汇列表/创建/编辑/详情正常
- [ ] 分类管理：CRUD + 统计 + 系统分类保护正常
- [ ] 未登录访问自动跳转登录页

---

## Phase 4：导入导出 + 版本管理 + 客户端同步

**目标**：完成语料导入导出、版本快照/发布/回滚、前端应用同步集成。

### 任务清单

| ID | 任务 | 产物 | 验收标准 |
|----|------|------|---------|
| P4-T1 | 导入预览 API | `server/src/routes/import-export.ts`, `server/src/services/importService.ts` | POST /api/import/preview 返回校验结果和重复统计 |
| P4-T2 | 导入执行 API | `importService.execute()` | 支持 skip/overwrite/keep_both 三种策略，写入成功 |
| P4-T3 | 导出 API | `server/src/services/exportService.ts` | GET /api/export 按条件导出 JSON，格式与前端兼容 |
| P4-T4 | 导入导出页面 | `admin/src/pages/ImportExport/ImportExportPage.tsx` | 上传文件→预览→选择策略→执行，导出按条件下载 |
| P4-T5 | 版本创建 API | `server/src/routes/versions.ts`, `server/src/services/versionService.ts` | POST /api/versions 快照已发布语料，存入 snapshot 字段 |
| P4-T6 | 版本发布/回滚 API | `versionService.publish()`, `versionService.rollback()` | 发布更新 current_version 配置，回滚从快照恢复 |
| P4-T7 | 版本对比 API | `versionService.diff()` | 返回两个版本间话题/词汇的增删改详情 |
| P4-T8 | 版本管理页面 | `admin/src/pages/Versions/VersionPage.tsx` | 版本列表 + 创建 + 发布 + 回滚 + 对比 |
| P4-T9 | 客户端同步 API | `server/src/routes/sync.ts`, `server/src/services/syncService.ts` | GET /api/sync/version + /topics + /vocabularies 返回已发布数据 |
| P4-T10 | 前端同步服务 | `src/services/sync.ts` | 启动时检查版本，拉取数据写入 IndexedDB |
| P4-T11 | 修改 db/init.ts | `src/db/init.ts` | 集成同步逻辑，服务不可达时降级使用本地数据 |
| P4-T12 | 环境变量配置 | `.env.example` | VITE_API_BASE 配置，未配置时纯本地模式 |

### 新增/修改文件

```
# 新增
server/src/
├── routes/
│   ├── import-export.ts
│   ├── versions.ts
│   └── sync.ts
└── services/
    ├── importService.ts
    ├── exportService.ts
    ├── versionService.ts
    └── syncService.ts

admin/src/
├── api/
│   ├── import-export.ts
│   └── versions.ts
└── pages/
    ├── ImportExport/ImportExportPage.tsx
    └── Versions/VersionPage.tsx

src/services/sync.ts
.env.example

# 修改
src/db/init.ts          # 集成同步逻辑
```

### 出口验收

- [ ] 上传 JSON 文件 → 预览显示总数/新增/重复/无效 → 选择策略 → 导入成功
- [ ] 按条件导出 JSON，格式与 `src/data/` 兼容
- [ ] 创建版本 → 快照当前已发布语料
- [ ] 发布版本 → current_version 更新
- [ ] 回滚版本 → 语料恢复到快照状态
- [ ] 版本对比显示增删改详情
- [ ] J-Say 前端启动时自动同步，IndexedDB 数据更新
- [ ] 后端不可达时，前端降级使用本地数据，不阻塞使用

---

## Phase 5：统计 + 操作日志 + 系统配置

**目标**：完成数据统计、操作日志查看、系统配置管理。

### 任务清单

| ID | 任务 | 产物 | 验收标准 |
|----|------|------|---------|
| P5-T1 | 统计 API | `server/src/routes/stats.ts`, `server/src/services/statsService.ts` | GET /api/stats/overview 返回语料分布统计 |
| P5-T2 | 统计页面 | `admin/src/pages/Stats/StatsPage.tsx`, `admin/src/api/stats.ts` | 话题/词汇分布图表、新增趋势、完成度指标 |
| P5-T3 | 操作日志 API | `server/src/routes/audit-logs.ts` | GET /api/audit-logs 分页 + 筛选 |
| P5-T4 | 操作日志页面 | `admin/src/pages/Logs/AuditLogPage.tsx`, `admin/src/api/audit-logs.ts` | 日志列表 + 按类型/时间筛选 |
| P5-T5 | 系统配置 API | `server/src/routes/config.ts` | GET/PUT /api/config 读写配置 |
| P5-T6 | 仪表盘增强 | `admin/src/pages/Dashboard/DashboardPage.tsx` | 集成统计 API 数据，展示核心指标 |

### 新增文件

```
server/src/
├── routes/
│   ├── stats.ts
│   └── audit-logs.ts
└── services/
    └── statsService.ts

admin/src/
├── api/
│   ├── stats.ts
│   ├── audit-logs.ts
│   └── config.ts
└── pages/
    ├── Stats/StatsPage.tsx
    └── Logs/AuditLogPage.tsx
```

### 出口验收

- [ ] 统计页面正确展示话题/词汇分布、新增趋势
- [ ] 操作日志列表正常，筛选功能正常
- [ ] 仪表盘展示实时统计数据

---

## Phase 6：联调 + 优化 + 部署

**目标**：端到端联调、性能优化、Docker 部署配置。

### 任务清单

| ID | 任务 | 产物 | 验收标准 |
|----|------|------|---------|
| P6-T1 | 全流程联调 | — | 从管理后台创建话题→发布→版本→J-Say 前端同步 全链路通过 |
| P6-T2 | 话题完整性检查 | `server/src/utils/validation.ts` | 创建/编辑时校验必填字段、示例覆盖率 |
| P6-T3 | Docker 配置 | `server/Dockerfile`, `admin/Dockerfile`, `docker-compose.yml` | docker compose up 一键启动 |
| P6-T4 | npm workspaces 配置 | 根 `package.json` workspaces | 根目录 npm install 安装所有子包 |
| P6-T5 | 生产构建优化 | Vite 配置、服务端构建 | admin 构建产物 < 500KB gzip，server 构建正常 |
| P6-T6 | 错误处理完善 | — | 所有 API 错误返回友好信息，前端全局错误提示 |

### 新增文件

```
server/Dockerfile
admin/Dockerfile
docker-compose.yml
```

### 出口验收

- [ ] 管理后台创建话题 → 发布 → 创建版本 → J-Say 前端同步看到新话题
- [ ] 管理后台导入 JSON → 数据正确写入
- [ ] 管理后台导出 JSON → 格式与前端兼容
- [ ] docker compose up 三服务正常启动
- [ ] 前端不同步场景（VITE_API_BASE 未配置）正常使用本地数据

---

## 4. 依赖关系

```
Phase 1 (后端框架+话题)
    │
    ├── Phase 2 (词汇+分类) ──┐
    │                         │
    └── Phase 3 (管理前端) ───┤
                              │
                              ├── Phase 4 (导入导出+版本+同步)
                              │
                              ├── Phase 5 (统计+日志+配置)
                              │
                              └── Phase 6 (联调+部署)
```

Phase 1 是所有后续 Phase 的基础。Phase 2 和 Phase 3 可并行。Phase 4、5、6 依赖 Phase 3 完成。

## 5. 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| Drizzle + SQLite 组合不够熟悉 | Phase 1 优先验证 Schema + 迁移 + 查询，有问题早发现 |
| 前端同步数据格式不兼容 | Phase 4-T10 优先验证，用现有数据做端到端测试 |
| Ant Design 5 与 React 19 兼容性 | Phase 3-T1 初始化时验证，必要时降级 React 或锁定 Ant Design 版本 |
| 导入大文件性能 | Phase 4-T2 使用流式解析，限制单次 5000 条 |
| 版本快照数据量 | snapshot 字段用 JSON 压缩，定期清理旧版本 |

## 6. 共享类型规范

`shared/types/` 目录下的类型定义由前后端共同引用：

```typescript
// shared/types/api.ts — API 请求/响应通用类型
export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: { code: string; message: string };
}
```

后端通过 `tsconfig paths` 或 workspace 依赖引用 `@shared/types`，前端同理。

## 7. 开发环境启动顺序

```bash
# 1. 安装依赖
npm install                    # 根目录，workspaces 自动安装

# 2. 启动后端
cd server && npm run dev       # http://localhost:3001

# 3. 初始化数据库 + 种子数据
cd server && npm run seed

# 4. 启动管理前端
cd admin && npm run dev        # http://localhost:5174

# 5. 启动 J-Say 前端（可选，测试同步）
npm run dev                    # http://localhost:5173
```