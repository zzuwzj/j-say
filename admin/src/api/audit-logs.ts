import api from './client';

interface AuditLogQuery {
  page?: number;
  pageSize?: number;
  action?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

export const auditLogApi = {
  list: (query: AuditLogQuery) =>
    api.get('audit-logs', { searchParams: query as Record<string, string | number> })
      .json<{ success: boolean; data: any[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(),
};