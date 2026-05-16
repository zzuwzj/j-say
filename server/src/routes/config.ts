import { Hono } from 'hono';
import { db } from '../db/index';
import { systemConfig } from '../db/schema';
import { eq } from 'drizzle-orm';

export const configRoutes = new Hono();

// GET /api/config
configRoutes.get('/', async (c) => {
  const configs = await db.select().from(systemConfig);
  const configMap: Record<string, string> = {};
  for (const c of configs) {
    configMap[c.key] = c.value;
  }
  return c.json({
    success: true,
    data: {
      currentVersion: configMap.current_version ?? '',
      adminPassword: configMap.admin_password ? '******' : '',
      importLimit: parseInt(configMap.import_limit || '5000', 10),
    },
  });
});

// PUT /api/config
configRoutes.put('/', async (c) => {
  const body = await c.req.json();
  const updatableKeys = ['current_version', 'import_limit'];

  for (const [key, value] of Object.entries(body)) {
    if (!updatableKeys.includes(key)) continue;
    const existing = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
    if (existing.length > 0) {
      await db.update(systemConfig).set({ value: String(value), updatedAt: new Date() }).where(eq(systemConfig.key, key));
    } else {
      await db.insert(systemConfig).values({ key, value: String(value), updatedAt: new Date() });
    }
  }

  return c.json({ success: true });
});