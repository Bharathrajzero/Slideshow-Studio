import { useCallback } from "react";
import { useAppStore } from "@/store/useappstore";
import { processImage } from "@/core/imageprocessor";
import type { AppImage } from "@/types";

const DEFAULT_DURATION_SEC = 4;

function makeId() {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useImageQueue() {
  const addImages = useAppStore((s) => s.addImages);
  const images = useAppStore((s) => s.images);
  const removeImage = useAppStore((s) => s.removeImage);
  const reorderImages = useAppStore((s) => s.reorderImages);
  const setImageDuration = useAppStore((s) => s.setImageDuration);

  const addFiles = useCallback(
    async (files: File[]) => {
      const startOrder = images.length;
      const newImages: AppImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const previewUrl = URL.createObjectURL(file);
        newImages.push({
          id: makeId(),
          file,
          previewUrl,
          order: startOrder + i,
          source: "upload",
          durationSec: DEFAULT_DURATION_SEC,
        });
      }

      // Add immediately so the UI shows thumbnails right away...
      addImages(newImages);

      // ...then process (resize) in the background, sequentially, to keep
      // peak memory low on weak hardware.
      for (const img of newImages) {
        try {
          const { blob } = await processImage(img.file);
          useAppStore.setState((state) => ({
            images: state.images.map((i) => (i.id === img.id ? { ...i, processedBlob: blob } : i)),
          }));
        } catch {
          // Leave the original file as fallback if processing fails
        }
      }
    },
    [addImages, images.length]
  );

  const addGeneratedImage = useCallback(
    (blob: Blob) => {
      const file = new File([blob], `generated_${Date.now()}.png`, { type: blob.type });
      const previewUrl = URL.createObjectURL(file);
      addImages([
        {
          id: makeId(),
          file,
          previewUrl,
          processedBlob: blob,
          order: useAppStore.getState().images.length,
          source: "generated",
          durationSec: DEFAULT_DURATION_SEC,
        },
      ]);
    },
    [addImages]
  );

  return { images, addFiles, addGeneratedImage, removeImage, reorderImages, setImageDuration };
}