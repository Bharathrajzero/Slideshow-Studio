import type { FFmpegBridge } from "./ffmpegWorker";

/**
 * FFmpeg's wasm heap does NOT get garbage collected the way normal JS
 * objects do. If you run multiple renders in one session without
 * explicitly deleting the virtual-FS files, memory climbs steadily until
 * the tab crashes — this is the #1 cause of "it worked once then died"
 * bug reports for FFmpeg.wasm apps.
 */
export class MemoryManager {
  private writtenFiles = new Set<string>();

  track(name: string) {
    this.writtenFiles.add(name);
  }

  trackMany(names: string[]) {
    names.forEach((n) => this.writtenFiles.add(n));
  }

  async releaseAll(bridge: FFmpegBridge): Promise<void> {
    if (this.writtenFiles.size === 0) return;
    await bridge.cleanup(Array.from(this.writtenFiles));
    this.writtenFiles.clear();
  }

  get trackedCount() {
    return this.writtenFiles.size;
  }
}