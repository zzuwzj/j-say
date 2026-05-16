import type { Accent, VoiceMeta } from './types';

/**
 * Kokoro-82M v1.0 内置 voice.
 * 命名规则: {l}{g}_{name}, l=a(US)/b(UK), g=f/m
 * en-IN / en-AU 不在 Kokoro 覆盖范围内, 由调度层降级到 web-speech.
 */
export const KOKORO_VOICES: VoiceMeta[] = [
  { id: 'af_bella',    label: 'Bella (US F)',    accent: 'en-US', gender: 'female' },
  { id: 'af_heart',    label: 'Heart (US F)',    accent: 'en-US', gender: 'female' },
  { id: 'am_adam',     label: 'Adam (US M)',     accent: 'en-US', gender: 'male'   },
  { id: 'am_michael',  label: 'Michael (US M)',  accent: 'en-US', gender: 'male'   },
  { id: 'bf_emma',     label: 'Emma (UK F)',     accent: 'en-GB', gender: 'female' },
  { id: 'bf_isabella', label: 'Isabella (UK F)', accent: 'en-GB', gender: 'female' },
  { id: 'bm_george',   label: 'George (UK M)',   accent: 'en-GB', gender: 'male'   },
  { id: 'bm_lewis',    label: 'Lewis (UK M)',    accent: 'en-GB', gender: 'male'   },
];

export const KOKORO_SUPPORTED_ACCENTS: ReadonlyArray<Accent> = ['en-US', 'en-GB'];

export function pickKokoroDefaultVoice(accent: Accent): string | null {
  const matched = KOKORO_VOICES.find((v) => v.accent === accent);
  return matched?.id ?? null;
}

export function isKokoroAccentSupported(accent: Accent): boolean {
  return KOKORO_SUPPORTED_ACCENTS.includes(accent);
}
