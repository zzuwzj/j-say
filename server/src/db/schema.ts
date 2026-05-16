import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  nameZh: text('name_zh').notNull(),
  nameEn: text('name_en').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const topics = sqliteTable('topics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  part: integer('part').notNull(),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  prompts: text('prompts', { mode: 'json' }).notNull().$defaultFn(() => []),
  questions: text('questions', { mode: 'json' }).notNull(),
  examples: text('examples', { mode: 'json' }).notNull().$defaultFn(() => []),
  part2Example: text('part2_example', { mode: 'json' }),
  relatedPart2Id: integer('related_part2_id'),
  difficulty: text('difficulty').notNull(),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const vocabularies = sqliteTable('vocabularies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  word: text('word').notNull(),
  definition: text('definition').notNull(),
  example: text('example'),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  relatedTopicIds: text('related_topic_ids', { mode: 'json' }).notNull().$defaultFn(() => []),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  status: text('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const corpusVersions = sqliteTable('corpus_versions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  version: text('version').notNull().unique(),
  summary: text('summary'),
  topicCount: integer('topic_count').notNull(),
  vocabCount: integer('vocab_count').notNull(),
  snapshot: text('snapshot', { mode: 'json' }).notNull(),
  status: text('status').notNull().default('unpublished'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: integer('target_id'),
  detail: text('detail', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const systemConfig = sqliteTable('system_config', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});