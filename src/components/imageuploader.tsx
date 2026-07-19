import { useCallback, useRef, useState } from "react";
import { useImageQueue } from "@/hooks/useImageQueue";
import { isImageFile } from "@/utils/fileHelpers";

export default function ImageUploader() {
  const { images, addFiles, removeImage, reorderImages, setImageDuration } = useImageQueue();
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).filter(isImageFile);
      if (files.length) addFiles(files);
    },
    [addFiles]
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging ? "border-reel bg-reel/5" : "border-white/15 hover:border-white/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="font-display text-lg text-paper">Drop images here, or click to browse</p>
        <p className="mono mt-1 text-xs text-white/40">JPG, PNG, WebP — reorder after upload</p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((img, idx) => (
              <div
                key={img.id}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== idx) {
                    reorderImages(dragIndex, idx);
                  }
                  setDragIndex(null);
                }}
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-slate-850"
              >
                <img
                  src={img.previewUrl}
                  alt=""
                  className="aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                />
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-1.5">
                  <span className="mono rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
                    #{idx + 1}
                    {img.source === "generated" ? " · AI" : ""}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70 hover:bg-reel hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/60 px-1.5 py-1">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={img.durationSec}
                    onChange={(e) => setImageDuration(img.id, Number(e.target.value))}
                    className="h-1 flex-1 accent-reel"
                  />
                  <span className="mono w-8 text-right text-[10px] text-white/60">
                    {img.durationSec}s
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}