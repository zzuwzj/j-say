import { Hono } from 'hono';
import { categoryService } from '../services/categoryService';

const categories = new Hono();

// 分类列表（含统计）
categories.get('/', async (c) => {
  const withStats = c.req.query('withStats') === 'true';
  const data = withStats ? await categoryService.listWithStats() : await categoryService.list();
  return c.json({ success: true, data });
});

// 分类详情
categories.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const cat = await categoryService.getById(id);
  if (!cat) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '分类不存在' } }, 404);
  }
  return c.json({ success: true, data: cat });
});

// 创建分类
categories.post('/', async (c) => {
  const body = await c.req.json<{ slug: string; nameZh: string; nameEn: string; sortOrder?: number; isSystem?: boolean }>();

  if (!body.slug || !body.nameZh || !body.nameEn) {
    return c.json({ success: false, error: { code: 'VALIDATION_ERROR', message: '缺少必填字段' } }, 400);
  }

  // 检查 slug 是否已存在
  const existing = await categoryService.getBySlug(body.slug);
  if (existing) {
    return c.json({ success: false, error: { code: 'DUPLICATE', message: '分类标识符已存在' } }, 409);
  }

  const cat = await categoryService.create(body);
  return c.json({ success: true, data: cat }, 201);
});

// 更新分类
categories.put('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const body = await c.req.json<Partial<{ nameZh: string; nameEn: string; sortOrder: number; enabled: boolean }>>();

  const cat = await categoryService.update(id, body);
  if (!cat) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: '分类不存在' } }, 404);
  }
  return c.json({ success: true, data: cat });
});

// 删除分类
categories.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const result = await categoryService.delete(id);

  if (!result.deleted) {
    if (result.reason === 'NOT_FOUND') {
      return c.json({ success: false, error: { code: 'NOT_FOUND', message: '分类不存在' } }, 404);
    }
    if (result.reason === 'SYSTEM_CATEGORY') {
      return c.json({ success: false, error: { code: 'FORBIDDEN', message: '系统预置分类不可删除' } }, 400);
    }
  }

  return c.json({ success: true, data: null });
});

export const categoryRoutes = categories;