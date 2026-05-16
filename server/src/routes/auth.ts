import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { db } from '../db/index';
import { systemConfig } from '../db/schema';
import { eq } from 'drizzle-orm';
import { config } from '../config';
import crypto from 'crypto';

const auth = new Hono();

auth.post('/login', async (c) => {
  const body = await c.req.json<{ password?: string }>();

  if (!body?.password || body.password !== config.adminPassword) {
    return c.json({ success: false, error: { code: 'INVALID_PASSWORD', message: '密码错误' } }, 401);
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + config.sessionMaxAge;

  await db.insert(systemConfig).values({
    key: `session_${token}`,
    value: String(expiresAt),
  }).onConflictDoUpdate({
    target: systemConfig.key,
    set: { value: String(expiresAt), updatedAt: new Date() },
  });

  setCookie(c, 'admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    maxAge: config.sessionMaxAge / 1000,
    path: '/',
  });

  return c.json({ success: true, data: { authenticated: true } });
});

auth.post('/logout', async (c) => {
  const { getCookie } = await import('hono/cookie');
  const token = getCookie(c, 'admin_session');

  if (token) {
    await db.delete(systemConfig).where(eq(systemConfig.key, `session_${token}`));
  }

  deleteCookie(c, 'admin_session', { path: '/' });
  return c.json({ success: true, data: { authenticated: false } });
});

auth.get('/me', async (c) => {
  const { getCookie } = await import('hono/cookie');
  const token = getCookie(c, 'admin_session');

  if (!token) {
    return c.json({ success: true, data: { authenticated: false } });
  }

  const session = await db.query.systemConfig.findFirst({
    where: eq(systemConfig.key, `session_${token}`),
  });

  if (!session || Date.now() > Number(session.value)) {
    return c.json({ success: true, data: { authenticated: false } });
  }

  return c.json({ success: true, data: { authenticated: true } });
});

export const authRoutes = auth;