export interface AppImage {
  id: string;
  file: File;
  /** Object URL for on-screen preview / thumbnail */
  previewUrl: string;
  /** Set once imageProcessor.ts has resized it to render-safe dimensions */
  processedBlob?: Blob;
  order: number;
  /** True if this image came from the AI generator rather than an upload */
  source: "upload" | "generated";
  /** Seconds this image stays on screen in the final video */
  durationSec: number;
}

export type EffectPreset = "kenburns" | "static" | "slide" | "fade-only";

export interface EffectSettings {
  preset: EffectPreset;
  transition: "crossfade" | "cut" | "wipe";
  transitionDurationSec: number;
  panIntensity: number; // 0 - 1
  zoomIntensity: number; // 0 - 1
}

export interface GenerationSettings {
  prompt: string;
  steps: number;
  width: number;
  height: number;
  seed?: number;
}

export type GenerationMode = "local" | "remote" | "disabled";

export interface RenderProgress {
  stage: "idle" | "preparing" | "encoding" | "finalizing" | "done" | "error";
  /** 0-100 */
  percent: number;
  message: string;
}

export interface DeviceCapability {
  hasWebGPU: boolean;
  hasSharedArrayBuffer: boolean;
  hardwareConcurrency: number;
  /** Rough heuristic tier used to pick sane defaults, not a benchmark */
  tier: "low" | "mid" | "high";
  crossOriginIsolated: boolean;
}

export interface RenderOptions {
  resolution: "480p" | "720p" | "1080p";
  fps: number;
  format: "mp4" | "webm";
}