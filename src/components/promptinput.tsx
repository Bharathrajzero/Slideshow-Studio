import { useState } from "react";
import { useGeneration } from "@/hooks/useGeneration";
import { useCapabilityStore } from "@/store/useCapabilityStore";

export default function PromptInput() {
  const [prompt, setPrompt] = useState("");
  const { generate, isGenerating, error, generationMode } = useGeneration();

  const disabled = generationMode === "disabled" || isGenerating || prompt.trim().length === 0;

  return (
    <div className="flex flex-col gap-2">
      <label className="mono text-xs uppercase tracking-wide text-white/50">
        Generate a frame from text
      </label>
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="a calm sunrise over a misty harbor, cinematic"
          disabled={generationMode === "disabled"}
          className="flex-1 rounded-lg border border-white/15 bg-slate-850 px-3 py-2 text-sm text-paper placeholder:text-white/30 disabled:opacity-40"
        />
        <button
          onClick={() =>
            generate({ prompt, steps: 4, width: 768, height: 512 })
          }
          disabled={disabled}
          className="rounded-lg bg-reel px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-reel-dim disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isGenerating ? "Generating…" : "Generate"}
        </button>
      </div>
      {generationMode !== "disabled" && (
        <p className="mono text-[11px] text-white/35">
          Running {generationMode === "local" ? "on-device via WebGPU" : "via remote API"}
        </p>
      )}
      {error && <p className="text-xs text-reel">{error}</p>}
    </div>
  );
}