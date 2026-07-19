import { FFmpegBridge } from "./Ffmpegworker";
import { MemoryManager } from "./memorymanager";
import { generateFramesForImage } from "./imageProcessor"; // Make sure this is imported!
import type { AppImage, EffectSettings, RenderOptions, RenderProgress } from "@/types";

export interface RenderInput {
  images: AppImage[];
  effects: EffectSettings;
  options: RenderOptions;
}

export interface RenderResult {
  blob: Blob;
  url: string;
}

/**
 * Orchestrates a full render: writes sequential canvas frames into the FFmpeg
 * virtual FS, executes the video stitch, reads the result back out, 
 * and handles memory cleanups.
 */
export async function renderVideo(
  bridge: FFmpegBridge,
  memory: MemoryManager,
  input: RenderInput,
  onProgress: (p: RenderProgress) => void
): Promise<RenderResult> {
  const { images, effects, options } = input;

  if (images.length === 0) {
    throw new Error("No images to render");
  }

  onProgress({ stage: "preparing", percent: 0, message: "Loading FFmpeg…" });
  await bridge.load();

  onProgress({ stage: "preparing", percent: 10, message: "Generating motion frames via Canvas…" });

  const sorted = [...images].sort((a, b) => a.order - b.order);
  let totalFramesWritten = 0;

  // 1. Loop through each item and draw its animation frames sequentially
  for (let i = 0; i < sorted.length; i++) {
    const img = sorted[i];
    
    // Fallback through available asset slots cleanly
    const baseBlob = img.processedBlob ?? img.file;

    // Use our frame generator to handle Ken Burns / Slide calculations frame-by-frame
    const frames = await generateFramesForImage(
      { ...img, blob: baseBlob },
      effects.preset, 
      {
        targetWidth: options.width,
        targetHeight: options.height,
        fps: options.fps,
      }
    );

    // Write out the frame arrays sequentially to the virtual filesystem
    for (let f = 0; f < frames.length; f++) {
      const arrayBuffer = await frames[f].arrayBuffer();
      // Zero-pad filenames chronologically so FFmpeg reads them sequentially
      const frameName = `frame_${String(totalFramesWritten).padStart(5, "0")}.jpg`;
      
      await bridge.writeFile(frameName, new Uint8Array(arrayBuffer));
      memory.track(frameName);
      totalFramesWritten++;
    }

    onProgress({
      stage: "preparing",
      percent: 10 + Math.round((i / sorted.length) * 20),
      message: `Rendered frames for image ${i + 1} of ${sorted.length}…`,
    });
  }

  const outputName = `output.${options.format === "webm" ? "webm" : "mp4"}`;

  const codecArgs =
    options.format === "webm"
      ? ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32"]
      : ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "23"];

  // 2. Direct sequential stitching using a clean frame wildcard match.
  // Bypasses the complex, broken filter complex lines completely.
  const args = [
    "-r", String(options.fps),
    "-i", "frame_%05d.jpg",
    ...codecArgs,
    "-r", String(options.fps),
    outputName,
  ];

  onProgress({ stage: "encoding", percent: 30, message: "Encoding video stream…" });
  await bridge.exec(args);
  memory.track(outputName);

  onProgress({ stage: "finalizing", percent: 95, message: "Preparing download…" });
  const data = await bridge.readFile(outputName);
  
  const bytes = new Uint8Array(data);
  const blob = new Blob([bytes], { type: options.format === "webm" ? "video/webm" : "video/mp4" });
  const url = URL.createObjectURL(blob);

  // Wipes all temporary frame files from local browser context
  await memory.releaseAll(bridge);

  onProgress({ stage: "done", percent: 100, message: "Done" });

  return { blob, url };
}