import { useCallback } from "react";
import { useAppStore } from "@/store/useappstore";
import { useCapabilityStore } from "@/store/useCapabilityStore";

export function useGeneration() {
  const setProgress = useAppStore((s) => s.setProgress);
  const addImages = useAppStore((s) => s.addImages); // Or your specific append action
  const { mode } = useCapabilityStore();

  const generateFramesFromPrompt = useCallback(async (prompt: string) => {
    // 🛑 REMOVED: Any global fetch requests to '/api/generate-frame' or '/api/generate-image'
    
    setProgress({ stage: "preparing", percent: 0, message: "Initializing AI framework..." });

    try {
      if (mode === "local") {
        // Implement your actual local WebGPU runner here when ready
        throw new Error("Local WebGPU provider not fully implemented yet.");
      } else {
        // 🛠️ FIX: Instead of running a proxy-crashing fetch request, generate an inline color/gradient canvas blob mock
        setProgress({ stage: "preparing", percent: 50, message: "Simulating fallback frame layout..." });
        
        const mockBlob = await createMockImageBlob(prompt);
        
        // Add the image structural item to your state store mimicking a true snapshot format
        addImages([{
          id: crypto.randomUUID(),
          file: mockBlob,
          processedBlob: mockBlob,
          url: URL.createObjectURL(mockBlob),
          order: Date.now(),
          durationSec: 5, // 🛠️ Explicitly sets duration here so videoRenderer picks it up
        }]);

        setProgress({ stage: "done", percent: 100, message: "Placeholder frame successfully added!" });
      }
    } catch (err) {
      setProgress({
        stage: "error",
        percent: 0,
        message: err instanceof Error ? err.message : "AI generation failed",
      });
    }
  }, [mode, setProgress, addImages]);

  return { generateFramesFromPrompt };
}

/**
 * Generates a lightweight baseline client-side image canvas to act as a 
 * placeholder stub without triggering Vite proxy timeouts.
 */
function createMockImageBlob(text: string): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      // Draw a neat placeholder layout block
      const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
      gradient.addColorStop(0, "#1e3a8a");
      gradient.addColorStop(1, "#3b82f6");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1280, 720);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`AI Stub: "${text}"`, 640, 360);
    }
    
    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9);
  });
}