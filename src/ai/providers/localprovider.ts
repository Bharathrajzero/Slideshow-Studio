import type { GenerationSettings } from "@/types";

/**
 * STUB — local, fully-offline text-to-image generation via WebGPU.
 *
 * Intended implementation: transformers.js (or onnxruntime-web) running an
 * SD-Turbo / SDXL-Lightning class model with a WebGPU execution provider.
 * This only gets selected by ai/generation.ts when useDeviceCapabilities
 * reports hasWebGPU === true — see DeviceWarningBanner.tsx for what happens
 * when it doesn't.
 *
 * Not implemented here on purpose: the model choice, quantization, and
 * exact loading strategy are worth picking deliberately (model size vs.
 * quality vs. how long you're willing to make first-run users wait), so
 * this is left as a clean seam rather than a guessed-at implementation.
 *
 * Sketch of what belongs here:
 *   1. Lazy-import the model runtime (don't bundle it into the main chunk)
 *   2. Load weights from IndexedDB cache (see utils/modelCache.ts) or
 *      fetch + cache on first run
 *   3. Run the diffusion loop inside workers/textToImage.worker.ts so it
 *      doesn't block the main thread, mirroring the FFmpeg worker pattern
 *   4. Return a Blob (PNG/JPEG) so it slots straight into AppImage
 */
export async function generateLocal(_settings: GenerationSettings): Promise<Blob> {
  throw new Error(
    "Local generation not implemented yet. See src/ai/providers/localProvider.ts for the intended shape."
  );
}

export async function isLocalModelCached(): Promise<boolean> {
  // Wire this up to utils/modelCache.ts once a model is chosen.
  return false;
}