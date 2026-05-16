import api from './client';

export const categoryApi = {
  list: (withStats = true) =>
    api.get('categories', { searchParams: withStats ? { withStats: 'true' } : {} })
      .json<{ success: boolean; data: any[] }>(),

  getById: (id: number) =>
    api.get(`categories/${id}`).json<{ success: boolean; data: any }>(),

  create: (data: { slug: string; nameZh: string; nameEn: string; sortOrder?: number }) =>
    api.post('categories', { json: data }).json<{ success: boolean; data: any }>(),

  update: (id: number, data: Partial<{ nameZh: string; nameEn: string; sortOrder: number; enabled: boolean }>) =>
    api.put(`categories/${id}`, { json: data }).json<{ success: boolean; data: any }>(),

  delete: (id: number) =>
    api.delete(`categories/${id}`).json<{ success: boolean }>(),
};