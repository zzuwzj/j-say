# 开发计划：浏览器端 TTS（Kokoro-82M + WebGPU）

> 版本：v1.0 | 日期：2026-05-13
> 上游：[`docs/tts-implementation.md`](../docs/tts-implementation.md)
> 调研：[`docs/tts-research.md`](../docs/tts-research.md)

---

## 0. 计划概览

### 0.1 目标

把模拟考官语音从 Web Speech API 切换到 **本地神经 TTS（Kokoro-82M + Transformers.js + WebGPU）**，
保留 Web Speech 作为兜底；同时铺好 Provider 抽象，为未来接入 Azure/ElevenLabs/OpenAI
留位，但本期**不实现**云端 Provider。

### 0.2 范围

| 在范围内 | 不在范围内 |
|---------|-----------|
| TTSProvider 接口、工厂、调度 | 云端 Provider 实际实现（仅留骨架） |
| Kokoro Worker 推理 + WebGPU/WASM 降级 | 后端代理 / API Key 管理 UI |
| Web Speech 兜底（迁移自现有代码） | SSML 渲染层 |
| IndexedDB 音频缓存 + LRU | 题库预热（提前生成全题缓存） |
| Settings 新增控件 | 移动端原生壳 |
| 模型预加载进度组件 | 声音克隆 / 自定义模型 |

### 0.3 工期估算

| Phase | 工作量 | 关键产物 |
|-------|--------|---------|
| Phase 1：抽接口 + Web Speech 重写 | 0.5 天 | Provider 抽象就绪，行为对外不变 |
| Phase 2：Kokoro WebGPU 落地 | 2–3 天 | 桌面 Chrome/Safari 可用本地 TTS |
| Phase 3：缓存与体验完善 | 1–2 天 | 缓存命中、降级链、移动端策略 |
| Phase 4：联调与集成手测 | 0.5–1 天 | 集成手测清单全过 |
| **合计** | **4–6.5 天** | |

云端 Provider 实现单独排期，本计划不含。

### 0.4 验收总标准

- 桌面 Chrome / Edge / Safari 17.4+ 上，本地 TTS 默认开启，模型下载后 speak 首字 < 500ms
- 不支持 WebGPU/WASM 的环境自动降级到 Web Speech，不弹错
- 现有 `Practice` 页调用 `speak(question)` 无需改动
- 二次播放命中缓存 < 100ms
- en-IN / en-AU 自动用 Web Speech，UI 文案显式说明

---

## 1. 任务分解（WBS）

任务 ID 格式：`P{phase}-T{order}`，依赖关系在每个任务卡内列出。

### Phase 1：Provider 抽象与重构（行为不变）

#### P1-T1：新建 `services/tts` 目录与类型

- **产物**
  - `src/services/tts/types.ts`：`Accent` / `TTSProviderId` / `VoiceMeta` /
    `SpeakOptions` / `SpeakResult` / `ProviderStatus` / `TTSProvider` /
    错误类（`NotImplementedError` / `TTSAccentNotSupportedError` / `TTSModelLoadError`）
  - `src/services/tts/voices.ts`：`KOKORO_VOICES` / `KOKORO_SUPPORTED_ACCENTS` /
    `pickKokoroDefaultVoice`
  - `src/services/tts/index.ts`：`getProvider(id)` 工厂；`AVAILABLE_PROVIDERS` 列表
- **依赖**：无
- **验收**
  - 类型导出正确，`tsc` 通过
  - 工厂返回的 Provider 全部满足 `TTSProvider` 接口
- **风险/备注**
  - `Accent` 类型与 `types/settings.ts` 现有定义对齐（不要重复定义，从 settings 导入或迁移到 tts/types）

#### P1-T2：迁移 Web Speech 实现到 Provider

- **产物**：`src/services/tts/providers/web-speech.ts`
- **依赖**：P1-T1
- **要点**
  - 把现 `useSpeechSynthesis.ts` 中的 voice 匹配 / `resume()` workaround / 强引用
    utterance 等逻辑全部搬过来
  - `synthesize` 返回 `kind: 'native'`，包含 `play()` / `cancel()`
  - `probe()` 检测 `window.speechSynthesis` 是否存在
  - `listVoices()` 返回 `speechSynthesis.getVoices()` 映射后的 `VoiceMeta[]`
- **验收**
  - 单测：`probe()` 在 jsdom 环境正确返回支持/不支持
  - 现有 Practice 页行为对照测试无回归

#### P1-T3：占位 Provider 骨架（云端三家）

- **产物**
  - `src/services/tts/providers/azure.ts`
  - `src/services/tts/providers/elevenlabs.ts`
  - `src/services/tts/providers/openai.ts`
- **依赖**：P1-T1
- **要点**
  - 每个文件实现完整 `TTSProvider` 接口
  - `probe()` 返回 `{ kind: 'unsupported', reason: 'TODO: 待实现' }`
  - 其他方法抛 `NotImplementedError`
  - 顶部 JSDoc 写明各自的实现规划（参考 `tts-implementation.md` §7）
- **验收**：`tsc` 通过；工厂能正确实例化但 probe 返回 unsupported

#### P1-T4：改造 `useSpeechSynthesis` 为调度入口

- **产物**：重写 `src/hooks/useSpeechSynthesis.ts`
- **依赖**：P1-T1, P1-T2, P1-T3
- **要点**
  - `speak(text, accent?)`：默认按 `settings.ttsAccent`
  - 内部 dispatch 到 `getProvider(settings.ttsProvider)`
  - 兼容签名：原 `speak(text)` 不变
  - 暴露 `providerStatus` 给 UI 显示进度
  - 缓存读写、降级链先**留 TODO 注释**（在 P3 实现）
- **验收**
  - 现有 Practice 页 `speak(question)` 调用零改动
  - 单测：mock Provider，验证调度路径
- **风险**
  - `Accent` 类型扩散，若旧代码引自 hook 需调整 import 路径

#### P1-T5：Settings 类型与默认值扩展

- **产物**
  - `src/types/settings.ts` 增加 `ttsProvider` / `ttsVoiceId` / `ttsCacheEnabled` /
    `ttsCacheLimitMB` / `ttsPreloadStrategy`
  - `src/stores/settingsStore.ts` 默认值扩展
- **依赖**：P1-T1
- **要点**
  - 默认 `ttsProvider: 'kokoro-webgpu'`（探测失败由 Hook 自动落 web-speech）
  - 默认 `ttsCacheLimitMB: 200`，`ttsPreloadStrategy: 'on-demand'`
- **验收**
  - 老用户的 localStorage 不会因新字段缺失而崩（zustand persist 默认 merge）
  - 新装用户能看到默认值生效

**Phase 1 出口标准**：

- 所有现有功能行为对外不变（`tts.providerStatus` 始终为 `ready`，`speak` 走 web-speech）
- `tsc` 通过；vitest 单元测试 ≥ 4 个 case
- `git diff --stat` 主要集中在 `services/tts/**` + `hooks/useSpeechSynthesis.ts` 两处

---

### Phase 2：Kokoro + WebGPU 落地

#### P2-T1：依赖与构建配置

- **产物**
  - `package.json` 新增：`@huggingface/transformers@^3`
  - `vite.config.ts`：`optimizeDeps.exclude`、`worker.format: 'es'`
- **依赖**：无
- **要点**
  - 锁定 transformers.js minor 版本，避免 KokoroTTS API 漂移
  - 验证 dev 启动正常、打包无 worker 报错
- **验收**
  - `npm run dev` 与 `npm run build` 都通过
  - bundle analyzer 检查 transformers 是否被异步分块（不应进入主 chunk）

#### P2-T2：Worker 协议与 PCM/WAV 工具

- **产物**
  - `src/services/tts/worker/protocol.ts`：`WorkerInbound` / `WorkerOutbound`
  - `src/services/tts/worker/wav.ts`：`encodeWAV(pcm, sampleRate): Blob`
- **依赖**：P1-T1
- **要点**
  - WAV 头标准 PCM16 / 单通道 / 24kHz
  - `pcm: Float32Array` 通过 `transferable` 移交
- **验收**
  - 单测：编码后头部 44 字节 magic 正确
  - 单测：Node 环境用 wav 解析库验证可解码

#### P2-T3：Kokoro Worker 实现

- **产物**：`src/services/tts/worker/kokoro.worker.ts`
- **依赖**：P2-T1, P2-T2
- **要点**
  - 处理 `init` / `synthesize` / `dispose` 三类入消息
  - `init` 内 `KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype, device })`
  - WebGPU 用 `dtype: 'fp32'`，WASM 用 `dtype: 'q8'`（量化版减负）
  - `progress_callback` 推送下载进度
  - 错误分类：`no-webgpu` / `oom` / `model-load` / `inference` / `unknown`
- **验收**
  - 桌面 Chrome 启动 Worker 后能完整下载模型并推理一次成功
  - 推理输出 PCM `sample_rate === 24000`，`Float32Array` 长度合理
- **风险**
  - transformers.js v3 API 变动 → 锁版本 + 增 e2e 冒烟用例

#### P2-T4：KokoroWebGPUProvider 主线程实现

- **产物**：`src/services/tts/providers/kokoro-webgpu.ts`
- **依赖**：P2-T3
- **要点**
  - `probe()`：检测 `Worker` + (`navigator.gpu` || `WebAssembly`)
  - `preload()`：决定 backend（webgpu 优先）→ 启动 Worker → init
    - 进行中复用同一 Promise（防重复下载）
  - `synthesize()`：postMessage → 接到 `audio` → `encodeWAV` → resolve `{ blob }`
  - `dispose()`：terminate Worker
  - `requestId` 关联请求，`AbortSignal` 支持中断
- **验收**
  - 单测：mock Worker 验证消息路由
  - 桌面手测：speak 首字 < 500ms（已加载模型）

#### P2-T5：Hook 调度接入 Kokoro Provider

- **产物**：`useSpeechSynthesis.ts` 增量改动
- **依赖**：P1-T4, P2-T4
- **要点**
  - `settings.ttsProvider === 'kokoro-webgpu'` → 走 Kokoro
  - `synthesize` 返回 `kind: 'blob'` → 用 AudioContext 播放
  - 处理 `TTSAccentNotSupportedError`（en-IN / en-AU）→ 当次降级 web-speech
  - 处理 `TTSModelLoadError` → 当次降级 web-speech，记一次错误状态
- **验收**
  - 桌面 Chrome：能切到 Kokoro 并听到考官声
  - 切口音 en-IN：自动用系统语音，无报错

#### P2-T6：Settings 页 UI 控件

- **产物**：`src/pages/Settings/...`（按现有结构插入）
- **依赖**：P2-T5
- **要点（参考 `tts-implementation.md` §9.1）**
  - Provider 下拉（仅 `AVAILABLE_PROVIDERS`）
  - Voice 下拉（按当前 Provider × accent 过滤）
  - 「试听」按钮（speak 一段固定示例）
  - 预加载策略下拉
  - 「立即下载模型」按钮
- **验收**
  - 切换 Provider 立刻生效
  - 切 accent 后 voice 列表自动刷新

#### P2-T7：模型下载进度组件

- **产物**：`src/components/shared/TTSPreloadIndicator.tsx`
- **依赖**：P2-T5
- **要点**
  - 监听 `useSpeechSynthesis().providerStatus`
  - `loading` 时显示进度条 + 当前阶段（download / compile）
  - `error` 时显示重试按钮
  - `ready` / `idle` 时不渲染
- **挂载点**：Practice 页顶部
- **验收**
  - 首次进入 Practice 看到进度条；下载完毕自动消失
  - 二次进入直接 `ready`，不闪现

**Phase 2 出口标准**：

- 桌面 Chrome / Safari 17.4+ 跑通完整链路
- Firefox 桌面：自动降级 WASM 或 web-speech，无错误弹窗
- en-IN / en-AU 走 web-speech 兜底
- 现 Practice 页业务零回归

---

### Phase 3：缓存与体验完善

#### P3-T1：DB Schema 升级到 v2

- **产物**
  - `src/db/index.ts`：新增 `audioCache` 表，`version(2)`
  - `src/types/practice.ts`（或新建 `tts.ts`）：`AudioCacheEntry` 类型
- **依赖**：无
- **要点**
  - 索引：`++id, &key, voice, accent, lastUsedAt, sizeBytes`
  - 升级路径：保留 v1 数据，仅 add 新表
- **验收**
  - 老用户打开应用，DB 无报错，旧表数据保留
  - DevTools → IndexedDB 可看到 `audioCache` 表

#### P3-T2：`audioCacheRepo` 实现

- **产物**：`src/db/audio-cache-repo.ts`
- **依赖**：P3-T1
- **要点**
  - `get(key)`：命中后刷新 `lastUsedAt`
  - `put(entry)`：put 后调用 `evictIfNeeded()`
  - `evictIfNeeded()`：按 `lastUsedAt` 升序删，直到总 sizeBytes ≤ limitMB
  - `totalSize()` / `clear()`
- **验收**
  - 单测覆盖 LRU、容量上限触发清理、命中刷新时间

#### P3-T3：Hook 接入缓存

- **产物**：`useSpeechSynthesis.ts` 增量改动
- **依赖**：P2-T5, P3-T2
- **要点**
  - `speak` 入口先 `audioCacheRepo.get(cacheKey)`
  - 命中：直接 `playBlob`
  - 未命中：synthesize → `playBlob` → 后台 `audioCacheRepo.put`（`.catch(() => {})` 不阻塞）
  - `cacheKey = ${voiceId}:${rate}:${sha1(text)}`
- **验收**
  - 同一题目第二次播放 < 100ms
  - 缓存写入失败不影响播放

#### P3-T4：缓存管理 UI

- **产物**：Settings 页新增控件
- **依赖**：P3-T2
- **要点**
  - 缓存开关 → `ttsCacheEnabled`
  - 容量上限 slider（50/100/200/500 MB）→ `ttsCacheLimitMB`
  - 实时显示 `audioCacheRepo.totalSize()`（mount 时拉一次 + 每次 speak 后刷新）
  - 「清除音频缓存」按钮
  - 「清除模型缓存」按钮（`caches.delete('transformers-cache')` + 重启 Provider）
- **验收**
  - 调整上限后下次 put 触发 LRU 收敛到新阈值
  - 清除模型缓存后下次 speak 重新走下载

#### P3-T5：错误降级链完善

- **产物**：`useSpeechSynthesis.ts` 健壮化
- **依赖**：P2-T5
- **要点**
  - `TTSAccentNotSupportedError`：当次切 web-speech，UI 一次性 toast
  - `TTSModelLoadError`：重试 3 次（指数退避）→ 当次切 web-speech；连续 3 次会话内永久切
  - `oom`：永久切 web-speech，写一条 settings 记忆（避免反复尝试）
  - 用户在 Settings 主动切回可清除记忆
- **验收**
  - 断网状态下 speak 新题目：重试 → 落 web-speech，无白屏
  - 模拟 oom（构造异常）后状态正确切换并文案提示

#### P3-T6：移动端策略

- **产物**：`useSpeechSynthesis.ts` / Settings 页
- **依赖**：P2-T4
- **要点**
  - 探测 `navigator.deviceMemory < 4` 或 UA 命中移动端
  - 默认 `ttsProvider = 'web-speech'`（即使 Kokoro probe 通过也不主动启用）
  - Settings 中给"实验性本地 TTS（耗电较高）"开关
  - 移动端不主动 preload，只在用户首次 speak 时下载
- **验收**
  - iPhone Safari / 中端 Android Chrome 默认走 web-speech
  - 主动开启后能正常使用

**Phase 3 出口标准**：

- 缓存命中 / LRU / 清理全部可工作
- 至少 2 种降级路径手测通过（无网络 / 不支持 WebGPU）
- 移动端不会因为 OOM 直接崩

---

### Phase 4：联调与集成手测

#### P4-T1：端到端冒烟脚本

- **产物**：`docs/tts-smoke-test.md`（手测清单）
- **依赖**：Phase 3 完成
- **要点**：覆盖 `tts-implementation.md` §12.3 的 8 项场景
- **验收**：清单全过

#### P4-T2：性能埋点验证

- **依赖**：Phase 3
- **要点**
  - DevTools Performance：测量首字延迟 / RTF
  - Memory tab：验证内存峰值在预算内
- **验收**：达成 §10.1 目标，否则回归排查

#### P4-T3：文档同步

- **产物**
  - 更新 `docs/technical-design.md` 中 TTS 相关章节（指向 `tts-implementation.md`）
  - 更新 `README` 提示首次进入 Practice 会下载 80MB 模型
- **依赖**：Phase 3
- **验收**：交叉链接无死链

---

## 2. 任务时序与依赖图

```
Phase 1
  P1-T1 ──┬─→ P1-T2 ──┐
          ├─→ P1-T3   ├─→ P1-T4 ──┐
          └─→ P1-T5 ──┘            │
                                    ▼
Phase 2                          (出口 1)
  P2-T1 ──→ P2-T2 ──→ P2-T3 ──→ P2-T4 ──→ P2-T5 ──┬─→ P2-T6
                                                    └─→ P2-T7
                                                           │
                                                           ▼
Phase 3                                                (出口 2)
  P3-T1 ──→ P3-T2 ──┬─→ P3-T3 ──┐
                    └─→ P3-T4   ├─→ P3-T5 ──→ P3-T6
                                 │              │
                                 ▼              ▼
Phase 4                                     (出口 3)
  P4-T1 ──→ P4-T2 ──→ P4-T3 ──→ (发布)
```

并行机会：

- P1-T2 / T3 / T5 三任务可同时进行（都仅依赖 P1-T1）
- P2-T1 与 P2-T2 可并行
- P2-T6 与 P2-T7 可并行
- P3-T3 与 P3-T4 可并行

---

## 3. 验收清单（按 Phase 出口）

### 出口 1（Phase 1 完成）

- [ ] `tsc --noEmit` 通过
- [ ] `vitest run` 全绿（至少新增 4 个 case）
- [ ] `npm run dev` 启动后 Practice 页 speak 行为与改造前一致
- [ ] git diff 仅集中在 `services/tts/**`、`hooks/useSpeechSynthesis.ts`、`types/settings.ts`、`stores/settingsStore.ts`

### 出口 2（Phase 2 完成）

- [ ] 桌面 Chrome 119+：首次访问下载模型，进度条可见，下载完毕能听到 Kokoro 输出
- [ ] 桌面 Safari 17.4+：同上
- [ ] 桌面 Firefox：自动降级 WASM 或 web-speech，无 console error
- [ ] 切口音 en-IN / en-AU：自动用系统语音，UI 提示可见
- [ ] Settings 页可切 Provider / Voice / 试听
- [ ] `npm run build` 通过，transformers.js 进入异步 chunk

### 出口 3（Phase 3 完成）

- [ ] 同一题目第二次播放 < 100ms（命中缓存）
- [ ] 缓存达到上限后 LRU 自动清理
- [ ] 清除模型缓存后下次 speak 重新下载
- [ ] 断网状态下能播放已缓存题目；新题目自动降级 web-speech
- [ ] 中端 Android / iPhone 默认走 web-speech，主动开启后能用本地 TTS
- [ ] DevTools 验证首字延迟 < 500ms（已加载）/ 内存峰值 < 350MB

### 最终发布前

- [ ] 集成手测清单全过
- [ ] README 已说明 80MB 模型下载
- [ ] `tts-implementation.md` 与实际实现无 drift（如有改动同步更新）

---

## 4. 风险登记与应对

| # | 风险 | 触发期 | 影响 | 应对 | 责任阶段 |
|---|------|--------|------|------|---------|
| R1 | transformers.js v3 API 漂移 | P2-T3 | 中 | 锁 patch 版本；冒烟测试纳入 CI | Phase 2 |
| R2 | Kokoro CDN（HF）国内访问慢 | P2-T3 | 中 | 文档说明；后续接镜像（不阻塞本期） | Phase 2 |
| R3 | 移动端 OOM | P3-T6 | 高 | 默认走 web-speech；探测设备内存 | Phase 3 |
| R4 | 老用户 IndexedDB 升级失败 | P3-T1 | 高 | 仅 add 新表，不改老表；上线前在多浏览器复现 | Phase 3 |
| R5 | 模型加载阻塞主线程 | P2-T3 | 中 | 全推理在 Worker；主线程仅 postMessage | Phase 2 |
| R6 | 用户首次进入流量爆炸（80MB） | P2-T6 | 中 | 默认 `on-demand`；UI 显式提示；移动端不预加载 | Phase 2/3 |
| R7 | en-IN/en-AU 用户体验落差 | 全程 | 低 | 文档化；Settings 提示；后续接 Azure 解决 | 文档 |
| R8 | Phase 1 重构破坏现有 speak | P1-T4 | 高 | 出口 1 验收强制对照测试 | Phase 1 |

---

## 5. 不在本期范围（明确推迟）

以下事项已在 `tts-implementation.md` 中提到，但**本期不开发**，避免范围蔓延：

- ❌ Azure / ElevenLabs / OpenAI Provider 的实际实现（仅留骨架）
- ❌ SSML 渲染层
- ❌ 后端代理 / API Key 管理 UI
- ❌ 题库批量预热缓存
- ❌ 声音克隆
- ❌ MP3/OPUS 编码（保持 WAV）
- ❌ 跨域隔离 headers（COOP/COEP）启用 SharedArrayBuffer

如需推进，单独立项。

---

## 6. 交付物清单

代码：

- `src/services/tts/types.ts`
- `src/services/tts/voices.ts`
- `src/services/tts/index.ts`
- `src/services/tts/cache.ts`
- `src/services/tts/providers/kokoro-webgpu.ts`
- `src/services/tts/providers/web-speech.ts`
- `src/services/tts/providers/azure.ts`（骨架）
- `src/services/tts/providers/elevenlabs.ts`（骨架）
- `src/services/tts/providers/openai.ts`(骨架)
- `src/services/tts/worker/kokoro.worker.ts`
- `src/services/tts/worker/protocol.ts`
- `src/services/tts/worker/wav.ts`
- `src/db/audio-cache-repo.ts`
- `src/components/shared/TTSPreloadIndicator.tsx`
- `src/hooks/useSpeechSynthesis.ts`（重写）
- `src/types/settings.ts`（扩展）
- `src/stores/settingsStore.ts`（默认值）
- `src/db/index.ts`（v2 schema）
- `src/pages/Settings/*`（控件增量）
- `vite.config.ts`（worker / optimizeDeps）
- `package.json`（新增依赖）

测试：

- `src/services/tts/**/__tests__/*.test.ts`（≥ 4 个）
- `src/db/__tests__/audio-cache-repo.test.ts`

文档：

- `features/tts-kokoro-webgpu.md`（本文件）
- `docs/tts-smoke-test.md`（P4-T1 产物）
- `docs/technical-design.md`（增量更新）
- `README`（增量更新）

---

## 7. 参考

- [`docs/tts-implementation.md`](../docs/tts-implementation.md) —— 技术方案
- [`docs/tts-research.md`](../docs/tts-research.md) —— 上游调研
- [`docs/technical-design.md`](../docs/technical-design.md) —— 系分文档
- Kokoro-82M：https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
- Transformers.js：https://huggingface.co/docs/transformers.js
