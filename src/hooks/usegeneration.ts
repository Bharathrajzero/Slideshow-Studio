import { useCallback, useState } from "react";
import { generateImage } from "@/ai/generation";
import { useCapabilityStore } from "@/store/usecapabilitystore";
import { useImageQueue } from "./useimagequeue";
import type { GenerationSettings } from "@/types";

export function useGeneration() {
  const generationMode = useCapabilityStore((s) => s.generationMode);
  const { addGeneratedImage } = useImageQueue();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (settings: GenerationSettings) => {
      setError(null);
      setIsGenerating(true);
      try {
        const blob = await generateImage(generationMode, settings);
        addGeneratedImage(blob);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setIsGenerating(false);
      }
    },
    [generationMode, addGeneratedImage]
  );

  return { generate, isGenerating, error, generationMode };
}