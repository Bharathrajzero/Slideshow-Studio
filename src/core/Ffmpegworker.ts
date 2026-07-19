import type { RenderProgress } from "@/types";
import FFmpegWorker from '../workers/ffmpeg.worker?worker';

export class FFmpegBridge {
  private worker: Worker | null = null;
  private loadPromise: Promise<void> | null = null;
  private onProgress?: (p: RenderProgress) => void;

  constructor(onProgress?: (p: RenderProgress) => void) {
    this.onProgress = onProgress;
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new FFmpegWorker();
    }
    return this.worker;
  }

  async load(): Promise<void> {
    if (this.loadPromise) return this.loadPromise;
    const worker = this.ensureWorker();

    this.loadPromise = new Promise<void>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "loaded") {
          worker.removeEventListener("message", handler);
          resolve();
        } else if (event.data.type === "load-error") {
          worker.removeEventListener("message", handler);
          reject(new Error(event.data.message));
        }
      };
      worker.addEventListener("message", handler);
      worker.postMessage({ type: "load" });
    });
    return this.loadPromise;
  }

  async writeFile(name: string, data: Uint8Array): Promise<void> {
    const worker = this.ensureWorker();
    worker.postMessage({ type: "writeFile", name, data }, [data.buffer]);
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "written" && event.data.name === name) {
          worker.removeEventListener("message", handler);
          resolve();
        }
      };
      worker.addEventListener("message", handler);
    });
  }

  async exec(args: string[]): Promise<void> {
    const worker = this.ensureWorker();
    worker.postMessage({ type: "exec", args });
    return new Promise((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "exec-done") {
          worker.removeEventListener("message", handler);
          resolve();
        } else if (event.data.type === "exec-error") {
          worker.removeEventListener("message", handler);
          reject(new Error(event.data.message));
        } else if (event.data.type === "progress") {
          this.onProgress?.({ stage: "encoding", percent: Math.round(event.data.ratio * 100), message: "Encoding sequence..." });
        }
      };
      worker.addEventListener("message", handler);
    });
  }

  async readFile(name: string): Promise<Uint8Array> {
    const worker = this.ensureWorker();
    worker.postMessage({ type: "readFile", name });
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "file" && event.data.name === name) {
          worker.removeEventListener("message", handler);
          resolve(event.data.data as Uint8Array);
        }
      };
      worker.addEventListener("message", handler);
    });
  }

  async cleanup(names: string[]): Promise<void> {
    const worker = this.ensureWorker();
    worker.postMessage({ type: "cleanup", names });
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === "cleaned") {
          worker.removeEventListener("message", handler);
          resolve();
        }
      };
      worker.addEventListener("message", handler);
    });
  }

  terminate(): void {
    this.worker?.postMessage({ type: "terminate" });
    this.worker?.terminate();
    this.worker = null;
    this.loadPromise = null;
  }
}