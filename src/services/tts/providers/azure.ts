import {
  NotImplementedError,
  type ProviderStatus,
  type SpeakOptions,
  type SpeakResult,
  type TTSProvider,
  type VoiceMeta,
} from '../types';

/**
 * Microsoft Azure Speech (Neural TTS) Provider — TODO: 待实现.
 *
 * 计划 (详见 docs/tts-research.md §3.1, docs/tts-implementation.md §7):
 *  - 接入 Azure Speech REST/WebSocket API
 *  - 完整 SSML 支持: <break>, <prosody>, <mstts:express-as>
 *  - Voice 候选:
 *      en-GB: Sonia, Ryan
 *      en-US: Jenny, Aria, AndrewMultilingual
 *      en-IN: Neerja, Prabhat   (en-IN 主要靠这家)
 *      en-AU: Natasha, William  (en-AU 主要靠这家)
 *  - 鉴权: 用户自带 Key, IndexedDB 加密存储; 可选反代
 *  - 流式播放: MediaSource Extensions
 *
 * 触发条件: 用户在 Settings 选择该 Provider 且填入 Key.
 */
export class AzureTTSProvider implements TTSProvider {
  readonly id = 'azure' as const;
  readonly displayName = 'Microsoft Azure Speech (TODO)';

  async probe(): Promise<ProviderStatus> {
    return { kind: 'unsupported', reason: 'TODO: 待实现' };
  }

  async preload(_onStatus?: (s: ProviderStatus) => void): Promise<void> {
    throw new NotImplementedError('azure.preload');
  }

  listVoices(): VoiceMeta[] {
    return [];
  }

  async synthesize(_text: string, _opts: SpeakOptions): Promise<SpeakResult> {
    throw new NotImplementedError('azure.synthesize');
  }

  async dispose(): Promise<void> {
    /* no-op */
  }
}
