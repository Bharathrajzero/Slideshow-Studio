import { useCapabilityStore } from "@/store/useCapabilityStore";

export default function DeviceWarningBanner() {
  const capability = useCapabilityStore((s) => s.capability);
  const generationMode = useCapabilityStore((s) => s.generationMode);

  if (!capability) return null;

  if (generationMode === "local") return null;

  return (
    <div className="rounded-lg border border-reel/30 bg-reel/10 px-4 py-3 text-sm text-paper/90">
      {generationMode === "remote" ? (
        <p>
          <span className="mono text-reel">i</span> On-device AI image generation isn't
          available on this hardware — prompts will be sent to a remote service instead.
          Uploading your own images and animating them still runs fully in your browser.
        </p>
      ) : (
        <p>
          <span className="mono text-reel">i</span> AI image generation is unavailable right now
          (no GPU acceleration detected and no connection to a generation service). You can still
          upload your own images — the animation and export pipeline runs entirely offline.
        </p>
      )}
    </div>
  );
}