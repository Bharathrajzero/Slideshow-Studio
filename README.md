<div align="center">
  <!-- TODO: Replace with an actual logo or banner image -->
  <!-- <img src="docs/banner.png" alt="Slideshow Studio Banner" width="100%"> -->
  
  <h1>🎬 Slideshow Studio</h1>
  <p><strong>Browser-Native Video Generation & AI Storyboarding Engine</strong></p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)]()
  [![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)]()
  [![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)]()
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)]()
</div>

<br />

Turn a sequence of images into a fully animated, high-definition video **entirely in the browser**. Slideshow Studio combines the raw power of `FFmpeg.wasm` with an extensible architecture designed for local (WebGPU) or remote (API) AI text-to-image generation. 

Zero servers. Zero upload waits. Total privacy.

---
## Screenshots
<img width="1920" height="1079" alt="81" src="https://github.com/user-attachments/assets/9b029849-dd6d-4879-843b-1943e4ffa76c" />
<img width="1920" height="1079" alt="82" src="https://github.com/user-attachments/assets/21c6a9d2-cdda-41e4-aee1-7ca5d599378e" />
<video src="https://github.com/user-attachments/assets/c2d33fb2-bb6a-4d03-b396-b3d9edf8f5b3" width="100%" controls></video>

---
## 📑 Table of Contents

- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🔌 The AI Architecture](#-the-ai-architecture)
- [📂 Project Anatomy](#-project-anatomy)
- [☁️ Deployment Guide (COOP/COEP)](#️-deployment-guide)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

* 🔒 **Privacy-First (Zero-Server Rendering):** Video compilation happens entirely on the client. No image data is ever uploaded to a third-party server.
* ⚡ **Silky Smooth UI:** The entire `FFmpeg` pipeline runs inside a dedicated Web Worker (`ffmpeg.worker.ts`), ensuring the main thread never freezes, even during 1080p rendering.
* 🧠 **Bring-Your-Own-AI Architecture:** Text-to-image generation is decoupled. Swap effortlessly between a local, offline WebGPU model or a remote API endpoint.
* 🧹 **Aggressive Memory Management:** Browser tabs crash when WASM heaps overflow. Our built-in `memoryManager.ts` automatically monitors allocations and purges virtual file systems after every render.
* 🎥 **Dynamic Editing:** Apply Ken Burns (pan/zoom) effects, custom durations, crossfades, and hard-cuts dynamically. Export directly to H.264 (MP4) or VP9 (WebM).

---

## 🚀 Quick Start

Ensure you have **Node.js 18+** installed. 

```bash
# 1. Clone the repository
git clone [https://github.com/your-username/slideshow-studio.git](https://github.com/your-username/slideshow-studio.git)
cd slideshow-studio

# 2. Install dependencies (auto-copies ffmpeg-core via postinstall)
npm install

# 3. Start the Vite development server
npm run dev

```

> [!CAUTION]
> **Cross-Origin Isolation is strictly required.**
> `FFmpeg.wasm` utilizes `SharedArrayBuffer` for multithreading. For local dev, Vite automatically injects the required headers. If you deploy to production, you **must** configure your host to send `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers. See the [Deployment Guide](https://www.google.com/search?q=%23%EF%B8%8F-deployment-guide) below.

---

## 🔌 The AI Architecture

We intentionally left the `src/ai/` module as an open interface rather than forcing a specific model footprint. The UI and rendering graphs dynamically adapt based on which provider you choose to implement:

1. **`localProvider.ts` (WebGPU / WASM):** Designed for offline generation via tools like Transformers.js. The app automatically detects hardware capabilities; if the user lacks a capable GPU, it seamlessly falls back to remote or disables the feature.
2. **`remoteProvider.ts` (API Bridge):** A lightweight `fetch()` wrapper. Point this to your backend proxy (e.g., `/api/generate`). *Note: Never expose provider API keys (OpenAI, Replicate, etc.) directly in this client file.*

Regardless of the provider, all data flows through `src/ai/generation.ts`, meaning the rest of the application requires zero refactoring when you change AI engines.

---

## 📂 Project Anatomy

A quick map of the codebase for contributors and forkers:

```text
src/
├── ai/                 # Unified AI dispatcher & FFmpeg effect mappers
│   ├── providers/      # -> Swap your local/remote image-gen logic here
├── components/         # React UI: Uploaders, prompt boxes, timelines
├── core/               # The Engine: Video renderer, canvas processor, memory manager
├── workers/            # Off-main-thread execution (FFmpeg & WebGPU)
├── store/              # Zustand global state (App state & Hardware capabilities)
├── hooks/              # Device benchmarking, queue management, FFmpeg lifecycle
└── utils/              # File system helpers and IndexedDB model caching

```
```
Slideshow-Studio/
├── public/
│   └── ffmpeg-core/                     # Self-hosted ffmpeg-core.wasm + .js
│
├── src/
│   ├── assets/
│   │   └── styles.css
│   │
│   ├── components/
│   │   ├── ImageUploader.tsx            # Drag/drop & manual reordering
│   │   ├── PromptInput.tsx              # Text prompt box (only shown if generation mode enabled)
│   │   ├── GeneratedGallery.tsx         # Shows generated frames, pick/reorder/regenerate
│   │   ├── VideoPlayer.tsx              # Preview output
│   │   ├── ExportControls.tsx           # Progress bar, render trigger, quality options
│   │   ├── DeviceWarningBanner.tsx      # "AI generation unavailable on this device" notice
│   │   └── ModelLoadOverlay.tsx         # First-run loading UI (only relevant if local model used)
│   │
│   ├── ai/
│   │   ├── generation.ts                # Single interface: local model OR external API, picked at runtime
│   │   ├── providers/
│   │   │   ├── localProvider.ts         # WebGPU/WASM path — only activates if device supports it
│   │   │   └── remoteProvider.ts        # Thin fetch wrapper to an external image-gen API
│   │   └── promptToEffects.ts           # Maps prompt text → FFmpeg filter params (pan/zoom/mood/pace)
│   │
│   ├── core/
│   │   ├── ffmpegWorker.ts              # Wrapper class — bridges to the actual worker
│   │   ├── imageProcessor.ts            # Canvas-based resize/normalize before FFmpeg
│   │   ├── videoRenderer.ts             # Builds FFmpeg command graphs
│   │   ├── effectsEngine.ts             # Prompt-driven filter graph builder
│   │   └── memoryManager.ts             # FS cleanup, exit()/unlink(), heap monitoring
│   │
│   ├── workers/
│   │   ├── ffmpeg.worker.ts             # Dedicated Worker owning the FFmpeg wasm instance
│   │   └── textToImage.worker.ts        # Only spun up if localProvider is active
│   │
│   ├── store/
│   │   ├── useAppStore.ts               # Images, prompt, render status (Zustand)
│   │   └── useCapabilityStore.ts        # Device tier, WebGPU support, generation mode
│   │
│   ├── hooks/
│   │   ├── useFFmpeg.ts
│   │   ├── useGeneration.ts             # Calls ai/generation.ts, agnostic to local vs remote
│   │   ├── useImageQueue.ts
│   │   └── useDeviceCapabilities.ts     # Benchmarks/detects hardware, sets generation mode
│   │
│   ├── types/
│   │   └── index.ts                     # RenderProgress, AppImage, GenerationSettings, EffectPreset
│   │
│   ├── utils/
│   │   ├── modelCache.ts                # IndexedDB caching (only used if local model enabled)
│   │   └── fileHelpers.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── index.html                           # Application entry point + COOP/COEP validation check
├── package.json
├── tsconfig.json
├── .gitignore                           # Excludes node_modules, local weights, and generated ffmpeg assets
└── vite.config.ts                       # COOP/COEP headers + worker plugin config
```

---

## ☁️ Deployment Guide

Because this application relies on `SharedArrayBuffer` for FFmpeg web workers, your production hosting environment must enforce Cross-Origin Isolation. Here is how to configure the most popular platforms:

### Vercel

Create a `vercel.json` file in the root of your project:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ]
}

```

### Netlify

Create a `_headers` file in your `public/` directory:

```text
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp

```

### Cloudflare Pages

Create a `_headers` file in your build output directory (usually `dist/` or `public/`):

```text
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp

```

---

## 🤝 Contributing

Contributions are heavily encouraged! Whether you want to optimize the rendering graph, add new transition effects, or build out a default Transformers.js local provider, we'd love your help.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Author

* **Developer:** Bharath Raj
* **GitHub Profile:** [github.com/bharathrajzero](https://github.com/bharathrajzero)
  
---

## License

This project is licensed under the MIT License © 2026 Bharath Raj, AlphaGroup.
