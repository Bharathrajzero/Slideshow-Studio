import { useEffect } from "react";
import { useCapabilityStore } from "@/store/usecapabilitystore";
import type { DeviceCapability, GenerationMode } from "@/types";

/**
 * Runs cheap feature detection (not a benchmark) once on mount, and picks
 * a sane default generation mode:
 *   - WebGPU available            -> "local"   (generate on-device, fully offline)
 *   - No WebGPU, but online       -> "remote"  (offload generation to an API)
 *   - Neither / explicit opt-out  -> "disabled" (upload-only flow still works)
 *
 * This is what lets the same UI run acceptably on a modern laptop with a
 * real GPU and on something like an old dual-core ThinkPad with only
 * integrated graphics.
 */
export function useDeviceCapabilities() {
  const setCapability = useCapabilityStore((s) => s.setCapability);
  const setGenerationMode = useCapabilityStore((s) => s.setGenerationMode);

  useEffect(() => {
    async function detect() {
      const hasWebGPU = "gpu" in navigator;
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
      const hardwareConcurrency = navigator.hardwareConcurrency ?? 2;
      const crossOriginIsolated = window.crossOriginIsolated ?? false;

      let webGPUUsable = false;
      if (hasWebGPU) {
        try {
          // @ts-expect-error - navigator.gpu is not in all TS lib versions yet
          const adapter = await navigator.gpu.requestAdapter();
          webGPUUsable = !!adapter;
        } catch {
          webGPUUsable = false;
        }
      }

      const tier: DeviceCapability["tier"] =
        hardwareConcurrency >= 8 && webGPUUsable
          ? "high"
          : hardwareConcurrency >= 4
            ? "mid"
            : "low";

      const capability: DeviceCapability = {
        hasWebGPU: webGPUUsable,
        hasSharedArrayBuffer,
        hardwareConcurrency,
        tier,
        crossOriginIsolated,
      };

      setCapability(capability);

      const mode: GenerationMode = webGPUUsable
        ? "local"
        : navigator.onLine
          ? "remote"
          : "disabled";
      setGenerationMode(mode);
    }

    detect();
  }, [setCapability, setGenerationMode]);
}