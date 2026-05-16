import { create } from 'zustand';
import { authApi } from '../api/auth';

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  check: () => Promise<void>;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  authenticated: false,
  loading: true,

  check: async () => {
    try {
      const res = await authApi.me();
      set({ authenticated: res.data?.authenticated ?? false, loading: false });
    } catch {
      set({ authenticated: false, loading: false });
    }
  },

  login: async (password: string) => {
    try {
      const res = await authApi.login(password);
      const ok = res.data?.authenticated ?? false;
      set({ authenticated: ok });
      return ok;
    } catch {
      return false;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ authenticated: false });
    }
  },
}));