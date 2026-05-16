import api from './client';
interface VocabQuery {
  page?: number; pageSize?: number; categoryId?: number; keyword?: string;
  sortBy?: 'updatedAt'|'createdAt'|'word'; sortOrder?: 'asc'|'desc';
}
interface VocabCreateRequest {
  word: string; definition: string; example?: string; categoryId: number;
  relatedTopicIds?: number[]; status?: 'draft'|'published';
}
interface VocabBatchRequest {
  action: 'delete'|'updateCategory'; ids: number[]; data?: { categoryId?: number };
}

export const vocabApi = {
  list: (query: VocabQuery) =>
    api.get('vocabularies', { searchParams: query as Record<string, string | number> })
      .json<{ success: boolean; data: any[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(),

  getById: (id: number) =>
    api.get(`vocabularies/${id}`).json<{ success: boolean; data: any }>(),

  create: (data: VocabCreateRequest) =>
    api.post('vocabularies', { json: data }).json<{ success: boolean; data: any }>(),

  update: (id: number, data: Partial<VocabCreateRequest>) =>
    api.put(`vocabularies/${id}`, { json: data }).json<{ success: boolean; data: any }>(),

  delete: (id: number) =>
    api.delete(`vocabularies/${id}`).json<{ success: boolean }>(),

  batch: (data: VocabBatchRequest) =>
    api.post('vocabularies/batch', { json: data }).json<{ success: boolean; data: { affected: number } }>(),

  updateStatus: (id: number, status: 'published' | 'offline') =>
    api.put(`vocabularies/${id}/status`, { json: { status } }).json<{ success: boolean; data: any }>(),
};