import { create } from "zustand";
import type { DeviceCapability, GenerationMode } from "@/types";

interface CapabilityState {
  capability: DeviceCapability | null;
  generationMode: GenerationMode;
  setCapability: (capability: DeviceCapability) => void;
  setGenerationMode: (mode: GenerationMode) => void;
}

export const useCapabilityStore = create<CapabilityState>((set) => ({
  capability: null,
  generationMode: "disabled",
  setCapability: (capability) => set({ capability }),
  setGenerationMode: (generationMode) => set({ generationMode }),
}));