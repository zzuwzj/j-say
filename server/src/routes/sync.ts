import { Hono } from 'hono';
import { syncService } from '../services/syncService';

export const syncRoutes = new Hono();

// GET /api/sync/version - Get current corpus version
syncRoutes.get('/version', async (c) => {
  const version = await syncService.getVersion();
  return c.json({ success: true, data: { version } });
});

// GET /api/sync/data - Get all published data for client sync
syncRoutes.get('/data', async (c) => {
  const data = await syncService.getSyncData();
  return c.json({ success: true, data });
});