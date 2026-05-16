# 开发进度：TTS（Kokoro-82M + WebGPU）

> Feature 计划：[`tts-kokoro-webgpu.md`](./tts-kokoro-webgpu.md)
> 最近更新：2026-05-14

---

## 总览

| Phase | 状态 | 完成日期 | 备注 |
|-------|------|---------|------|
| Phase 1：抽接口 + Web Speech 重写 | ✅ 完成 | 2026-05-14 | 行为对外不变 |
| Phase 2：Kokoro WebGPU 落地 | ⏳ 未开始 | — | |
| Phase 3：缓存与体验完善 | ⏳ 未开始 | — | |
| Phase 4：联调与集成手测 | ⏳ 未开始 | — | |

**当前生效路径**：用户 settings.ttsProvider 默认 `kokoro-webgpu` → Hook 探测 →
KokoroProvider 报 `unsupported`（Phase 2 待实现）→ 自动落 `web-speech`，听感与
重构前一致。

---

## Phase 1 详情

### 任务清单

| ID | 任务 | 状态 | 产物 |
|----|------|------|------|
| P1-T1 | services/tts 目录与类型 | ✅ | `types.ts` / `voices.ts` / `index.ts` |
| P1-T2 | 迁移 Web Speech 到 Provider | ✅ | `providers/web-speech.ts` |
| P1-T3 | 云端 Provider 骨架 | ✅ | `providers/{azure,elevenlabs,openai,kokoro-webgpu}.ts` |
| P1-T4 | 改造 useSpeechSynthesis 为调度入口 | ✅ | `hooks/useSpeechSynthesis.ts`（重写） |
| P1-T5 | Settings 类型与默认值扩展 | ✅ | `types/settings.ts` / `stores/settingsStore.ts` |

### 新增 / 修改文件

新增（8 个）：

```
src/services/tts/
├── index.ts                          (Provider 工厂 + 单例缓存 + 公共类型导出)
├── types.ts                          (TTSProvider 接口 + 错误类)
├── voices.ts                         (Kokoro voice 元数据 + accent 映射)
└── providers/
    ├── kokoro-webgpu.ts              (骨架, Phase 2 实现)
    ├── web-speech.ts                 (主可用兜底)
    ├── azure.ts                      (TODO 骨架)
    ├── elevenlabs.ts                 (TODO 骨架)
    └── openai.ts                     (TODO 骨架)
```

修改（4 个）：

```
src/hooks/useSpeechSynthesis.ts       (重写为 Provider 调度入口)
src/types/settings.ts                 (新增 5 个 tts 字段)
src/types/index.ts                    (导出 TTSPreloadStrategy)
src/stores/settingsStore.ts           (新字段默认值)
```

### 设计决策落实

| 决策（来自 `tts-implementation.md`）  | 落实情况 |
|-------------------------------------|---------|
| D4：Provider 返回 Blob 或 native，由 Hook 统一播放 | `SpeakResult` 联合类型已建；Web Speech 走 `kind:'native'` |
| D9：云端 Provider 仅留接口 | 三家全部 `NotImplementedError` 骨架，JSDoc 写明规划 |
| D10：默认 `kokoro-webgpu`，自动降级 | Hook 内 probe 失败时切 `web-speech`，effectiveProviderId 与 settings 解耦 |
| Settings 5 个新字段 | `ttsProvider` / `ttsVoiceId` / `ttsCacheEnabled` / `ttsCacheLimitMB` / `ttsPreloadStrategy` 全部就绪 |
| `AVAILABLE_PROVIDERS` 仅暴露已实现 | 生产构建只暴露 `kokoro-webgpu` + `web-speech`；DEV 全部可见 |

### 出口验收对照（计划 §3 出口 1）

- [x] `tsc --noEmit` 通过（exit 0）
- [x] `npm run build` 通过
- [x] Practice 页 / Settings 页对 `useSpeechSynthesis` 的调用零改动（已 grep 确认）
- [x] git diff 集中在 `services/tts/**`、`hooks/useSpeechSynthesis.ts`、`types/settings.ts`、`stores/settingsStore.ts`、`types/index.ts`
- [ ] **vitest 单测 ≥ 4 case** —— 暂未补，见下方"已知缺口"

### 关键行为说明

**调度链**（速读）：

```
Component.speak("text")
   │
   ▼
useSpeechSynthesis.speak
   │ 同步 cancel 上一次
   │ 取 effectiveProvider (settings.ttsProvider 经 probe 确认或降级后)
   ▼
provider.synthesize  ──┬─→ kind:'native'  → result.play()  ──► onend → setIsSpeaking(false)
                       │
                       └─→ kind:'blob'   → 暂未实现 (Phase 3)
                       │
                       └─→ throw         → web-speech 兜底重试一次
                                           （针对 NotImplementedError /
                                            TTSAccentNotSupportedError /
                                            TTSModelLoadError）
```

**ttsProvider = kokoro-webgpu 时的实际表现**（Phase 1 阶段）：

1. Hook mount → `KokoroWebGPUProvider.probe()` → `unsupported`
2. Hook 切 `effectiveProviderId = 'web-speech'`
3. 用户 speak → 走 Web Speech，听感与重构前一致

**新增暴露给 UI 的能力**（Phase 2/3 才会用到）：

- `providerStatus`：用于将来 Practice 页顶部进度条
- `effectiveProviderId`：UI 可显示"当前正在用 XXX 引擎"
- `preload()`：UI "立即下载模型" 按钮调用入口

---

## 已知缺口 / Phase 1 遗留

| # | 项 | 影响 | 处理时机 |
|---|----|------|---------|
| G1 | 未补 vitest 单测（计划 ≥ 4 case） | 依赖 vitest 配置（jsdom env、setup 文件等），项目当前未配 | Phase 2 与 Worker 单测一并补，或单独立项 |
| G2 | Web Speech `gender` 字段固定 `female` | UI 显示性别不准 | Web Speech API 不暴露性别，需借第三方 voice 名映射；非阻塞 |
| G3 | Hook 内的 fallback 仅 "本次重试"，无连续失败永久切 | 偶发错误会反复降级 | P3-T5 完整降级链覆盖 |
| G4 | Settings 页未新增 Provider/Voice 控件 | 当前用户无法在 UI 切 Provider | P2-T6 实现 |

---

## 下一步（Phase 2 启动条件）

进入 Phase 2 前确认：

- [ ] `package.json` 增加 `@huggingface/transformers@^3` 依赖（计划 P2-T1）
- [ ] `vite.config.ts` 加 `optimizeDeps.exclude` + `worker.format: 'es'`
- [ ] 准备一台 WebGPU 可用的桌面浏览器做联调（Chrome 119+ / Safari 17.4+）

---

## 变更记录

| 日期 | Phase | 变更 |
|------|-------|------|
| 2026-05-14 | Phase 1 | 完成 P1-T1 ~ T5；tsc + build 通过；行为零回归 |
