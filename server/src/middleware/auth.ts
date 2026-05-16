import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { db } from '../db/index';
import { systemConfig } from '../db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config';

const SESSION_COOKIE = 'admin_session';

export const authMiddleware = createMiddleware(async (c, next) => {
  const sessionToken = getCookie(c, SESSION_COOKIE);
  if (!sessionToken) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: '未登录' } }, 401);
  }

  const session = await db.query.systemConfig.findFirst({
    where: eq(systemConfig.key, `session_${sessionToken}`),
  });

  if (!session) {
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: '会话已过期' } }, 401);
  }

  const expiresAt = Number(session.value);
  if (Date.now() > expiresAt) {
    await db.delete(systemConfig).where(eq(systemConfig.key, `session_${sessionToken}`));
    return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: '会话已过期' } }, 401);
  }

  await next();
});