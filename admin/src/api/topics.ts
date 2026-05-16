import api from './client';
interface TopicQuery {
  page?: number; pageSize?: number; part?: 1|2|3; categoryId?: number;
  difficulty?: 'easy'|'medium'|'hard'; status?: 'draft'|'published'|'offline';
  keyword?: string; sortBy?: 'updatedAt'|'createdAt'; sortOrder?: 'asc'|'desc';
}
interface TopicCreateRequest {
  part: 1|2|3; categoryId: number; title: string; content: string;
  prompts?: string[]; questions: string[]; examples: Array<{simple:string;band7:string}>;
  part2Example?: {simple:string;band7:string}; relatedPart2Id?: number;
  difficulty: 'easy'|'medium'|'hard'; status?: 'draft'|'published';
}
interface TopicBatchRequest {
  action: 'delete'|'updateCategory'|'updateDifficulty'|'updateStatus'|'publish'|'offline';
  ids: number[]; data?: { categoryId?: number; difficulty?: 'easy'|'medium'|'hard'; status?: 'draft'|'published'|'offline' };
}

export const topicApi = {
  list: (query: TopicQuery) =>
    api.get('topics', { searchParams: query as Record<string, string | number> })
      .json<{ success: boolean; data: any[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(),

  getById: (id: number) =>
    api.get(`topics/${id}`).json<{ success: boolean; data: any }>(),

  create: (data: TopicCreateRequest) =>
    api.post('topics', { json: data }).json<{ success: boolean; data: any }>(),

  update: (id: number, data: Partial<TopicCreateRequest>) =>
    api.put(`topics/${id}`, { json: data }).json<{ success: boolean; data: any }>(),

  delete: (id: number) =>
    api.delete(`topics/${id}`).json<{ success: boolean }>(),

  batch: (data: TopicBatchRequest) =>
    api.post('topics/batch', { json: data }).json<{ success: boolean; data: { affected: number } }>(),

  updateStatus: (id: number, status: 'published' | 'offline') =>
    api.put(`topics/${id}/status`, { json: { status } }).json<{ success: boolean; data: any }>(),
};