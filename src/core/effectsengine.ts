import type { EffectSettings, RenderOptions } from "@/types";

const RESOLUTION_MAP: Record<RenderOptions["resolution"], { w: number; h: number }> = {
  "480p": { w: 854, h: 480 },
  "720p": { w: 1280, h: 720 },
  "1080p": { w: 1920, h: 1080 },
};

/**
 * Builds the per-image filter (zoompan for Ken Burns, or a plain scale/pad
 * for static) plus the concat/xfade graph that stitches every image into
 * one video stream. Returns the filter_complex string and the final output
 * label to map in the FFmpeg command.
 */
export function buildFilterGraph(
  imageCount: number,
  durations: number[],
  effects: EffectSettings,
  options: RenderOptions
): { filterComplex: string; outputLabel: string } {
  const { w, h } = RESOLUTION_MAP[options.resolution];
  const fps = options.fps;
  const zoom = 1 + effects.zoomIntensity * 0.3; // max 30% zoom over the clip
  const transitionDur = effects.transitionDurationSec;

  const perImageFilters: string[] = [];
  const labels: string[] = [];

  for (let i = 0; i < imageCount; i++) {
    const dur = durations[i] ?? 4;
    const frames = Math.round(dur * fps);
    const label = `v${i}`;
    labels.push(label);

    if (effects.preset === "kenburns") {
      // Alternate direction each image so a sequence doesn't feel repetitive
      const zoomExpr =
        i % 2 === 0
          ? `min(zoom+${(zoom - 1) / frames},${zoom})`
          : `if(eq(on,1),${zoom},max(zoom-${(zoom - 1) / frames},1))`;
      const panX = i % 2 === 0 ? "iw/2-(iw/zoom/2)" : "0";
      const panY = "ih/2-(ih/zoom/2)";

      perImageFilters.push(
        `[${i}:v]scale(-2,${h * 2}):flags=lanczos,` +
          `zoompan=z='${zoomExpr}':x='${panX}':y='${panY}':d=${frames}:s=${w}x${h}:fps=${fps},` +
          `setsar=1[${label}]`
      );
    } else if (effects.preset === "slide") {
      perImageFilters.push(
        `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,` +
          `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,` +
          `loop=loop=${frames}:size=1:start=0,setpts=N/(${fps}*TB)[${label}]`
      );
    } else {
      // static / fade-only: no motion, just hold the frame
      perImageFilters.push(
        `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=decrease,` +
          `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2,setsar=1,` +
          `loop=loop=${frames}:size=1:start=0,setpts=N/(${fps}*TB)[${label}]`
      );
    }
  }

  // Chain crossfades (xfade) between consecutive clips, or a straight concat for cuts
  let chain: string;
  let outputLabel: string;

  if (effects.transition === "crossfade" && imageCount > 1) {
    let prev = labels[0];
    let offset = (durations[0] ?? 4) - transitionDur;
    const xfadeParts: string[] = [];

    for (let i = 1; i < labels.length; i++) {
      const out = `xf${i}`;
      xfadeParts.push(
        `[${prev}][${labels[i]}]xfade=transition=fade:duration=${transitionDur}:offset=${offset.toFixed(2)}[${out}]`
      );
      prev = out;
      offset += (durations[i] ?? 4) - transitionDur;
    }
    chain = xfadeParts.join(";");
    outputLabel = prev;
  } else {
    // Straight concat, no crossfade
    const concatInputs = labels.map((l) => `[${l}]`).join("");
    chain = `${concatInputs}concat=n=${imageCount}:v=1:a=0[outv]`;
    outputLabel = "outv";
  }

  const filterComplex = [...perImageFilters, chain].join(";");

  return { filterComplex, outputLabel };
}

export const DEFAULT_EFFECT_SETTINGS: EffectSettings = {
  preset: "kenburns",
  transition: "crossfade",
  transitionDurationSec: 0.6,
  panIntensity: 0.5,
  zoomIntensity: 0.5,
};

/**
 * Very lightweight prompt -> effect mapping. Keeps the "prompt drives the
 * animation feel" idea without needing any model at all — just keyword
 * heuristics. ai/promptToEffects.ts wraps this with the AI-assisted version.
 */
export function effectsFromKeywords(prompt: string): Partial<EffectSettings> {
  const p = prompt.toLowerCase();
  if (/(calm|slow|gentle|peaceful|ambient)/.test(p)) {
    return { preset: "kenburns", zoomIntensity: 0.2, transitionDurationSec: 1.2 };
  }
  if (/(energetic|fast|hype|action|upbeat)/.test(p)) {
    return { preset: "kenburns", zoomIntensity: 0.8, transitionDurationSec: 0.3, transition: "crossfade" };
  }
  if (/(clean|minimal|simple|corporate)/.test(p)) {
    return { preset: "static", transition: "cut" };
  }
  return {};
}