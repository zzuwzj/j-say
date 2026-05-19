# J-Say

> IELTS Speaking Practice Web App — a browser-based tool to simulate the full IELTS Speaking exam, record yourself, and track progress.

中文版：[README.zh-CN.md](./README.zh-CN.md)

**Preview**: <https://renderofficedev.alipay.com/p/ai-pages/6778d001/index.html>

![Home](https://mdn.alipayobjects.com/huamei_sbpgls/afts/img/A*iQZaRKeVOGsAAAAAQgAAAAgAepKTAQ/original)
![Topics](https://mdn.alipayobjects.com/huamei_sbpgls/afts/img/A*azgIQKHiT5AAAAAAQcAAAAgAepKTAQ/original)
![Practice](https://mdn.alipayobjects.com/huamei_sbpgls/afts/img/A*qbPlQKmuntUAAAAAQLAAAAgAepKTAQ/original)

## Overview

J-Say is a PC web app for IELTS candidates and English learners. It faithfully reproduces the three-part IELTS Speaking exam flow, with built-in recording, speech recognition, examiner-style TTS, self-scoring, and a local practice history. The core app runs entirely in the browser with IndexedDB storage — no account, no server required. An optional admin backend (`server/` + `admin/`) is provided for maintaining the corpus and pushing updates to clients.

## Features

- **Full simulation** — Part 1 → Part 2 (1-min prep + 2-min long turn) → Part 3, with countdown timers and per-answer recording.
- **Single-part / random practice** — drill any part on its own, or jump straight in with a random topic.
- **Recording & replay** — MediaRecorder-based audio capture, per-question segments, downloadable as WebM/WAV.
- **Live transcription** — Web Speech API speech recognition shown alongside the recording for self-review.
- **Examiner TTS** — pluggable TTS layer: `kokoro-webgpu` (high-quality on-device, in progress) with `web-speech` fallback; British / American accent options.
- **Topic bank** — 50+ Part 1 groups, 30+ Part 2 cue cards, 20+ Part 3 discussions; tag, filter, favorite, or add your own.
- **Vocabulary book** — topic-linked high-frequency words plus user-added entries, searchable and taggable.
- **Self-scoring** — score four IELTS dimensions (Fluency, Lexical Resource, Grammar, Pronunciation) and attach notes after each session.
- **History & stats** — chronological history with full playback; dashboard with frequency heatmap, score trends, and topic coverage.
- **Local-first data** — everything in IndexedDB; JSON import/export for backup and migration.
- **Optional corpus admin** — Hono + SQLite backend with an Ant Design admin UI for editing the corpus, versioning, and one-way sync to clients via `VITE_API_BASE`.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | TailwindCSS 4 |
| Routing | React Router v7 |
| State | Zustand |
| Local DB | Dexie.js (IndexedDB) |
| Audio | MediaRecorder API |
| ASR / TTS | Web Speech API, Kokoro-82M on WebGPU (Transformers.js) |
| Charts | Recharts |
| Admin server | Hono + Drizzle ORM + better-sqlite3 |
| Admin UI | React + Ant Design 5 |

## Project Structure

```
j-say/
├── src/              # Main app (port 5173)
│   ├── pages/        # Home, Practice, Topics, History, Vocabulary, Stats, Settings
│   ├── components/   # ui / layout / shared
│   ├── hooks/        # useAudioRecorder, useSpeechRecognition, useSpeechSynthesis, useTimer ...
│   ├── services/tts/ # Provider abstraction (web-speech / kokoro-webgpu / azure / elevenlabs / openai)
│   ├── stores/       # Zustand stores
│   ├── db/           # Dexie schemas
│   └── data/         # Built-in topic & vocabulary seeds
├── server/           # Optional corpus backend (Hono + SQLite, port 3001)
├── admin/            # Optional corpus admin UI (Ant Design, port 5174)
├── shared/           # Shared types between server and admin
├── docs/             # Requirements & technical design
└── features/         # Per-feature plans and status
```

## Getting Started

Requires Node.js 20+.

```bash
# Install dependencies (workspaces include server/ and admin/)
npm install

# Start the main app at http://localhost:5173
npm run dev
```

Optional — corpus admin stack:

```bash
# Backend at http://localhost:3001
cd server && npm run dev

# Admin UI at http://localhost:5174
cd admin && npm run dev
```

Or use Docker Compose to run `server` + `admin` together:

```bash
docker compose up -d
```

## Seeding Built-in Corpus into the DB

The built-in corpus under `src/data/topics/*.ts` and `src/data/vocabulary.ts` can be loaded into the backend SQLite database for the admin UI:

```bash
# One shot: convert TS → write server/data/*.json → wipe built-in rows and reimport
npm run seed

# Or step by step
npm run seed:convert   # writes server/data/seed-topics.json + seed-vocabularies.json
npm run seed:db        # equivalent to: cd server && npm run seed
```

`seed` preserves user-authored records (`isCustom=true`) and only refreshes the built-in rows; imported records are marked `published`. Re-run `npm run seed` whenever the source data in `src/data/` changes.

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE` | Backend URL the main app syncs the corpus from. Leave unset to run fully offline with built-in data. |
| `PORT` | Backend port (default `3001`). |
| `ADMIN_PASSWORD` | Login password for the admin UI. |
| `CORS_ORIGINS` | Comma-separated allowed origins for the backend. |
| `IMPORT_LIMIT` | Max rows accepted per corpus import. |

## Browser Support

- **Recommended**: Chrome 119+ on desktop (full ASR + WebGPU TTS).
- **Speech recognition** requires a Chromium-based browser; other browsers fall back to recording only.
- **Kokoro WebGPU TTS** requires Chrome 119+ or Safari 17.4+; otherwise falls back to Web Speech automatically.

## Documentation

- [`docs/requirements-design.md`](./docs/requirements-design.md) — full product requirements
- [`docs/technical-design.md`](./docs/technical-design.md) — main app architecture
- [`docs/tts-research.md`](./docs/tts-research.md) / [`docs/tts-implementation.md`](./docs/tts-implementation.md) — TTS design notes
- [`docs/corpus-admin-requirements.md`](./docs/corpus-admin-requirements.md) / [`docs/corpus-admin-technical-design.md`](./docs/corpus-admin-technical-design.md) — admin system
- [`features/STATUS.md`](./features/STATUS.md) — current feature progress

## License

ISC
