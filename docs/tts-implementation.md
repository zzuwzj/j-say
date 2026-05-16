# 模拟考官语音（TTS）技术方案

> 版本：v1.0 | 日期：2026-05-13
> 落地方向：**浏览器端推理（Kokoro-82M + Transformers.js + WebGPU）**
> 上游调研：[`tts-research.md`](./tts-research.md)

---

## 1. 文档说明

### 1.1 目的

本文档基于《模拟考官语音 TTS 优化方案调研》（`tts-research.md`），定义 J-Say 中
TTS 模块的工程落地方案。**主路径选定为浏览器端推理**：在用户本地、纯前端环境中运行
神经 TTS 模型，零后端、零密钥、零成本。

云端 Provider（Azure / ElevenLabs / OpenAI / Polly 等)与开源自部署 Provider
**只预留统一接口**，实现体留 `// TODO: 待实现`，便于未来按需补齐而无需重构。

### 1.2 与原调研的差异

调研文档将 Azure Speech 列为推荐主路径，浏览器端推理列为"未来差异化"。本方案**反转
该优先级**——以浏览器端推理为唯一首发实现，原因如下：

- 项目当前为**纯前端 SPA**，没有后端，引入云端 TTS 需要先建代理或要求用户填 Key，
  与"开箱即用"目标冲突
- 浏览器端推理无月成本、无配额风险，符合个人/开源项目定位
- 用户隐私不出本机（雅思练习涉及个人话题，云端方案有泄露顾虑）
- WebGPU 在主流浏览器（Chrome/Edge 113+、Safari 17.4+）已 GA，可作为生产路径
- 通过 Provider 抽象保留升级口子，未来要接 Azure/ElevenLabs 改动可控

### 1.3 范围

| 在范围内 | 不在范围内 |
|---------|-----------|
| Kokoro-82M 模型加载、推理、播放、缓存 | 后端代理/网关 |
| Web Speech API 兜底降级 | 云端 TTS Provider 实际实现 |
| Provider 抽象接口与工厂 | 声音克隆、自定义训练 |
| Settings 中的 voice 选择 UI | SSML 渲染（Kokoro 不支持） |
| 模型下载进度、错误恢复 | 移动端原生 App |

---

## 2. 总体架构

### 2.1 分层视图

```
┌────────────────────────────────────────────────────────────────┐
│                       Presentation Layer                        │
│         Practice 页 / Settings 页 / TTSTestButton 组件          │
└──────────────────────┬─────────────────────────────────────────┘
                       │
┌──────────────────────▼─────────────────────────────────────────┐
│              useSpeechSynthesis Hook (统一入口)                 │
│   speak(text, opts) / cancel() / preload() / isSpeaking         │
└──────────────────────┬─────────────────────────────────────────┘
                       │  dispatch by settings.ttsProvider
       ┌───────────────┼─────────────────┬──────────────────┐
       │               │                 │                  │
┌──────▼──────┐ ┌──────▼─────────┐ ┌─────▼──────┐ ┌────────▼────────┐
│ KokoroWebGPU│ │   WebSpeech    │ │   Azure    │ │   ElevenLabs    │
│  Provider   │ │   Provider     │ │  Provider  │ │    Provider     │
│  (主路径)   │ │   (兜底)       │ │ (TODO 预留)│ │   (TODO 预留)   │
└──────┬──────┘ └────────────────┘ └────────────┘ └─────────────────┘
       │
┌──────▼─────────────────────────────────────────────────────────┐
│             Web Worker（Kokoro 推理隔离线程）                    │
│   transformers.js + Kokoro-82M ONNX + WebGPU/WASM backend       │
└──────────┬──────────────────────────────────────────────────────┘
           │
┌──────────▼──────────────────────────────────────────────────────┐
│                  Infrastructure                                   │
│   AudioCacheRepo (IndexedDB 音频缓存)                            │
│   ModelCache (Cache Storage / OPFS, transformers.js 自带管理)    │
│   AudioContext / AudioBufferSourceNode (Web Audio API 播放)      │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流（speak 一次的完整路径）

```
Component.speak("Where are you from?")
   │
   ▼
useSpeechSynthesis.speak
   │
   ▼ 命中缓存？
   ├─ 是 → AudioCacheRepo.get(key) → AudioContext.play(blob) ──► 完成
   │
   └─ 否 ▼
        Provider.speak(text, voice)            （Provider = KokoroWebGPU）
           │
           ▼
        postMessage → Web Worker
           │
           ▼ 模型已加载？
           ├─ 否 → 下载/缓存 ONNX (~80MB)，发 progress 事件
           │
           ▼
        Kokoro 推理 → Float32 PCM @ 24kHz
           │
           ▼
        转 WAV Blob → postMessage 回主线程
           │
           ├─► AudioCacheRepo.put(key, blob)         （后台落库）
           │
           └─► AudioContext.decode → AudioBufferSourceNode.start()
                                                     │
                                                     ▼
                                                 onended → Hook 状态复位
```

### 2.3 模块依赖

```
hooks/useSpeechSynthesis  →  services/tts
services/tts/index        →  services/tts/providers/*
services/tts/providers/kokoro-webgpu →  services/tts/worker (postMessage)
services/tts/cache        →  db/audio-cache-repo  →  db/index (Dexie)
services/tts/worker       →  @huggingface/transformers (npm)
```

仍遵循《系分文档》3.2 的依赖规则：底层不反向依赖上层。

---

## 3. 模块设计

### 3.1 目录结构（新增部分）

```
src/
├── hooks/
│   └── useSpeechSynthesis.ts           # 改造为 Provider 调度入口
├── services/                           # 新增目录
│   └── tts/
│       ├── index.ts                    # Provider 工厂、统一导出
│       ├── types.ts                    # TTSProvider 接口、共享类型
│       ├── voices.ts                   # voice 元数据 + accent 映射
│       ├── cache.ts                    # 音频缓存封装（调用 db 层）
│       ├── providers/
│       │   ├── kokoro-webgpu.ts        # ★ 落地实现
│       │   ├── web-speech.ts           # 已有逻辑迁入
│       │   ├── azure.ts                # TODO 预留
│       │   ├── elevenlabs.ts           # TODO 预留
│       │   └── openai.ts               # TODO 预留
│       └── worker/
│           ├── kokoro.worker.ts        # Web Worker 入口
│           └── wav.ts                  # PCM → WAV 编码工具
├── db/
│   └── audio-cache-repo.ts             # 新增 Repo
└── components/
    └── shared/
        └── TTSPreloadIndicator.tsx     # 模型下载进度条
```

### 3.2 模块职责

| 模块 | 职责 | 不做什么 |
|------|------|---------|
| `useSpeechSynthesis` | 暴露给 UI 的稳定 Hook，按 settings 选择 Provider | 不直接做推理、不直接读 IndexedDB |
| `services/tts/index` | Provider 工厂；封装"先查缓存→再 Provider→再落库"流程 | 不持有播放状态 |
| `TTSProvider` 实现 | 把文本变成 `Blob` 或直接驱动播放 | 不管缓存、不管 UI |
| `kokoro.worker.ts` | 加载模型、执行推理、返回 PCM | 不接触 DOM、不接触 IndexedDB |
| `audio-cache-repo` | 音频 Blob 的 CRUD + LRU 清理 | 不感知 Provider 类型 |

---

## 4. 接口与类型设计

### 4.1 Provider 接口

```typescript
// src/services/tts/types.ts

export type Accent = 'en-GB' | 'en-US' | 'en-IN' | 'en-AU';

export type TTSProviderId =
  | 'kokoro-webgpu'   // 浏览器端推理（落地实现）
  | 'web-speech'      // Web Speech API（兜底）
  | 'azure'           // TODO: 待实现
  | 'elevenlabs'      // TODO: 待实现
  | 'openai';         // TODO: 待实现

/** Voice 元数据（不同 Provider 各自维护一份） */
export interface VoiceMeta {
  id: string;            // Provider 内部 voice id，如 "af_bella"
  label: string;         // 展示名，如 "Bella (US Female)"
  accent: Accent;
  gender: 'female' | 'male';
  /** 是否需要付费/外部资源 */
  premium?: boolean;
}

/** 单次合成请求 */
export interface SpeakOptions {
  /** 指定 voice id，若缺省由 Provider 按 accent 选默认 */
  voiceId?: string;
  /** 口音（用于 voice 选择 + 缓存键） */
  accent: Accent;
  /** 语速 0.5–2.0，默认 1.0 */
  rate?: number;
  /** 唯一标识，用于缓存键，缺省取 hash(text) */
  cacheKey?: string;
  /** 中断信号 */
  signal?: AbortSignal;
}

/** Provider 加载/可用性状态 */
export type ProviderStatus =
  | { kind: 'unsupported'; reason: string }   // 当前环境不支持（如无 WebGPU）
  | { kind: 'idle' }                           // 可用但未加载资源
  | { kind: 'loading'; progress: number }      // 0–1
  | { kind: 'ready' }
  | { kind: 'error'; error: Error };

/** 合成结果 */
export interface SpeakResult {
  /** 完整音频（用于落缓存） */
  blob: Blob;
  /** 时长（毫秒），未知则为 null */
  durationMs: number | null;
}

/** 统一 Provider 接口 */
export interface TTSProvider {
  readonly id: TTSProviderId;
  readonly displayName: string;

  /** 探测当前环境是否可用，不做副作用 */
  probe(): Promise<ProviderStatus>;

  /** 主动预加载（如下载模型）；UI 进度由 onStatus 推送 */
  preload(onStatus?: (s: ProviderStatus) => void): Promise<void>;

  /** 列出可用 voice */
  listVoices(): VoiceMeta[];

  /**
   * 合成并返回完整 Blob（不直接播放）。
   * 由上层 useSpeechSynthesis 统一负责播放与缓存写入。
   */
  synthesize(text: string, opts: SpeakOptions): Promise<SpeakResult>;

  /** 主动释放资源（切 Provider 时调用） */
  dispose(): Promise<void>;
}
```

> 设计要点：**Provider 只负责"文本 → Blob"**。播放与缓存由 Hook 层统一处理，确保
> 行为一致；这样未来增加云端 Provider 时，只需实现 `synthesize`，无需各自重写播放
> 与缓存逻辑。

### 4.2 Hook 对外接口（向后兼容）

```typescript
// src/hooks/useSpeechSynthesis.ts

interface UseSpeechSynthesisReturn {
  /** 兼容旧调用：speak(text) */
  speak: (text: string, accent?: Accent) => Promise<void>;
  cancel: () => void;
  preload: () => Promise<void>;       // 显式触发模型下载
  isSpeaking: boolean;
  /** 当前 Provider 加载状态（用于 UI 进度条） */
  providerStatus: ProviderStatus;
  accent: Accent;
  setAccent: (accent: Accent) => void;
}
```

调用方 `Practice` 页保持现有 `speak(question)` 写法即可，无需感知 Provider。

### 4.3 设置类型扩展

```typescript
// src/types/settings.ts

export interface AppSettings {
  ttsAccent: Accent;
  ttsEnabled: boolean;

  // —— 新增 ——
  /** 当前 Provider；默认 kokoro-webgpu，环境不支持时自动回落 web-speech */
  ttsProvider: TTSProviderId;
  /** 用户选定的 voice id（可空，按 accent 选默认） */
  ttsVoiceId: string | null;
  /** 是否启用音频缓存 */
  ttsCacheEnabled: boolean;
  /** 缓存上限，单位 MB */
  ttsCacheLimitMB: number;
  /** 模型预加载策略 */
  ttsPreloadStrategy: 'on-demand' | 'on-app-start' | 'manual';

  timerSoundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  topicsInitialized: boolean;
}
```

默认值：

```typescript
const DEFAULT_SETTINGS: AppSettings = {
  ttsAccent: 'en-GB',
  ttsEnabled: true,
  ttsProvider: 'kokoro-webgpu',
  ttsVoiceId: null,
  ttsCacheEnabled: true,
  ttsCacheLimitMB: 200,
  ttsPreloadStrategy: 'on-demand',
  timerSoundEnabled: true,
  theme: 'system',
  topicsInitialized: false,
};
```

---

## 5. 落地实现：Kokoro-82M Provider

### 5.1 技术选型

| 选项 | 决策 | 理由 |
|------|------|------|
| 模型 | **Kokoro-82M** (`onnx-community/Kokoro-82M-v1.0-ONNX`) | 同尺寸最佳音质；82M 参数 ≈ 80MB ONNX；MIT/Apache 兼容许可 |
| 推理库 | **`@huggingface/transformers` v3+** (即 transformers.js) | 官方支持 Kokoro pipeline；WebGPU 后端原生集成 |
| 后端 | **WebGPU（首选）→ WASM SIMD（降级）** | WebGPU 实测实时率 5x（M1 Mac）；WASM 实时率 ~1x，桌面勉强可用 |
| 执行环境 | **Web Worker** | 推理一次约 200–800ms，不能阻塞 UI 主线程 |
| 模型权重缓存 | transformers.js 内置 Cache Storage | 首次下载后命中浏览器缓存 |
| 音频解码 | **Web Audio API**（`AudioContext.decodeAudioData`） | 可拿到精确时长、支持 onended 事件 |

> 备选：onnxruntime-web 直接加载——更轻量但需要自行处理 phonemizer/分词/voice
> embedding，工程量翻倍。**不推荐**。

### 5.2 Voice 矩阵（Kokoro 1.0）

Kokoro 内置 voice id 命名规则：`{l}{g}_{name}`，l=`a`(US)/`b`(UK)，g=`f`/`m`。

| Accent | Voice ID | 性别 | 说明 |
|--------|----------|------|------|
| en-US | `af_bella` | F | 默认女声，温暖自然 |
| en-US | `af_heart` | F | 备选女声 |
| en-US | `am_adam` | M | 默认男声 |
| en-US | `am_michael` | M | 备选男声 |
| en-GB | `bf_emma` | F | 默认女声，BBC 风 |
| en-GB | `bf_isabella` | F | 备选女声 |
| en-GB | `bm_george` | M | 默认男声 |
| en-GB | `bm_lewis` | M | 备选男声 |
| en-IN | — | — | **Kokoro 不直接支持** → 自动回落 web-speech |
| en-AU | — | — | **Kokoro 不直接支持** → 自动回落 web-speech |

> 这是浏览器端推理路径的**已知能力边界**。en-IN/en-AU 的覆盖问题，留待后续接入
> Azure（en-IN-NeerjaNeural / en-AU-NatashaNeural）时一次性解决。Settings 中应在
> 用户选择 IN/AU 口音时显式提示"当前仅 Web Speech 可提供该口音"。

`voices.ts` 里同时维护 `accent → defaultVoiceId` 映射 + `accent → fallbackProviderId`
映射，由调度层使用：

```typescript
// src/services/tts/voices.ts

export const KOKORO_VOICES: VoiceMeta[] = [
  { id: 'af_bella',    label: 'Bella (US F)',    accent: 'en-US', gender: 'female' },
  { id: 'am_adam',     label: 'Adam (US M)',     accent: 'en-US', gender: 'male'   },
  { id: 'bf_emma',     label: 'Emma (UK F)',     accent: 'en-GB', gender: 'female' },
  { id: 'bm_george',   label: 'George (UK M)',   accent: 'en-GB', gender: 'male'   },
  // ... 其余 voice
];

export const KOKORO_SUPPORTED_ACCENTS: Accent[] = ['en-US', 'en-GB'];

export function pickKokoroDefaultVoice(accent: Accent): string | null {
  const list = KOKORO_VOICES.filter((v) => v.accent === accent);
  return list[0]?.id ?? null;
}
```

### 5.3 Worker 协议

主线程与 Worker 之间用结构化消息通信，所有消息带 `requestId` 关联请求。

```typescript
// src/services/tts/worker/protocol.ts

export type WorkerInbound =
  | { kind: 'init'; requestId: string; backend: 'webgpu' | 'wasm' }
  | { kind: 'synthesize'; requestId: string; text: string; voiceId: string; rate: number }
  | { kind: 'dispose'; requestId: string };

export type WorkerOutbound =
  | { kind: 'progress'; requestId: string; phase: 'download' | 'compile'; ratio: number }
  | { kind: 'ready';    requestId: string; backend: 'webgpu' | 'wasm' }
  | { kind: 'audio';    requestId: string; pcm: Float32Array; sampleRate: number }
  | { kind: 'error';    requestId: string; message: string; code: 'no-webgpu' | 'oom' | 'model-load' | 'inference' | 'unknown' };
```

PCM 通过 `postMessage` 的 `transferable` 移交所有权，避免大数组拷贝。

### 5.4 Worker 内部实现要点

```typescript
// src/services/tts/worker/kokoro.worker.ts （核心骨架）

import { KokoroTTS } from '@huggingface/transformers';

let tts: KokoroTTS | null = null;
let currentBackend: 'webgpu' | 'wasm' | null = null;

async function init(backend: 'webgpu' | 'wasm', requestId: string) {
  const dtype = backend === 'webgpu' ? 'fp32' : 'q8';   // WASM 用量化版减负
  tts = await KokoroTTS.from_pretrained(
    'onnx-community/Kokoro-82M-v1.0-ONNX',
    {
      dtype,
      device: backend,
      progress_callback: (p) => {
        if (p.status === 'progress') {
          self.postMessage({
            kind: 'progress', requestId,
            phase: 'download', ratio: p.progress / 100,
          });
        }
      },
    },
  );
  currentBackend = backend;
  self.postMessage({ kind: 'ready', requestId, backend });
}

async function synthesize(text: string, voiceId: string, rate: number, requestId: string) {
  if (!tts) throw new Error('TTS not initialized');
  const audio = await tts.generate(text, { voice: voiceId, speed: rate });
  // audio: { audio: Float32Array, sampling_rate: number }
  self.postMessage(
    {
      kind: 'audio', requestId,
      pcm: audio.audio,
      sampleRate: audio.sampling_rate,
    },
    [audio.audio.buffer],
  );
}

self.addEventListener('message', async (e: MessageEvent<WorkerInbound>) => {
  try {
    const msg = e.data;
    if (msg.kind === 'init')        await init(msg.backend, msg.requestId);
    if (msg.kind === 'synthesize')  await synthesize(msg.text, msg.voiceId, msg.rate, msg.requestId);
    if (msg.kind === 'dispose')     { tts = null; currentBackend = null; }
  } catch (err) {
    self.postMessage({
      kind: 'error',
      requestId: (e.data as any).requestId,
      message: (err as Error).message,
      code: classifyError(err),
    });
  }
});
```

### 5.5 Provider 实现骨架

```typescript
// src/services/tts/providers/kokoro-webgpu.ts

export class KokoroWebGPUProvider implements TTSProvider {
  readonly id = 'kokoro-webgpu' as const;
  readonly displayName = 'Kokoro (Local, WebGPU)';

  private worker: Worker | null = null;
  private status: ProviderStatus = { kind: 'idle' };
  private statusListeners = new Set<(s: ProviderStatus) => void>();
  private pending = new Map<string, { resolve: (r: SpeakResult) => void; reject: (e: Error) => void }>();

  async probe(): Promise<ProviderStatus> {
    if (typeof Worker === 'undefined') {
      return { kind: 'unsupported', reason: 'Web Worker 不可用' };
    }
    const hasWebGPU = 'gpu' in navigator;
    const hasWasm   = typeof WebAssembly !== 'undefined';
    if (!hasWebGPU && !hasWasm) {
      return { kind: 'unsupported', reason: '既无 WebGPU 也无 WASM 支持' };
    }
    return { kind: 'idle' };
  }

  async preload(onStatus?: (s: ProviderStatus) => void): Promise<void> {
    if (onStatus) this.statusListeners.add(onStatus);
    if (this.status.kind === 'ready') return;
    if (this.status.kind === 'loading') return;   // 复用进行中的加载
    await this.bootWorker();
  }

  listVoices(): VoiceMeta[] {
    return KOKORO_VOICES;
  }

  async synthesize(text: string, opts: SpeakOptions): Promise<SpeakResult> {
    await this.preload();
    const voiceId = opts.voiceId ?? pickKokoroDefaultVoice(opts.accent);
    if (!voiceId) {
      throw new TTSAccentNotSupportedError(opts.accent);  // 让上层切到 fallback Provider
    }
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      opts.signal?.addEventListener('abort', () => {
        this.pending.delete(requestId);
        reject(new DOMException('aborted', 'AbortError'));
      });
      this.worker!.postMessage({
        kind: 'synthesize', requestId,
        text, voiceId, rate: opts.rate ?? 1.0,
      });
    });
  }

  async dispose(): Promise<void> {
    this.worker?.terminate();
    this.worker = null;
    this.setStatus({ kind: 'idle' });
  }

  // 私有：bootWorker / handleMessage / setStatus / 错误 → 状态映射 略
}
```

### 5.6 PCM → WAV

Kokoro 输出 24kHz / 单通道 / Float32 PCM。播放前包成最小 WAV header（44 字节）即可让
`AudioContext.decodeAudioData` 直接解码并播放：

```typescript
// src/services/tts/worker/wav.ts
export function encodeWAV(pcm: Float32Array, sampleRate: number): Blob {
  // 标准 PCM16 WAV，参考实现略
}
```

> 选 WAV 而非 MP3/OGG：
> - 浏览器端编码 MP3 需引 lamejs（~30KB），收益不大
> - WAV 体积虽大（~1MB / 30s），但用户磁盘充足 + 缓存命中后零成本
> - 留作未来优化项

### 5.7 错误分类与处理

| 错误码 | 触发场景 | 上层处理 |
|--------|---------|---------|
| `no-webgpu` | 设备无 WebGPU | 自动重试 WASM 后端；都失败 → 切 web-speech |
| `oom` | 移动端低内存 OOM | 切 web-speech；记录设备指纹避免反复尝试 |
| `model-load` | 网络断、CDN 失败 | 重试 3 次（指数退避）→ 切 web-speech |
| `inference` | 推理过程异常（罕见） | 单次失败：当次切 web-speech；连续 3 次：永久切 web-speech 直到下次启动 |
| `accent-unsupported` | 用户选了 en-IN / en-AU | 当次切 web-speech，UI 提示"该口音暂用系统语音" |

错误处理由 `useSpeechSynthesis` 调度，**Provider 内部只抛错、不做切换决策**。

---

## 6. Web Speech 兜底 Provider

将现有 `useSpeechSynthesis.ts` 的 Web Speech 逻辑迁移到 `providers/web-speech.ts`，
实现同一接口。差异点：

- `synthesize` **不返回 Blob**：因为 Web Speech API 不暴露音频数据流；改为返回
  `{ blob: null, durationMs: null }`，上层据此跳过缓存写入
- 调度层在播放结束等待 `utterance.onend` 而非通过 AudioContext 播放
- 所有 Chrome 已知 bug 的 workaround（`resume()` 抑制 15s 暂停、强引用 utterance）原样保留

为统一播放路径，引入两种 synthesize 返回形态：

```typescript
export type SpeakResult =
  | { kind: 'blob'; blob: Blob; durationMs: number | null }
  | { kind: 'native'; play: () => Promise<void>; cancel: () => void };
```

`web-speech` 走 `kind: 'native'`，由 Hook 调用 `play()` 即可；`kokoro` 走 `kind: 'blob'`
进入缓存 + AudioContext 流程。

---

## 7. 待实现 Provider（接口预留）

每个云端 Provider 在 `providers/` 下放一个文件，骨架如下，**实现体抛
`NotImplementedError`**，TS 类型完整以便 UI 早期能列出 Provider 选项。

```typescript
// src/services/tts/providers/azure.ts

import type { TTSProvider, ProviderStatus, SpeakOptions, SpeakResult, VoiceMeta } from '../types';

/**
 * TODO: 待实现
 *
 * 计划方案（详见 tts-research.md §3.1）：
 *  - 接入 Microsoft Azure Speech Neural TTS REST/WS API
 *  - 支持完整 SSML：<break>、<prosody>、<mstts:express-as>
 *  - Voice 候选：Sonia/Ryan (en-GB), Jenny/Aria (en-US),
 *               Neerja/Prabhat (en-IN), Natasha/William (en-AU)
 *  - API Key 走"用户自带 Key"（IndexedDB 加密存储）+ 可选反代
 *  - 流式播放：MediaSource Extensions
 *
 * 触发条件：用户在 Settings 中选择该 Provider 且填入 Key
 */
export class AzureTTSProvider implements TTSProvider {
  readonly id = 'azure' as const;
  readonly displayName = 'Microsoft Azure Speech (TODO)';

  async probe(): Promise<ProviderStatus> {
    return { kind: 'unsupported', reason: 'TODO: 待实现' };
  }
  async preload(): Promise<void> { throw new NotImplementedError('azure.preload'); }
  listVoices(): VoiceMeta[] { return []; }
  async synthesize(_t: string, _o: SpeakOptions): Promise<SpeakResult> {
    throw new NotImplementedError('azure.synthesize');
  }
  async dispose(): Promise<void> { /* no-op */ }
}
```

`elevenlabs.ts` / `openai.ts` 同构，仅在 JSDoc 中描述各自规划与差异点。

工厂里登记但默认隐藏：

```typescript
// src/services/tts/index.ts

const REGISTRY: Record<TTSProviderId, () => TTSProvider> = {
  'kokoro-webgpu': () => new KokoroWebGPUProvider(),
  'web-speech':    () => new WebSpeechProvider(),
  'azure':         () => new AzureTTSProvider(),       // TODO
  'elevenlabs':    () => new ElevenLabsTTSProvider(),  // TODO
  'openai':        () => new OpenAITTSProvider(),      // TODO
};

export const AVAILABLE_PROVIDERS: TTSProviderId[] =
  import.meta.env.DEV
    ? Object.keys(REGISTRY) as TTSProviderId[]   // 开发态可见所有
    : ['kokoro-webgpu', 'web-speech'];           // 线上仅暴露已实现
```

UI 层据 `AVAILABLE_PROVIDERS` 渲染下拉，待实现项不展示给普通用户。

---

## 8. 缓存与持久化

### 8.1 IndexedDB Schema 扩展

在 `db/index.ts` 已有的 Dexie 中升级到版本 2，新增表：

```typescript
this.version(2).stores({
  // ... 既有表保持
  audioCache: '++id, &key, voice, accent, lastUsedAt, sizeBytes',
});
```

`&key` 唯一索引；`lastUsedAt` 用于 LRU。

```typescript
// src/types 中新增
export interface AudioCacheEntry {
  id: number;
  key: string;          // hash(text + voiceId + rate)
  blob: Blob;
  voice: string;
  accent: Accent;
  sizeBytes: number;
  createdAt: number;
  lastUsedAt: number;
}
```

### 8.2 Repo 接口

```typescript
// src/db/audio-cache-repo.ts

export const audioCacheRepo = {
  async get(key: string): Promise<Blob | null> {
    const row = await db.audioCache.where('key').equals(key).first();
    if (!row) return null;
    await db.audioCache.update(row.id, { lastUsedAt: Date.now() });
    return row.blob;
  },

  async put(entry: Omit<AudioCacheEntry, 'id' | 'createdAt' | 'lastUsedAt'>): Promise<void> {
    const now = Date.now();
    await db.audioCache.put({ ...entry, createdAt: now, lastUsedAt: now } as AudioCacheEntry);
    await this.evictIfNeeded();
  },

  /** LRU：超过 limit 时按 lastUsedAt 升序删 */
  async evictIfNeeded(): Promise<void> { /* ... */ },

  async totalSize(): Promise<number> { /* ... */ },

  async clear(): Promise<void> { await db.audioCache.clear(); },
};
```

### 8.3 缓存键生成

```typescript
function buildCacheKey(text: string, voiceId: string, rate: number): string {
  return `${voiceId}:${rate.toFixed(2)}:${sha1(text)}`;
}
```

文本变更（即使空格不同）→ key 不同 → 自动失效，无需手动清理。

### 8.4 模型权重缓存

transformers.js 默认走 Cache Storage，路径 `huggingface/...`。无需额外编码。容量约
80MB，浏览器配额内可永久驻留；用户清理浏览器数据时随之消失（可接受）。

UI 在 Settings 提供"清除模型缓存"按钮 → 通过 `caches.delete('transformers-cache')` 实现。

---

## 9. UI 集成

### 9.1 Settings 页改造

新增控件（沿用 Settings 现有列表样式）：

| 控件 | 绑定字段 | 说明 |
|------|---------|------|
| Provider 选择（下拉） | `ttsProvider` | 仅展示 `AVAILABLE_PROVIDERS` |
| Voice 选择（下拉） | `ttsVoiceId` | 由当前 Provider 的 `listVoices().filter(v => v.accent === ttsAccent)` 决定 |
| 「试听」按钮 | — | 调用 `speak("Hello, this is your IELTS examiner.")` |
| 预加载策略（下拉） | `ttsPreloadStrategy` | 三选一：按需 / 启动时 / 手动 |
| 「立即下载模型」按钮 | — | 调用 `provider.preload()`，旁置进度条 |
| 缓存开关 | `ttsCacheEnabled` | |
| 缓存上限（slider） | `ttsCacheLimitMB` | 50 / 100 / 200 / 500 MB |
| 「清除音频缓存」按钮 | — | `audioCacheRepo.clear()` |
| 「清除模型缓存」按钮 | — | 删除 transformers Cache Storage |
| 容量显示 | — | 实时显示 `audioCacheRepo.totalSize()` |

### 9.2 进度反馈组件

```typescript
// src/components/shared/TTSPreloadIndicator.tsx
// 监听 useSpeechSynthesis().providerStatus
// loading 时显示进度条；error 时显示重试按钮；ready 时不渲染
```

挂在 Practice 页顶部，确保用户在第一次开口前看到下载进度。

### 9.3 首次进入 Practice 的体验

| 场景 | 行为 |
|------|------|
| 已有模型缓存 | 静默 preload，无进度条；speak 几乎瞬时 |
| 首次进入 + 网络好 | 进度条 0–100%，约 5–15s（80MB / 5MB·s⁻¹ 估算）；下载中所有 speak 入队，模型 ready 后冲 |
| 首次进入 + WebGPU 不可用 | 切 WASM 后端：进度条 + 「使用慢速兼容模式」提示 |
| 首次进入 + 完全不支持 | 一次性 toast：「您的设备不支持本地 TTS，将使用系统语音」；切 web-speech |
| 用户选 en-IN / en-AU | 当次自动切 web-speech，UI 副标题提示「该口音由系统提供」 |

---

## 10. 性能与资源预算

### 10.1 关键指标目标

| 指标 | 目标 | 备注 |
|------|------|------|
| 模型首次下载 | ≤ 80MB | Kokoro-82M v1.0 ONNX (fp32) ~82MB；q8 量化版 ~25MB（WASM 后端用） |
| 内存占用 | ≤ 350MB（峰值） | WebGPU 后端约 250MB；WASM fp32 约 350MB |
| 首字延迟（已加载） | ≤ 300ms（桌面 WebGPU） | 实测 M1 ~150ms |
| 实时率 RTF | ≤ 0.3（桌面）/ ≤ 1.0（移动） | RTF=合成耗时/音频时长，越低越好 |
| 缓存命中响应 | ≤ 50ms | 仅含 IndexedDB 读 + decode |

### 10.2 移动端策略

- iOS Safari ≥ 17.4 才有 WebGPU；老设备直接 WASM
- 检测 `navigator.deviceMemory < 4`（GB）→ 默认推荐 web-speech，Settings 中给出
  「实验性本地 TTS（耗电较高）」开关而非默认开启
- 移动端模型不主动 preload，仅按需触发，避免后台流量消耗

### 10.3 Vite/打包注意事项

- transformers.js 体积大（~1MB gzipped），通过**动态 import** 隔离，仅在选中
  kokoro-webgpu 时才进入 bundle：

  ```typescript
  // providers/kokoro-webgpu.ts
  async function loadTransformers() {
    const mod = await import('@huggingface/transformers');
    return mod;
  }
  ```

- Worker 文件采用 Vite 的 `?worker` 语法：

  ```typescript
  import KokoroWorker from './worker/kokoro.worker.ts?worker';
  this.worker = new KokoroWorker();
  ```

- `vite.config.ts` 需配置：
  - `optimizeDeps.exclude: ['@huggingface/transformers']`（避免 dev 预构建死锁）
  - `worker.format: 'es'`
  - 跨域隔离 headers（`COOP: same-origin`、`COEP: require-corp`）若启用 SharedArrayBuffer
    加速 WASM；可选

---

## 11. 风险与降级矩阵

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| WebGPU 不支持 | 中（Firefox 桌面默认关，移动端老设备无） | 中 | WASM 后端 → web-speech 链式降级 |
| 模型下载失败 | 低（HF CDN 偶发慢） | 高（功能不可用） | 重试 3 次 + 镜像 CDN 备份（可选）+ web-speech 兜底 |
| 移动端 OOM | 中（中低端 Android） | 高 | 设备内存检测 + 默认不开启 + 一键切兜底 |
| 模型质量不及预期 | 低 | 中 | 通过试听让用户主动切 voice；保留 web-speech 选项 |
| en-IN / en-AU 无 voice | 100%（已知边界） | 中 | 自动用 web-speech 处理这两种口音；文档化告知 |
| 首次下载 80MB 流量 | 100% | 中 | 默认按需加载 + 进度条 + 文案显式告知；提供"在 WiFi 下预下载"选项 |
| Kokoro 输出错音/吞字（小模型局限） | 低-中 | 低 | 文档化为已知限制；支持用户在试听后切 web-speech |
| 题库更新后旧缓存失效 | 必然（文本 hash 变化） | 低 | 缓存键含 hash，自动失效；LRU 自动清理 |
| WAV 格式占用大 | 100% | 低 | LRU + 用户可见容量上限；后续可选压缩为 OPUS |

---

## 12. 测试策略

### 12.1 单元测试（vitest）

| 模块 | 用例 |
|------|------|
| `voices.ts` | accent → defaultVoiceId 正确；不支持的 accent 返回 null |
| `audio-cache-repo` | put/get/LRU/清空；命中刷新 lastUsedAt |
| `wav.ts` | PCM 编码后头部 44 字节正确；可被 AudioContext.decodeAudioData 解码 |
| `useSpeechSynthesis` | Provider 切换、缓存命中跳过 synthesize、错误时 fallback 切 web-speech |

### 12.2 Provider 探测测试

mock `navigator.gpu` / `WebAssembly` / `Worker`，覆盖：

- 全支持 → kokoro-webgpu
- 仅 WASM → kokoro-webgpu (WASM)
- 都不支持 → web-speech

### 12.3 集成手测（无法自动）

| 场景 | 通过标准 |
|------|---------|
| 桌面 Chrome 首次访问 | 模型下载进度可见；下载完后 speak < 500ms 出声 |
| 桌面 Chrome 二次访问 | 无下载，speak < 100ms 出声（缓存命中题目）/ < 500ms（新题） |
| Safari 17.4+ | 同 Chrome |
| Firefox 桌面 | 自动落 WASM 或 web-speech，体验降级但不报错 |
| 中端 Android Chrome | web-speech 默认开启，本地 TTS 可手动切换 |
| 切口音 en-IN | UI 提示，使用 web-speech，听感正常 |
| 断网播放已缓存题目 | 正常播放 |
| 断网播放新题目 | 报错并自动 fallback web-speech |

---

## 13. 实施路线（按 Phase 上线）

### Phase 1：抽接口 + Web Speech 重写（0.5 天）

- 新建 `services/tts` 目录与类型
- 把现有 Web Speech 逻辑搬到 `providers/web-speech.ts`
- 改造 `useSpeechSynthesis` 为 Provider 调度入口
- 行为对外不变；线上 Provider 仍是 web-speech
- 单测覆盖 Provider 工厂 + Hook 行为

### Phase 2：Kokoro + WebGPU 落地（2–3 天）

- 装 `@huggingface/transformers`
- Worker + Provider 实现
- Settings 页加 Provider/Voice 选择 + 试听
- Practice 页加预加载进度组件
- en-IN / en-AU → web-speech 自动 fallback
- 桌面 Chrome / Safari / Firefox 走通

### Phase 3：缓存与体验完善（1–2 天）

- 音频 IndexedDB 缓存 + LRU
- Settings 容量显示与清理
- 错误重试与降级链完善
- 移动端策略与文案
- 集成手测清单全过

### Phase 4：云端 Provider 实现（按需，未排期）

- 实现 Azure / ElevenLabs / OpenAI 中的某一个
- 接 SSML 渲染层
- 用户自带 Key 设置面板
- 不在本次发布范围内

---

## 14. 决策记录

| # | 决策 | 备选 | 理由 |
|---|------|------|------|
| D1 | 选浏览器端推理为主路径 | 调研推荐的 Azure Speech | 纯前端无后端、零成本、隐私不出本机；满足项目定位 |
| D2 | 用 Kokoro-82M 而非 Piper | Piper 更小但音质偏机械 | 同尺寸 Kokoro 音质显著领先；82MB 仍可接受 |
| D3 | 用 transformers.js 而非裸 onnxruntime-web | 后者更轻 | 前者带 KokoroTTS pipeline，省下 phonemizer/voice embedding 工作量 |
| D4 | Provider 接口返回 Blob 而非直接播放 | 各 Provider 自己播放 | 统一播放路径与缓存写入逻辑；Web Speech 用 `kind:'native'` 例外通道 |
| D5 | 推理放 Web Worker | 主线程同步 | 200ms+ 推理会卡 UI；Worker 无副作用 |
| D6 | en-IN / en-AU 继续用 web-speech | 全部强制 Kokoro | Kokoro 不支持这两种口音，硬转换会变美音误导用户 |
| D7 | 默认 `on-demand` 而非启动预加载 | `on-app-start` | 80MB 下载默认不应静默触发；用户可在 Settings 改 |
| D8 | WAV 编码而非 MP3 | MP3 更省空间 | 浏览器原生支持解码；LRU 已能控容量；省一个依赖 |
| D9 | 云端 Provider 仅留接口 | 与 Kokoro 同时上线 | 范围聚焦；保留升级口子 |
| D10 | Settings.ttsProvider 默认 `kokoro-webgpu` | 默认 `web-speech` 更保险 | 主路径声明；探测失败自动降级，对用户无感；`kokoro-webgpu` 不可用时 Hook 调度自动落 `web-speech` |

---

## 15. 附录

### 15.1 错误类型

```typescript
// src/services/tts/types.ts
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
```

### 15.2 调度伪代码

```typescript
// useSpeechSynthesis 内部 speak 调度
async function speak(text: string, accent: Accent) {
  const cacheKey = buildCacheKey(text, currentVoiceId, rate);
  if (settings.ttsCacheEnabled) {
    const blob = await audioCacheRepo.get(cacheKey);
    if (blob) return playBlob(blob);
  }

  let provider = factory.get(settings.ttsProvider);
  try {
    const result = await provider.synthesize(text, { accent, voiceId, rate, cacheKey });
    if (result.kind === 'blob') {
      if (settings.ttsCacheEnabled) {
        audioCacheRepo.put({ key: cacheKey, blob: result.blob, voice: voiceId, accent,
                              sizeBytes: result.blob.size }).catch(() => {});
      }
      return playBlob(result.blob);
    }
    return result.play();
  } catch (e) {
    if (e instanceof TTSAccentNotSupportedError ||
        e instanceof TTSModelLoadError) {
      // 当次切 fallback Provider，本次请求重试一次
      const fb = factory.get('web-speech');
      const r = await fb.synthesize(text, { accent, voiceId: undefined, rate });
      return r.kind === 'native' ? r.play() : playBlob(r.blob);
    }
    throw e;
  }
}
```

### 15.3 与现有代码的兼容性清单

| 调用点 | 改动 |
|--------|------|
| `Practice` 页 `speak(question)` | 无需改动（签名兼容） |
| Settings 页 accent 切换 | 无需改动 |
| 现有 `useSpeechSynthesis` 内部 | 整体替换，Web Speech 逻辑保留在 `providers/web-speech.ts` |
| `db/index.ts` | 升级到 version 2，新增 `audioCache` 表 |
| `types/settings.ts` | 新增 5 个字段（详见 §4.3） |
| `stores/settingsStore.ts` | 默认值扩展 |

### 15.4 参考资料

- 上游调研：[`tts-research.md`](./tts-research.md)
- 系分文档：[`technical-design.md`](./technical-design.md)
- Kokoro-82M：https://huggingface.co/hexgrad/Kokoro-82M
- ONNX 版本：https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
- Transformers.js：https://huggingface.co/docs/transformers.js
- WebGPU 浏览器支持：https://caniuse.com/webgpu
- Web Audio API：https://developer.mozilla.org/docs/Web/API/Web_Audio_API
