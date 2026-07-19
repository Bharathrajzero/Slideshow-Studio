// Copies the FFmpeg core wasm/js files out of node_modules/@ffmpeg/core
// into public/ffmpeg-core so the app can self-host them (see the note in
// vite.config.ts about why we avoid a CDN dependency).
import { existsSync, mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const srcDir = join(root, "node_modules", "@ffmpeg", "core", "dist", "umd");
const destDir = join(root, "public", "ffmpeg-core");

const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

if (!existsSync(srcDir)) {
  console.warn(
    `[copy-ffmpeg-core] Could not find ${srcDir} — did @ffmpeg/core install correctly? Skipping copy.`
  );
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

for (const file of files) {
  const src = join(srcDir, file);
  const dest = join(destDir, file);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`[copy-ffmpeg-core] Copied ${file}`);
  } else {
    console.warn(`[copy-ffmpeg-core] Missing expected file: ${src}`);
  }
}