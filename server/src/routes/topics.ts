import { Hono } from 'hono';
import { topicService } from '../services/topicService';

interface TopicQuery {
  page?: number; pageSize?: number; part?: 1|2|3; categoryId?: number;
  difficulty?: 'easy'|'medium'|'hard'; status?: 'draft'|'published'|'offline';
  keyword?: string; sortBy?: 'updatedAt'|'createdAt'; sortOrder?: 'asc'|'desc';
}
interface TopicCreateRequest {
  part: 1|2|3; categoryId: number; title: string; content: string;
  prompts?: string[]; questions: string[]; examples: Array<{simple:string;band7:string}>;
  part2Example?: {simple:string;band7:string}; relatedPart2Id?: number;
  difficulty: 'easy'|'medium'|'hard'; status?: 'draft'|'published';
}
interface TopicBatchRequest {
  action: 'delete'|'updateCategory'|'updateDifficulty'|'updateStatus'|'publish'|'offline';
  ids: number[]; data?: { categoryId?: number; difficulty?: 'easy'|'medium'|'hard'; status?: 'draft'|'published'|'offline' };
}

const topics = new Hono();

// 话题列表
topics.get('/', async (c) => {
  const query: TopicQuery = {
    page: Number(c.req.query('page')) || 1,
    pageSize: Number(c.req.query('pageSize')) || 20,
    part: c.req.query('part') ? Number(c.req.query('part')) as 1 | 2 | 3 : undefined,
    categoryId: c.req.query('categoryId') ? Number(c.req.query('categoryId')) : undefined,
    difficulty: c.req.query('difficulty') as TopicQuery['difficulty'],
    status: c.req.query('status') as TopicQuery['status'],
    keyword: c.req.query('keyword') || undefined,
    sortBy: (c.req.query('sortBy') as TopicQuery['sortBy']) || 'updatedAt',
    sortOrder: (c.req.query('sortOrder') as TopicQuery['sortOrder']) || 'desc',
  };

  const result = await topicService.list(query);
  return c.json({ success: true, data: result.data, pagination: result.pagination });
});

// 话题详情
topics.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const topic = await topicService.getById(id);
  if (!topic) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '话题不存在' } }, 404);
  }
  return c.json({ success: true, data: topic });
});

// 创建话题
topics.post('/', async (c) => {
  const body = await c.req.json<TopicCreateRequest>();

  if (!body.part || !body.categoryId || !body.title || !body.content || !body.questions?.length || !body.difficulty) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '缺少必填字段' } }, 400);
  }

  const topic = await topicService.create(body);
  return c.json({ success: true, data: topic }, 201);
});

// 更新话题
topics.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<TopicCreateRequest>>();

  const topic = await topicService.update(id, body);
  if (!topic) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '话题不存在' } }, 404);
  }
  return c.json({ success: true, data: topic });
});

// 删除话题（软删除）
topics.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const deleted = await topicService.softDelete(id);
  if (!deleted) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '话题不存在' } }, 404);
  }
  return c.json({ success: true, data: null });
});

// 批量操作
topics.post('/batch', async (c) => {
  const body = await c.req.json<TopicBatchRequest>();
  if (!body.action || !body.ids?.length) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '缺少 action 或 ids' } }, 400);
  }
  const result = await topicService.batchAction(body);
  return c.json({ success: true, data: result });
});

// 更新状态
topics.put('/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ status: 'published' | 'offline' }>();

  if (!body.status || !['published', 'offline'].includes(body.status)) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '无效的状态值' } }, 400);
  }

  const topic = await topicService.updateStatus(id, body.status);
  if (!topic) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '话题不存在' } }, 404);
  }
  return c.json({ success: true, data: topic });
});

export const topicRoutes = topics;