interface ModelLoadOverlayProps {
  visible: boolean;
  progressPercent: number;
}

/**
 * Placeholder UI for the local text-to-image model's first-run download.
 * Not triggered yet since ai/providers/localProvider.ts is a stub — wire
 * this up to that provider's load progress once a real model is chosen.
 */
export default function ModelLoadOverlay({ visible, progressPercent }: ModelLoadOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-80 rounded-xl border border-white/10 bg-slate-850 p-6 text-center">
        <p className="font-display text-paper">Downloading generation model…</p>
        <p className="mono mt-1 text-xs text-white/40">First run only — cached after this</p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-reel transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}