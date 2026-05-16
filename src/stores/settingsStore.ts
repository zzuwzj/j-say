import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

const DEFAULT_SETTINGS: AppSettings = {
  ttsAccent: 'en-GB',
  ttsEnabled: true,
  ttsProvider: 'kokoro-webgpu',
  ttsVoiceId: null,
  ttsCacheEnabled: true,
  ttsCacheLimitMB: 200,
  ttsPreloadStrategy: 'on-demand',
  timerSoundEnabled: true,
  theme: 'system',
  topicsInitialized: false,
};

interface SettingsState extends AppSettings {
  updateSettings: (partial: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: (partial) => set(partial),
    }),
    { name: 'jsay-settings' },
  ),
);