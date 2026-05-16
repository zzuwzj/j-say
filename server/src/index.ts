import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { topicRoutes } from './routes/topics';
import { vocabRoutes } from './routes/vocabularies';
import { categoryRoutes } from './routes/categories';
import { importExportRoutes } from './routes/import-export';
import { versionRoutes } from './routes/versions';
import { syncRoutes } from './routes/sync';
import { statsRoutes } from './routes/stats';
import { auditLogRoutes } from './routes/audit-logs';
import { configRoutes } from './routes/config';
import { authMiddleware } from './middleware/auth';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/error';
import { db } from './db/index';
import { sql } from 'drizzle-orm';

const app = new Hono();

// 全局中间件
app.use('*', cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use('*', requestLogger);

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// 公开路由
app.route('/api/auth', authRoutes);

// 需要认证的路由
app.use('/api/topics/*', authMiddleware);
app.use('/api/topics', authMiddleware);
app.use('/api/vocabularies/*', authMiddleware);
app.use('/api/vocabularies', authMiddleware);
app.use('/api/categories/*', authMiddleware);
app.use('/api/categories', authMiddleware);
app.use('/api/import/*', authMiddleware);
app.use('/api/import', authMiddleware);
app.use('/api/export/*', authMiddleware);
app.use('/api/export', authMiddleware);
app.use('/api/versions/*', authMiddleware);
app.use('/api/versions', authMiddleware);
app.use('/api/stats/*', authMiddleware);
app.use('/api/stats', authMiddleware);
app.use('/api/audit-logs/*', authMiddleware);
app.use('/api/audit-logs', authMiddleware);
app.use('/api/config/*', authMiddleware);
app.use('/api/config', authMiddleware);
app.route('/api/topics', topicRoutes);
app.route('/api/vocabularies', vocabRoutes);
app.route('/api/categories', categoryRoutes);
app.route('/api/import', importExportRoutes);
app.route('/api/export', importExportRoutes);
app.route('/api/versions', versionRoutes);
app.route('/api/stats', statsRoutes);
app.route('/api/audit-logs', auditLogRoutes);
app.route('/api/config', configRoutes);

// Sync routes - public (no auth, for client app)
app.route('/api/sync', syncRoutes);

// 错误处理
app.onError(errorHandler);

// 启动服务
const port = config.port;

// 初始化数据库表
async function initDatabase() {
  console.log('Initializing database...');

  // 创建表（如果不存在）
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name_zh TEXT NOT NULL,
      name_en TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      is_system INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part INTEGER NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      prompts TEXT NOT NULL DEFAULT '[]',
      questions TEXT NOT NULL,
      examples TEXT NOT NULL DEFAULT '[]',
      part2_example TEXT,
      related_part2_id INTEGER,
      difficulty TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      version INTEGER NOT NULL DEFAULT 1,
      published_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS vocabularies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      definition TEXT NOT NULL,
      example TEXT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      related_topic_ids TEXT NOT NULL DEFAULT '[]',
      is_custom INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS corpus_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL UNIQUE,
      summary TEXT,
      topic_count INTEGER NOT NULL,
      vocab_count INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unpublished',
      published_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      detail TEXT,
      created_at INTEGER NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  // 创建索引
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_topics_part ON topics(part)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_topics_difficulty ON topics(difficulty)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_topics_updated_at ON topics(updated_at)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_vocabularies_category ON vocabularies(category_id)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_vocabularies_word ON vocabularies(word)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_vocabularies_status ON vocabularies(status)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)`);
  await db.run(sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)`);

  console.log('Database initialized.');
}

initDatabase().then(() => {
  serve({ fetch: app.fetch, port }, (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;