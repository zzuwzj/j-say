import { Hono } from 'hono';
import { db } from '../db/index';
import { auditLogs } from '../db/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

export const auditLogRoutes = new Hono();

// GET /api/audit-logs
auditLogRoutes.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const action = c.req.query('action');
  const targetType = c.req.query('targetType');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');

  const conditions = [];
  if (action) conditions.push(eq(auditLogs.action, action));
  if (targetType) conditions.push(eq(auditLogs.targetType, targetType));
  if (startDate) conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(auditLogs.createdAt, new Date(endDate)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db.select().from(auditLogs)
      .where(where)
      .orderBy(desc(auditLogs.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)` }).from(auditLogs).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  return c.json({
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});