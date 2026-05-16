import { KokoroWebGPUProvider } from './providers/kokoro-webgpu';
import { WebSpeechProvider } from './providers/web-speech';
import { AzureTTSProvider } from './providers/azure';
import { ElevenLabsTTSProvider } from './providers/elevenlabs';
import { OpenAITTSProvider } from './providers/openai';
import type { TTSProvider, TTSProviderId } from './types';

type ProviderFactory = () => TTSProvider;

const REGISTRY: Record<TTSProviderId, ProviderFactory> = {
  'kokoro-webgpu': () => new KokoroWebGPUProvider(),
  'web-speech':    () => new WebSpeechProvider(),
  'azure':         () => new AzureTTSProvider(),
  'elevenlabs':    () => new ElevenLabsTTSProvider(),
  'openai':        () => new OpenAITTSProvider(),
};

/** Provider 单例缓存, 同一 id 复用实例以保持 Worker / 状态 */
const INSTANCES = new Map<TTSProviderId, TTSProvider>();

export function getProvider(id: TTSProviderId): TTSProvider {
  const cached = INSTANCES.get(id);
  if (cached) return cached;
  const factory = REGISTRY[id];
  const inst = factory();
  INSTANCES.set(id, inst);
  return inst;
}

/**
 * 当前可对用户暴露的 Provider 列表.
 * 待实现的云端 Provider 仅在开发态可见, 避免误选.
 */
export const AVAILABLE_PROVIDERS: ReadonlyArray<TTSProviderId> = import.meta.env.DEV
  ? (['kokoro-webgpu', 'web-speech', 'azure', 'elevenlabs', 'openai'] as TTSProviderId[])
  : (['kokoro-webgpu', 'web-speech'] as TTSProviderId[]);

export async function disposeAllProviders(): Promise<void> {
  await Promise.allSettled(Array.from(INSTANCES.values()).map((p) => p.dispose()));
  INSTANCES.clear();
}

export type {
  Accent,
  TTSProvider,
  TTSProviderId,
  VoiceMeta,
  SpeakOptions,
  SpeakResult,
  ProviderStatus,
} from './types';
export {
  NotImplementedError,
  TTSAccentNotSupportedError,
  TTSModelLoadError,
} from './types';
export { KOKORO_VOICES, KOKORO_SUPPORTED_ACCENTS, isKokoroAccentSupported } from './voices';
