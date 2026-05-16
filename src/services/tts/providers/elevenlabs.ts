import {
  NotImplementedError,
  type ProviderStatus,
  type SpeakOptions,
  type SpeakResult,
  type TTSProvider,
  type VoiceMeta,
} from '../types';

/**
 * ElevenLabs Provider — TODO: 待实现.
 *
 * 计划 (详见 docs/tts-research.md §2.1):
 *  - 音质天花板, 情感表达最强
 *  - Turbo v2.5 / Flash v2.5 流式合成 (首包 ~75ms)
 *  - en-GB / en-US 覆盖好; en-AU / en-IN voice 较少
 *  - 适合作为"高级版"差异化体验
 *  - 鉴权: 用户自带 Key
 *
 * 触发条件: 用户在 Settings 选择该 Provider 且填入 Key.
 */
export class ElevenLabsTTSProvider implements TTSProvider {
  readonly id = 'elevenlabs' as const;
  readonly displayName = 'ElevenLabs (TODO)';

  async probe(): Promise<ProviderStatus> {
    return { kind: 'unsupported', reason: 'TODO: 待实现' };
  }

  async preload(_onStatus?: (s: ProviderStatus) => void): Promise<void> {
    throw new NotImplementedError('elevenlabs.preload');
  }

  listVoices(): VoiceMeta[] {
    return [];
  }

  async synthesize(_text: string, _opts: SpeakOptions): Promise<SpeakResult> {
    throw new NotImplementedError('elevenlabs.synthesize');
  }

  async dispose(): Promise<void> {
    /* no-op */
  }
}
