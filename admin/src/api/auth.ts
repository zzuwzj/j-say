import api from './client';

export const authApi = {
  login: (password: string) =>
    api.post('auth/login', { json: { password } }).json<{ success: boolean; data: { authenticated: boolean } }>(),

  logout: () =>
    api.post('auth/logout').json<{ success: boolean }>(),

  me: () =>
    api.get('auth/me').json<{ success: boolean; data: { authenticated: boolean } }>(),
};