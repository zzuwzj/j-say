import { Hono } from 'hono';
import { versionService } from '../services/versionService';

export const versionRoutes = new Hono();

// GET /api/versions - List versions
versionRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const result = await versionService.list(page, pageSize);
  return c.json({ success: true, ...result });
});

// GET /api/versions/:id - Get version detail
versionRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const version = await versionService.getById(id);
  if (!version) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Version not found' } }, 404);
  }
  return c.json({ success: true, data: version });
});

// POST /api/versions - Create version
versionRoutes.post('/', async (c) => {
  const body = await c.req.json();
  if (!body.version) {
    return c.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Version string is required' } }, 400);
  }
  const version = await versionService.create(body);
  return c.json({ success: true, data: version }, 201);
});

// POST /api/versions/:id/publish - Publish version
versionRoutes.post('/:id/publish', async (c) => {
  const id = parseInt(c.req.param('id'));
  const result = await versionService.publish(id);
  if (!result) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Version not found' } }, 404);
  }
  return c.json({ success: true, data: result });
});

// POST /api/versions/:id/rollback - Rollback to version
versionRoutes.post('/:id/rollback', async (c) => {
  const id = parseInt(c.req.param('id'));
  const result = await versionService.rollback(id);
  if (!result) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Version not found or no snapshot' } }, 404);
  }
  return c.json({ success: true, data: result });
});

// GET /api/versions/diff?from=1&to=2 - Compare two versions
versionRoutes.get('/diff/:fromId/:toId', async (c) => {
  const fromId = parseInt(c.req.param('fromId'));
  const toId = parseInt(c.req.param('toId'));
  const result = await versionService.diff(fromId, toId);
  if (!result) {
    return c.json({ success: false, error: { code: 'NOT_FOUND', message: 'One or both versions not found' } }, 404);
  }
  return c.json({ success: true, data: result });
});

// DELETE /api/versions/:id - Delete version
versionRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const deleted = await versionService.delete(id);
  if (!deleted) {
    return c.json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete published version or version not found' } }, 400);
  }
  return c.json({ success: true });
});