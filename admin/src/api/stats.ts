import api from './client';

export const statsApi = {
  getOverview: () =>
    api.get('stats/overview').json<{ success: boolean; data: any }>(),
};