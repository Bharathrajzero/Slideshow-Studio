import { create } from 'zustand';
import { renderVideo } from '../core/videoRenderer';
// ... import your active bridge, memory, options instances here

interface AppState {
  images: any[];
  isRendering: boolean;
  renderedVideoUrl: string | null;
  renderVideoTimeline: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  images: [],
  isRendering: false,
  renderedVideoUrl: null, // Initial tracking parameter

  renderVideoTimeline: async () => {
    set({ isRendering: true, renderedVideoUrl: null });
    
    try {
      // Execute the underlying WASM compilation processing tree
      const result = await renderVideo(
        (get() as any).bridge, 
        (get() as any).memory, 
        { 
          images: (get() as any).images, 
          effects: (get() as any).effects, 
          options: (get() as any).options 
        },
        (progress) => {
          // Keep your active store progress display logs updated here
          set({ renderProgress: progress });
        }
      );

      // Save the validated browser object data blob string URL to the state
      set({ renderedVideoUrl: result.url, isRendering: false });
    } catch (error) {
      console.error("WASM Render pipeline execution failed:", error);
      set({ isRendering: false, renderedVideoUrl: null });
    }
  }
}));