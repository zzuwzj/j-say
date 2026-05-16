import {
  NotImplementedError,
  type ProviderStatus,
  type SpeakOptions,
  type SpeakResult,
  type TTSProvider,
  type VoiceMeta,
} from '../types';
import { KOKORO_VOICES } from '../voices';

/**
 * Kokoro-82M + WebGPU 浏览器端推理 Provider.
 *
 * 当前阶段 (Phase 1): 仅返回骨架, probe 报 unsupported,
 * 调度层会自动落到 web-speech.
 *
 * Phase 2 计划:
 *  - probe(): 检测 Worker + (navigator.gpu || WebAssembly), backend 选择 webgpu/wasm
 *  - preload(): 启动 Worker, 加载 onnx-community/Kokoro-82M-v1.0-ONNX (~80MB),
 *               progress_callback 推 progress 事件
 *  - synthesize(): postMessage → Worker → KokoroTTS.generate → Float32 PCM →
 *                  encodeWAV → resolve { kind: 'blob' }
 *  - dispose(): Worker.terminate()
 *
 * 详见 docs/tts-implementation.md §5.
 */
export class KokoroWebGPUProvider implements TTSProvider {
  readonly id = 'kokoro-webgpu' as const;
  readonly displayName = 'Kokoro (Local, WebGPU)';

  async probe(): Promise<ProviderStatus> {
    return { kind: 'unsupported', reason: 'Phase 2 待实现' };
  }

  async preload(_onStatus?: (s: ProviderStatus) => void): Promise<void> {
    throw new NotImplementedError('kokoro-webgpu.preload');
  }

  listVoices(): VoiceMeta[] {
    return KOKORO_VOICES;
  }

  async synthesize(_text: string, _opts: SpeakOptions): Promise<SpeakResult> {
    throw new NotImplementedError('kokoro-webgpu.synthesize');
  }

  async dispose(): Promise<void> {
    /* no-op until Phase 2 */
  }
}
