import { Hono } from 'hono';
import { importService } from '../services/importService';
import { exportService } from '../services/exportService';

export const importExportRoutes = new Hono();

// POST /api/import/preview - Preview import data
importExportRoutes.post('/preview', async (c) => {
  const body = await c.req.json();
  const result = await importService.preview(body);
  return c.json({ success: true, data: result });
});

// POST /api/import/execute - Execute import
importExportRoutes.post('/execute', async (c) => {
  const { data, strategy = 'skip' } = await c.req.json();
  if (!data) {
    return c.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Missing import data' } }, 400);
  }
  const result = await importService.execute(data, strategy);
  return c.json({ success: true, data: result });
});

// GET /api/export - Export data
importExportRoutes.get('/', async (c) => {
  const status = c.req.query('status') as 'draft' | 'published' | 'offline' | undefined;
  const part = c.req.query('part') ? parseInt(c.req.query('part')!) as 1 | 2 | 3 : undefined;
  const categoryId = c.req.query('categoryId') ? parseInt(c.req.query('categoryId')!) : undefined;

  const result = await exportService.exportData({ status, part, categoryId });
  return c.json({ success: true, data: result });
});