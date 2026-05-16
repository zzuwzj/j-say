import api from './client';

export const versionApi = {
  list: (page = 1, pageSize = 20) =>
    api.get('versions', { searchParams: { page, pageSize } })
      .json<{ success: boolean; data: any[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(),

  getById: (id: number) =>
    api.get(`versions/${id}`).json<{ success: boolean; data: any }>(),

  create: (data: { version: string; summary?: string }) =>
    api.post('versions', { json: data }).json<{ success: boolean; data: any }>(),

  publish: (id: number) =>
    api.post(`versions/${id}/publish`).json<{ success: boolean; data: any }>(),

  rollback: (id: number) =>
    api.post(`versions/${id}/rollback`).json<{ success: boolean; data: any }>(),

  diff: (fromId: number, toId: number) =>
    api.get(`versions/diff/${fromId}/${toId}`).json<{ success: boolean; data: any }>(),

  delete: (id: number) =>
    api.delete(`versions/${id}`).json<{ success: boolean }>(),
};