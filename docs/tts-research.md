# 模拟考官语音（TTS）优化方案调研

> 版本：v1.0 | 日期：2026-05-13
> 范围：J-Say 雅思口语练习应用（Part 1 / Part 2 / Part 3 模拟考官提问）

---

## 1. 现状与问题

### 1.1 当前实现

- 文件：`src/hooks/useSpeechSynthesis.ts`
- 引擎：浏览器原生 **Web Speech API**（`window.speechSynthesis`）
- 口音：通过 `lang` 字段（`en-GB / en-US / en-IN / en-AU`）匹配系统内置 voice，匹配不到则 fallback 到同语种第一个
- 速率：固定 `rate = 0.9`

### 1.2 暴露的问题

| 维度 | 现象 | 影响 |
|------|------|------|
| **音质** | 系统默认声音偏机械，缺乏停顿、重音、情感 | 模拟考官不像真人，沉浸感差 |
| **跨平台一致性** | macOS（Siri 声音可用）≫ Windows（Microsoft David/Zira 较旧）≫ Linux（espeak）≫ Android Chrome（Google TTS 可用但口音不全） | 用户体验取决于操作系统，无法掌控 |
| **口音覆盖** | `en-IN`、`en-AU` 在很多 Windows / Linux 设备上**根本没有** voice，被 fallback 成美音 | "印度口音考官""澳洲口音考官"功能形同虚设 |
| **韵律控制** | Web Speech API 只能调 `rate / pitch / volume`，**不支持 SSML**（Chrome、Safari、Firefox 都不支持） | 无法制造问句上扬、cue card 严肃语气、Part 3 思考停顿 |
| **可靠性 bug** | Chrome 长文本 ~15s 会自动暂停（已用 `resume()` workaround）；utterance 被 GC silent fail；移动端 iOS 必须在用户手势链中调用 | 维护成本高，仍偶发哑音 |
| **首字延迟** | 本地合成无网络延迟，但**预热慢**（首次 voiceschanged 异步） | 第一题易错过开口 |

> 结论：在 IELTS 这种"对口音真实度高度敏感"的场景下，Web Speech API 已成为**体验瓶颈**。

---

## 2. 业界主流方案概览

按部署形态分三类：**云端商用 API** / **开源自部署** / **浏览器端推理**。

### 2.1 云端商用 API（推荐主路径）

| 方案 | 技术亮点 | 雅思相关口音 | 计费（约） | 延迟 | 适用度 |
|------|---------|------------|-----------|------|--------|
| **ElevenLabs** | 业内公认音质天花板，情感表达最强；Turbo v2.5 / Flash v2.5 可流式；支持声音克隆 | en-GB / en-US 各 50+；en-AU、en-IN 有但偏少 | $0.18 / 1k chars（Creator）；流式首包 ~75ms（Flash） | 极低 | ⭐⭐⭐⭐⭐ |
| **Microsoft Azure Speech (Neural TTS)** | 性价比高；**en-IN / en-AU 官方覆盖最完整**；支持 SSML、情感角色、风格（newscast / cheerful / serious） | en-GB（Sonia/Ryan）、en-US（Jenny/Guy/Aria）、en-IN（Neerja/Prabhat）、en-AU（Natasha/William），均为 Multilingual / HD 等多档 | $16 / 1M chars (Neural)；HD voice 略贵 | ~200ms | ⭐⭐⭐⭐⭐ |
| **Google Cloud TTS (Chirp 3 / Studio)** | Chirp 3 HD 接近 ElevenLabs；Studio voice 富有表现力 | en-GB/US/IN/AU 全覆盖，Neural2 + Chirp3-HD 多档 | Neural2 $16 / 1M；Chirp3-HD $30 / 1M；Studio $160 / 1M | ~250ms | ⭐⭐⭐⭐ |
| **OpenAI TTS** (`gpt-4o-mini-tts`) | 支持自然语言指令控制语气（"以严肃考官口吻提问"）；多语言；性价比好 | 单一模型多口音，但**无法精确指定 en-GB vs en-AU**——需通过 instructions 引导，效果不稳 | $15 / 1M chars (mini) | ~400ms | ⭐⭐⭐（口音控制弱） |
| **Amazon Polly Generative / Long-form** | Generative voices 接近 ElevenLabs；Neural 性价比高 | en-GB（Amy/Brian）、en-US（Joanna/Matthew）、en-IN（Kajal）、en-AU（Olivia/Russell） | Generative $30 / 1M；Neural $16 / 1M | ~300ms | ⭐⭐⭐⭐ |
| **Deepgram Aura-2** | 主打**超低延迟流式**（首包 < 200ms）；电话/对话场景优化 | 口音以美/英为主，AU/IN 较少 | $0.030 / 1k chars | 极低 | ⭐⭐⭐ |
| **Cartesia Sonic 2** | 流式首包 ~40ms；声音克隆 3 秒样本 | en 覆盖好，专项口音少 | $0.025 / 1k chars | 极低 | ⭐⭐⭐ |

### 2.2 开源自部署模型

| 方案 | 模型规模 | 质量 | 部署 | 适用度 |
|------|---------|------|------|--------|
| **Coqui XTTS-v2** | ~1.8GB | 接近商用，多语言 + 克隆 | GPU 推理（A10/T4） | 自托管首选 |
| **F5-TTS** | ~300M | 25 春最佳开源之一，零样本克隆 | GPU 推理 | 想做自定义考官声音 |
| **Kokoro-82M** | 82M 极小 | 同尺寸最佳 | CPU 可跑，**WebGPU 浏览器端可跑** | 浏览器端首选 |
| **Piper** | 数十 MB | 轻量但偏机械 | CPU/边缘 | 离线兜底 |
| **OpenVoice v2 / GPT-SoVITS / IndexTTS** | — | 强项是中文 + 克隆 | GPU | 雅思英文场景非首选 |

### 2.3 浏览器端推理（前沿）

借助 **WebGPU + Transformers.js / ONNX Runtime Web**，可把 Kokoro-82M、Piper 等模型直接跑在用户浏览器：

- 首次加载 80MB 左右模型 → 完全离线、零成本、零隐私顾虑
- 实测 M1 Mac WebGPU 上 Kokoro 实时率 > 5x，移动端 ~1x（勉强可用）
- 代表项目：`hexgrad/Kokoro-82M` + `Xenova/transformers.js`

> 适合作为"高级用户的离线模式"或"无网兜底"，但口音仅 en-US/GB 两档，覆盖不全。

---

## 3. 针对 J-Say 场景的推荐方案

### 3.1 方案选型决策

雅思口语场景的核心诉求按权重排序：

1. **四种口音真实可辨**（en-GB / US / IN / AU 都要）—— 必须
2. **韵律自然**（问句上扬、停顿、强调）—— 必须，需 SSML
3. **延迟可接受**（< 1s 首字）—— 重要
4. **成本可控**（用户练习 1 小时约 5–8 千字符 ≈ $0.08–0.13）—— 重要
5. **可演进**（未来可加情绪、可换更好模型）—— 重要

### 3.2 推荐架构：分层 + 可切换

```
┌─────────────────────────────────────────────────┐
│        useSpeechSynthesis (统一接口)             │
│   speak(text, { accent, role?, ssml? })         │
└──────────────┬──────────────────────────────────┘
               │
   ┌───────────┴────────────┬──────────────────┐
   │                        │                  │
┌──▼─────────────┐   ┌──────▼──────┐   ┌──────▼─────────┐
│ CloudTTSProvider│   │ WebSpeech   │   │ KokoroWebGPU   │
│ (主路径)        │   │ Provider    │   │ Provider       │
│                │   │ (兜底/离线) │   │ (实验性离线)   │
│ Azure / Eleven │   │             │   │                │
│ Labs / Polly   │   │             │   │                │
└────────────────┘   └─────────────┘   └────────────────┘
```

**首选**：**Microsoft Azure Speech Neural TTS**

理由：
- 4 种口音官方覆盖最齐全（en-IN 的 Neerja、en-AU 的 Natasha 都很自然）
- 支持完整 **SSML**：`<break>` 模拟考官思考停顿、`<prosody>` 控制语速、`<mstts:express-as style="serious">` 做考官风格
- 价格 $16/M chars，IELTS 单次练习成本 ~$0.10，可接受
- 延迟 ~200ms，配合流式播放可做到无感
- 国内可走 Azure 中国区或反向代理，合规性最好

**备选**：ElevenLabs（音质更佳，但 en-AU/IN voice 较少；适合付费高级版）
**兜底**：现有 Web Speech API（无网/未配置 key 时自动降级）
**未来**：Kokoro-82M + WebGPU（"完全离线模式"差异化卖点）

### 3.3 关键设计细节

#### 3.3.1 API Key 安全（核心约束）

**当前应用是纯前端 SPA**——直接把 Azure Key 放前端等于公开。两种解法：

| 方案 | 优点 | 缺点 |
|------|------|------|
| **A. 加一层超薄代理**（Cloudflare Worker / Vercel Edge / 阿里云函数） | Key 安全，可加速率限制 | 破坏纯前端属性，需运维 |
| **B. 用户自带 Key**（在 Settings 里输入自己的 Azure/ElevenLabs Key，存 IndexedDB） | 零运维，符合现有架构 | 门槛高，普通用户难以使用 |

**推荐**：A + B 双轨——默认用 A 让普通用户开箱即用；高级用户可在 Settings 配置自己的 Key 走方案 B。

#### 3.3.2 流式播放

- Azure / ElevenLabs / OpenAI TTS 都支持 chunked HTTP 或 WebSocket 流式音频
- 浏览器侧通过 **MediaSource Extensions (MSE)** 或 **Web Audio API + AudioWorklet** 边收边播
- 配合 SSML 的 `<bookmark>` 可以做到"读到这里时高亮 UI"

#### 3.3.3 缓存（重要的成本优化）

雅思题库基本固定：

- Part 1 高频问题约 200 条
- Part 2 cue cards 约 400 张
- 每条提问/cue card 命中后**永久缓存音频** Blob 到 IndexedDB
- 二次播放零成本、零延迟

```ts
// 缓存键示例
const cacheKey = `${voice}:${ssmlHash}`;
// 命中 → 直接 createObjectURL(blob) 播放
// 未命中 → 调云端 API → 流式播放 + 落库
```

按 80% 命中率估算，长期月成本可压到原始的 20%。

#### 3.3.4 SSML 模板（按 Part 设计考官语气）

```xml
<!-- Part 1：日常对话，轻松友好 -->
<speak version="1.0" xml:lang="en-GB">
  <voice name="en-GB-SoniaNeural">
    <mstts:express-as style="chat">
      So, <break time="200ms"/> let's talk about your hometown.
      <break time="300ms"/> Where are you from?
    </mstts:express-as>
  </voice>
</speak>

<!-- Part 2：cue card 严肃宣读 -->
<voice name="en-GB-RyanNeural">
  <mstts:express-as style="newscast">
    <prosody rate="-5%">
      Describe a person who has influenced you.
      <break time="500ms"/> You should say:
      <break time="400ms"/> who this person is,
      ...
    </prosody>
  </mstts:express-as>
</voice>

<!-- Part 3：深入提问，思考型语气 -->
<voice name="en-GB-SoniaNeural">
  <prosody pitch="-2%" rate="-3%">
    <emphasis level="moderate">In what ways</emphasis>
    <break time="200ms"/> do you think social media
    <break time="200ms"/> changes how young people communicate?
  </prosody>
</voice>
```

#### 3.3.5 代码改造要点

- 抽取 `TTSProvider` 接口（`speak / cancel / preload / isAvailable`）
- 现有 `useSpeechSynthesis` 内部 dispatch 到具体 provider
- Settings 增加：
  - `ttsProvider: 'web-speech' | 'azure' | 'elevenlabs' | 'openai' | 'kokoro-webgpu'`
  - `ttsVoice: string`（具体 voice id，按 provider 不同候选不同）
  - `ttsApiKey?: string`（用户自带 key，加密存储）
  - `ttsCacheEnabled: boolean`
- 新增 `services/tts/` 目录，每个 provider 一个文件
- 新增 `db/audioCache.ts`，新表 `audio_cache (key, blob, voice, createdAt, lastUsedAt)`，配 LRU 清理（如 200MB 上限）

---

## 4. 成本估算

按一个用户每周练习 5 次、每次 30 分钟、考官说话占 30% 计：

- 单次考官文本量 ≈ 1500 字符
- 周 = 7500 字符 → 月 ≈ 32k 字符 → 单用户 0.5 美元 / 月（Azure Neural，无缓存）
- 命中题库缓存 80% → **0.1 美元 / 月**

1000 活跃用户 ≈ 100 美元/月 TTS 成本，可接受。

---

## 5. 实施路线

### Phase 1（1–2 天，最小可用）
- 抽接口 → 接入 Azure 一种口音（en-GB）→ 用户自带 Key 模式
- 验证音质提升、SSML 工作正常

### Phase 2（3–5 天，体验完整）
- 4 口音全开（en-GB / US / IN / AU 各选 1–2 个 voice）
- 流式播放
- IndexedDB 音频缓存
- Web Speech 兜底

### Phase 3（按需）
- 加代理后端 / 默认 Key 服务
- 接入 ElevenLabs 高级版
- WebGPU 离线模式（差异化）
- Settings 中加"试听"按钮，让用户选喜欢的考官声音

---

## 6. 风险与权衡

| 风险 | 缓解 |
|------|------|
| 网络异常导致考官哑音 | Web Speech 自动 fallback；显示重试按钮 |
| 用户 Key 泄漏 | 仅存 IndexedDB；提示用户设额度上限 |
| 国内网络访问 Azure 慢 | 用 Azure 中国区（有独立 endpoint）或代理走国内云函数 |
| 音频缓存把 IndexedDB 撑爆 | LRU 清理 + 配额上限 + Settings 中显示已用容量 |
| 题库更新后旧音频失效 | 缓存键带文本 hash，自动失效 |
| 走代理后破坏"纯前端 SPA"架构 | 文档说明：代理仅做 API 透传，仍保留无后端模式 |

---

## 7. 结论

- **短期**：从 Web Speech API 迁移到 **Azure Speech Neural TTS** 是性价比最高的一步，可立即解决"印度澳洲口音不存在"和"考官像机器人"两大痛点。
- **中期**：通过 **SSML + 题库音频缓存** 把成本压到极低、体验接近真人。
- **长期**：保留 provider 抽象，未来轻松切换到 ElevenLabs / 浏览器端 Kokoro，做差异化体验或离线模式。

---

## 附录 A：候选 voice 速查（Azure Speech）

| Locale | Voice | 风格 | 备注 |
|--------|-------|------|------|
| en-GB | Sonia (F) / Ryan (M) | chat / newscast | 经典 BBC 英音 |
| en-GB | OliverMultilingual (M) | — | 新一代多语种 HD |
| en-US | Jenny (F) / Guy (M) / Aria (F) | 多 style | Aria 最自然 |
| en-US | AndrewMultilingual (M) | — | HD voice，质感最好 |
| en-IN | Neerja (F) / Prabhat (M) | — | 标准印度英语 |
| en-AU | Natasha (F) / William (M) | — | 标准澳洲英语 |

## 附录 B：参考资料

- Azure Speech Neural TTS 文档：https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts
- ElevenLabs 文档：https://elevenlabs.io/docs
- OpenAI TTS：https://platform.openai.com/docs/guides/text-to-speech
- Google Cloud TTS Chirp 3 HD：https://cloud.google.com/text-to-speech/docs/chirp3-hd
- Kokoro-82M：https://huggingface.co/hexgrad/Kokoro-82M
- Transformers.js（浏览器端推理）：https://huggingface.co/docs/transformers.js
- F5-TTS：https://github.com/SWivid/F5-TTS
- W3C SSML 规范：https://www.w3.org/TR/speech-synthesis11/
