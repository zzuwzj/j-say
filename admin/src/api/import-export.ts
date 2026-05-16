import api from './client';

export const importExportApi = {
  preview: (data: {
    topics?: any[];
    vocabularies?: any[];
  }) =>
    api.post('import/preview', { json: data }).json<{ success: boolean; data: any }>(),

  execute: (data: {
    topics?: any[];
    vocabularies?: any[];
  }, strategy: 'skip' | 'overwrite' | 'keep_both' = 'skip') =>
    api.post('import/execute', { json: { data, strategy } }).json<{ success: boolean; data: any }>(),

  exportData: (params?: {
    status?: 'draft' | 'published' | 'offline';
    part?: 1 | 2 | 3;
    categoryId?: number;
  }) =>
    api.get('export', { searchParams: params as Record<string, string | number> }).json<{ success: boolean; data: any }>(),
};