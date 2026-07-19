import { AppImage, EffectPreset } from '../types';

export interface ProcessedImageResult {
  blob: Blob;
  width: number;
  height: number;
}

export interface FrameGenerationOptions {
  targetWidth: number;
  targetHeight: number;
  fps: number;
}

const MAX_DIMENSION = 1280; // Cap long edge to prevent WASM heap crashes

/**
 * Resizes/normalizes images via <canvas> before they ever touch FFmpeg's
 * virtual filesystem. This is the single most important guard against
 * tab crashes: a folder of 12MP phone photos fed straight into wasm FS
 * will blow past available heap on low-RAM machines.
 */
export async function processImage(
  file: File | Blob,
  maxDimension: number = MAX_DIMENSION
): Promise<ProcessedImageResult> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const targetWidth = Math.round(bitmap.width * scale);
  const targetHeight = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close(); // release decoded bitmap memory immediately

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.88)
  );

  if (!blob) throw new Error("Failed to encode processed image");

  return { blob, width: targetWidth, height: targetHeight };
}

/**
 * Normalizes a whole batch to a single common aspect ratio (letterboxed
 * where necessary) so FFmpeg's concat/xfade filters don't choke on
 * mismatched frame sizes.
 */
export async function processBatch(
  files: (File | Blob)[],
  maxDimension: number = MAX_DIMENSION
): Promise<ProcessedImageResult[]> {
  const results: ProcessedImageResult[] = [];
  // Sequential, not Promise.all — keeps peak memory to ~1 image at a time,
  // which matters a lot on low-RAM / integrated-graphics machines.
  for (const file of files) {
    results.push(await processImage(file, maxDimension));
  }
  return results;
}

/**
 * Generates individual animated frame Blobs with explicit transforms.
 * Implements non-linear prime sine waves to simulate handheld camera drift.
 */
export async function generateFramesForImage(
  imageItem: any,
  preset: string | undefined,
  options: FrameGenerationOptions
): Promise<Blob[]> {
  const { targetWidth, targetHeight, fps } = options;
  
  // Normalize checking variations for duration settings keys
  const duration = imageItem.durationSec || imageItem.duration || 3;
  const totalFrames = Math.max(1, Math.floor(duration * fps));
  const frames: Blob[] = [];

  const sourceBlob = imageItem.processedBlob || imageItem.blob || imageItem.file;
  if (!sourceBlob) throw new Error("Missing structural image target source file.");
  
  const bitmap = await createImageBitmap(sourceBlob);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable during frame interpolation");
  }

  // Calculate clean letterboxing proportions
  const imgRatio = bitmap.width / bitmap.height;
  const containerRatio = targetWidth / targetHeight;
  
  let renderWidth = targetWidth;
  let renderHeight = targetHeight;
  
  if (imgRatio > containerRatio) {
    renderHeight = targetWidth / imgRatio;
  } else {
    renderWidth = targetHeight * imgRatio;
  }

  const activePreset = String(preset).toLowerCase().trim();

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / (totalFrames - 1 || 1); 
    ctx.clearRect(0, 0, targetWidth, targetHeight);

    // Dynamic black background fill behind image frames
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const centerX = (targetWidth - renderWidth) / 2;
    const centerY = (targetHeight - renderHeight) / 2;

    if (activePreset.includes("ken") || activePreset === "ken_burns") {
      // 1. Core Ken Burns Zoom Matrix
      const zoomScale = 1.0 + 0.18 * progress;
      const sw = renderWidth * zoomScale;
      const sh = renderHeight * zoomScale;

      // 2. Handheld Multi-frequency Wave Displacement
      const timeFactor = progress * Math.PI * 2.5;
      const humanSwayX = Math.sin(timeFactor * 1.7) * 8 + Math.cos(timeFactor * 0.6) * 4;
      const humanSwayY = Math.cos(timeFactor * 2.3) * 6 + Math.sin(timeFactor * 0.4) * 3;

      // 3. Combine steady panning with organic drifting paths
      const smoothPanX = -(sw - renderWidth) * (0.3 + 0.4 * progress);
      const smoothPanY = -(sh - renderHeight) * 0.5;

      const xOffset = centerX + smoothPanX + humanSwayX;
      const yOffset = centerY + smoothPanY + humanSwayY;

      ctx.drawImage(bitmap, xOffset, yOffset, sw, sh);

    } else if (activePreset.includes("slide")) {
      // Human-guided horizontal slider tracking with vertical macro-adjustments
      const slideRange = targetWidth * 0.12;
      const trackingProgress = centerX - (slideRange * progress) + (slideRange / 2);
      
      const timeFactor = progress * Math.PI * 2;
      const verticalJitter = Math.sin(timeFactor * 2.1) * 4; 

      ctx.drawImage(bitmap, trackingProgress, centerY + verticalJitter, renderWidth, renderHeight);

    } else {
      // Static Mode: Centered presentation framework
      ctx.drawImage(bitmap, centerX, centerY, renderWidth, renderHeight);
    }

    const frameBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.90)
    );

    if (frameBlob) {
      frames.push(frameBlob);
    }
  }

  bitmap.close(); // Free graphics context cache immediately
  return frames;
}