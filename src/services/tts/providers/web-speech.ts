import type {
  ProviderStatus,
  SpeakOptions,
  SpeakResult,
  TTSProvider,
  VoiceMeta,
  Accent,
} from '../types';

/**
 * Web Speech API Provider.
 * 浏览器原生 TTS, 作为兜底路径与 en-IN/en-AU 等 Kokoro 不覆盖口音的退路.
 *
 * 已知 Chrome bug 处理:
 *  1. utterance 可能在 speak 前被 GC, 需保持强引用
 *  2. 长文本 ~15s 后会自动暂停, 用 resume() 抑制
 *  3. cancel() / speak() 必须同步调用以保留用户手势链
 */
export class WebSpeechProvider implements TTSProvider {
  readonly id = 'web-speech' as const;
  readonly displayName = 'System Voice (Web Speech API)';

  /** 强引用最近一次 utterance, 防止 Chrome 在 speak 前 GC */
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  async probe(): Promise<ProviderStatus> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return { kind: 'unsupported', reason: '当前环境无 Web Speech API' };
    }
    return { kind: 'ready' };
  }

  async preload(onStatus?: (s: ProviderStatus) => void): Promise<void> {
    onStatus?.({ kind: 'loading', progress: 0 });

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onStatus?.({ kind: 'unsupported', reason: '当前环境无 Web Speech API' });
      return;
    }

    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      onStatus?.({ kind: 'ready' });
      return;
    }

    await new Promise<void>((resolve) => {
      const handler = () => {
        synth.removeEventListener('voiceschanged', handler);
        resolve();
      };
      synth.addEventListener('voiceschanged', handler);
      // 兜底: 部分浏览器不触发 voiceschanged
      setTimeout(() => {
        synth.removeEventListener('voiceschanged', handler);
        resolve();
      }, 1500);
    });

    onStatus?.({ kind: 'ready' });
  }

  listVoices(): VoiceMeta[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    return window.speechSynthesis.getVoices().map(systemVoiceToMeta);
  }

  async synthesize(text: string, opts: SpeakOptions): Promise<SpeakResult> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      throw new Error('Web Speech API not available');
    }

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = opts.accent;
    utterance.rate = opts.rate ?? 0.9;

    const voice = pickVoice(synth.getVoices(), opts);
    if (voice) utterance.voice = voice;

    return {
      kind: 'native',
      play: () =>
        new Promise<void>((resolve, reject) => {
          this.currentUtterance = utterance;

          const cleanup = () => {
            if (this.currentUtterance === utterance) {
              this.currentUtterance = null;
            }
          };

          utterance.onend = () => {
            cleanup();
            resolve();
          };
          utterance.onerror = (e) => {
            cleanup();
            // cancel 触发的 interrupted/canceled 视为正常结束
            if (e.error === 'interrupted' || e.error === 'canceled') {
              resolve();
            } else {
              reject(new Error(`Web Speech error: ${e.error}`));
            }
          };

          if (opts.signal?.aborted) {
            cleanup();
            resolve();
            return;
          }
          opts.signal?.addEventListener('abort', () => {
            synth.cancel();
          });

          // 必须同步: 先 cancel 再 speak, 否则 Chrome 偶发哑音
          synth.cancel();
          synth.speak(utterance);
          // 抑制 ~15s 自动暂停
          synth.resume();
        }),
      cancel: () => {
        synth.cancel();
        this.currentUtterance = null;
      },
    };
  }

  async dispose(): Promise<void> {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
  }
}

function systemVoiceToMeta(v: SpeechSynthesisVoice): VoiceMeta {
  const accent = (isAccent(v.lang) ? v.lang : 'en-US') as Accent;
  return {
    id: v.voiceURI,
    label: v.name,
    accent,
    gender: 'female', // Web Speech API 不暴露性别, 占位为 female
  };
}

function isAccent(lang: string): lang is Accent {
  return lang === 'en-GB' || lang === 'en-US' || lang === 'en-IN' || lang === 'en-AU';
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  opts: SpeakOptions,
): SpeechSynthesisVoice | null {
  if (opts.voiceId) {
    const byId = voices.find((v) => v.voiceURI === opts.voiceId);
    if (byId) return byId;
  }
  const exact = voices.find((v) => v.lang === opts.accent);
  if (exact) return exact;
  const langPrefix = opts.accent.split('-')[0] ?? '';
  const fuzzy = voices.find((v) => v.lang.startsWith(langPrefix));
  return fuzzy ?? null;
}
