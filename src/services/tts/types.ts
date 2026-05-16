export type Accent = 'en-GB' | 'en-US' | 'en-IN' | 'en-AU';

export type TTSProviderId =
  | 'kokoro-webgpu'
  | 'web-speech'
  | 'azure'
  | 'elevenlabs'
  | 'openai';

export interface VoiceMeta {
  id: string;
  label: string;
  accent: Accent;
  gender: 'female' | 'male';
  premium?: boolean;
}

export interface SpeakOptions {
  voiceId?: string;
  accent: Accent;
  rate?: number;
  cacheKey?: string;
  signal?: AbortSignal;
}

export type ProviderStatus =
  | { kind: 'unsupported'; reason: string }
  | { kind: 'idle' }
  | { kind: 'loading'; progress: number }
  | { kind: 'ready' }
  | { kind: 'error'; error: Error };

/**
 * 合成结果有两种形态:
 * - blob: Provider 返回完整音频, 由调度层负责播放与缓存写入
 * - native: Provider 自己控制播放 (Web Speech API 不暴露音频流, 走此分支)
 */
export type SpeakResult =
  | { kind: 'blob'; blob: Blob; durationMs: number | null }
  | { kind: 'native'; play: () => Promise<void>; cancel: () => void };

export interface TTSProvider {
  readonly id: TTSProviderId;
  readonly displayName: string;

  probe(): Promise<ProviderStatus>;
  preload(onStatus?: (s: ProviderStatus) => void): Promise<void>;
  listVoices(): VoiceMeta[];
  synthesize(text: string, opts: SpeakOptions): Promise<SpeakResult>;
  dispose(): Promise<void>;
}

export class NotImplementedError extends Error {
  constructor(method: string) {
    super(`TTS method not implemented: ${method}`);
    this.name = 'NotImplementedError';
  }
}

export class TTSAccentNotSupportedError extends Error {
  constructor(public readonly accent: Accent) {
    super(`Accent not supported by current provider: ${accent}`);
    this.name = 'TTSAccentNotSupportedError';
  }
}

export class TTSModelLoadError extends Error {
  constructor(public readonly cause: unknown) {
    super('Failed to load TTS model');
    this.name = 'TTSModelLoadError';
  }
}
