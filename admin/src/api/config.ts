import api from './client';

export const configApi = {
  get: () =>
    api.get('config').json<{ success: boolean; data: any }>(),

  update: (data: Record<string, any>) =>
    api.put('config', { json: data }).json<{ success: boolean }>(),
};