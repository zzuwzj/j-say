import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { getProvider } from '@/services/tts';
import type {
  Accent,
  ProviderStatus,
  SpeakResult,
  TTSProvider,
  TTSProviderId,
} from '@/services/tts/types';
import {
  TTSAccentNotSupportedError,
  TTSModelLoadError,
} from '@/services/tts/types';

interface UseSpeechSynthesisReturn {
  /** 兼容旧签名: speak(text) 默认按 settings.ttsAccent */
  speak: (text: string, accent?: Accent) => Promise<void>;
  cancel: () => void;
  preload: () => Promise<void>;
  isSpeaking: boolean;
  /** 当前生效 Provider 的状态, UI 可据此显示进度条 */
  providerStatus: ProviderStatus;
  /** 当前生效 Provider id (可能因降级与 settings.ttsProvider 不同) */
  effectiveProviderId: TTSProviderId;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}

const FALLBACK_PROVIDER_ID: TTSProviderId = 'web-speech';

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const { ttsAccent, ttsEnabled, ttsProvider, ttsVoiceId, updateSettings } = useSettingsStore();

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>({ kind: 'idle' });
  const [effectiveProviderId, setEffectiveProviderId] = useState<TTSProviderId>(ttsProvider);

  /** 当前生效 Provider 实例 */
  const providerRef = useRef<TTSProvider>(getProvider(ttsProvider));
  /** 最近一次 speak 的播放控制器, 用于 cancel */
  const activeNativeRef = useRef<{ cancel: () => void } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Provider 切换: 按 settings.ttsProvider probe; 失败降级 web-speech
  useEffect(() => {
    let alive = true;
    const target = getProvider(ttsProvider);

    target.probe().then((status) => {
      if (!alive) return;
      if (status.kind === 'unsupported' || status.kind === 'error') {
        const fb = getProvider(FALLBACK_PROVIDER_ID);
        providerRef.current = fb;
        setEffectiveProviderId(FALLBACK_PROVIDER_ID);
        fb.probe().then((s) => {
          if (alive) setProviderStatus(s);
        });
        return;
      }
      providerRef.current = target;
      setEffectiveProviderId(ttsProvider);
      setProviderStatus(status);
    });

    return () => {
      alive = false;
    };
  }, [ttsProvider]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    activeNativeRef.current?.cancel();
    activeNativeRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text: string, accentOverride?: Accent) => {
      if (!ttsEnabled) return;
      if (!text) return;

      // 关键: 同步 cancel 上一次播放, 保留用户手势链
      activeNativeRef.current?.cancel();
      activeNativeRef.current = null;

      const accent = accentOverride ?? ttsAccent;
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const tryProvider = async (provider: TTSProvider): Promise<SpeakResult> => {
        return provider.synthesize(text, {
          accent,
          voiceId: ttsVoiceId ?? undefined,
          signal: ctrl.signal,
        });
      };

      let result: SpeakResult;
      try {
        result = await tryProvider(providerRef.current);
      } catch (e) {
        // 当前 Provider 不可用 → 当次降级 web-speech 重试一次
        if (
          e instanceof TTSAccentNotSupportedError ||
          e instanceof TTSModelLoadError ||
          // Phase 1 期间 Kokoro 抛 NotImplementedError, 也走兜底
          (e instanceof Error && e.name === 'NotImplementedError')
        ) {
          if (providerRef.current.id === FALLBACK_PROVIDER_ID) throw e;
          const fb = getProvider(FALLBACK_PROVIDER_ID);
          result = await tryProvider(fb);
        } else {
          throw e;
        }
      }

      setIsSpeaking(true);
      try {
        if (result.kind === 'native') {
          activeNativeRef.current = { cancel: result.cancel };
          await result.play();
        } else {
          // Phase 3 实现 blob 播放与缓存写入; Phase 1 不应进到此分支
          throw new Error('blob playback not yet implemented (Phase 3)');
        }
      } finally {
        setIsSpeaking(false);
        activeNativeRef.current = null;
      }
    },
    [ttsEnabled, ttsAccent, ttsVoiceId],
  );

  const preload = useCallback(async () => {
    await providerRef.current.preload((s) => setProviderStatus(s));
  }, []);

  const setAccent = useCallback(
    (accent: Accent) => {
      updateSettings({ ttsAccent: accent });
    },
    [updateSettings],
  );

  // 卸载时停止播放
  useEffect(() => {
    return () => {
      activeNativeRef.current?.cancel();
      abortRef.current?.abort();
    };
  }, []);

  return {
    speak,
    cancel,
    preload,
    isSpeaking,
    providerStatus,
    effectiveProviderId,
    accent: ttsAccent,
    setAccent,
  };
}

export type { Accent } from '@/services/tts/types';
