import {
  NotImplementedError,
  type ProviderStatus,
  type SpeakOptions,
  type SpeakResult,
  type TTSProvider,
  type VoiceMeta,
} from '../types';

/**
 * OpenAI TTS Provider (gpt-4o-mini-tts) — TODO: 待实现.
 *
 * 计划 (详见 docs/tts-research.md §2.1):
 *  - 支持自然语言指令控制语气 (instructions 字段)
 *  - 多语言, 性价比好 ($15 / 1M chars)
 *  - 局限: 单一模型多口音, 无法精确指定 en-GB vs en-AU,
 *          需通过 instructions 引导, 雅思场景下口音控制不稳, 优先级低于 Azure
 *  - 鉴权: 用户自带 Key
 *
 * 触发条件: 用户在 Settings 选择该 Provider 且填入 Key.
 */
export class OpenAITTSProvider implements TTSProvider {
  readonly id = 'openai' as const;
  readonly displayName = 'OpenAI TTS (TODO)';

  async probe(): Promise<ProviderStatus> {
    return { kind: 'unsupported', reason: 'TODO: 待实现' };
  }

  async preload(_onStatus?: (s: ProviderStatus) => void): Promise<void> {
    throw new NotImplementedError('openai.preload');
  }

  listVoices(): VoiceMeta[] {
    return [];
  }

  async synthesize(_text: string, _opts: SpeakOptions): Promise<SpeakResult> {
    throw new NotImplementedError('openai.synthesize');
  }

  async dispose(): Promise<void> {
    /* no-op */
  }
}
