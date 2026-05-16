import type { Accent, TTSProviderId } from '@/services/tts/types';

export type TTSPreloadStrategy = 'on-demand' | 'on-app-start' | 'manual';

/** 应用设置 */
export interface AppSettings {
  ttsAccent: Accent;
  ttsEnabled: boolean;
  /** 当前 TTS Provider; 默认 kokoro-webgpu, 探测失败由 Hook 自动落 web-speech */
  ttsProvider: TTSProviderId;
  /** 用户选定的 voice id; null 时按 accent 取 Provider 默认 */
  ttsVoiceId: string | null;
  /** 是否启用音频缓存 (Phase 3 启用) */
  ttsCacheEnabled: boolean;
  /** 缓存上限 (MB) */
  ttsCacheLimitMB: number;
  /** 模型预加载策略 */
  ttsPreloadStrategy: TTSPreloadStrategy;
  timerSoundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  topicsInitialized: boolean;
}