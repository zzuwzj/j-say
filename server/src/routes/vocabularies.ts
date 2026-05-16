import { Hono } from 'hono';
import { vocabService } from '../services/vocabService';

interface VocabQuery {
  page?: number; pageSize?: number; categoryId?: number; keyword?: string;
  sortBy?: 'updatedAt'|'createdAt'|'word'; sortOrder?: 'asc'|'desc';
}
interface VocabCreateRequest {
  word: string; definition: string; example?: string; categoryId: number;
  relatedTopicIds?: number[]; status?: 'draft'|'published';
}
interface VocabBatchRequest {
  action: 'delete'|'updateCategory'; ids: number[]; data?: { categoryId?: number };
}

const vocabs = new Hono();

// 词汇列表
vocabs.get('/', async (c) => {
  const query: VocabQuery = {
    page: Number(c.req.query('page')) || 1,
    pageSize: Number(c.req.query('pageSize')) || 20,
    categoryId: c.req.query('categoryId') ? Number(c.req.query('categoryId')) : undefined,
    keyword: c.req.query('keyword') || undefined,
    sortBy: (c.req.query('sortBy') as VocabQuery['sortBy']) || 'updatedAt',
    sortOrder: (c.req.query('sortOrder') as VocabQuery['sortOrder']) || 'desc',
  };

  const result = await vocabService.list(query);
  return c.json({ success: true, data: result.data, pagination: result.pagination });
});

// 词汇详情
vocabs.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const vocab = await vocabService.getById(id);
  if (!vocab) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '词汇不存在' } }, 404);
  }
  return c.json({ success: true, data: vocab });
});

// 创建词汇
vocabs.post('/', async (c) => {
  const body = await c.req.json<VocabCreateRequest>();

  if (!body.word || !body.definition || !body.categoryId) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '缺少必填字段' } }, 400);
  }

  const vocab = await vocabService.create(body);
  return c.json({ success: true, data: vocab }, 201);
});

// 更新词汇
vocabs.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<VocabCreateRequest>>();

  const vocab = await vocabService.update(id, body);
  if (!vocab) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '词汇不存在' } }, 404);
  }
  return c.json({ success: true, data: vocab });
});

// 删除词汇（软删除）
vocabs.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const deleted = await vocabService.softDelete(id);
  if (!deleted) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '词汇不存在' } }, 404);
  }
  return c.json({ success: true, data: null });
});

// 批量操作
vocabs.post('/batch', async (c) => {
  const body = await c.req.json<VocabBatchRequest>();
  if (!body.action || !body.ids?.length) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '缺少 action 或 ids' } }, 400);
  }
  const result = await vocabService.batchAction(body);
  return c.json({ success: true, data: result });
});

// 更新状态
vocabs.put('/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ status: 'published' | 'offline' }>();

  if (!body.status || !['published', 'offline'].includes(body.status)) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '无效的状态值' } }, 400);
  }

  const vocab = await vocabService.updateStatus(id, body.status);
  if (!vocab) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '词汇不存在' } }, 404);
  }
  return c.json({ success: true, data: vocab });
});

export const vocabRoutes = vocabs;