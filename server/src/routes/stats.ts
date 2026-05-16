import { Hono } from 'hono';
import { statsService } from '../services/statsService';

export const statsRoutes = new Hono();

// GET /api/stats/overview
statsRoutes.get('/overview', async (c) => {
  const data = await statsService.getOverview();
  return c.json({ success: true, data });
});