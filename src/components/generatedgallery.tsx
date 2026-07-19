import { useImageQueue } from "@/hooks/useImageQueue";

/**
 * Shows just the AI-generated frames (as opposed to ImageUploader, which
 * shows the full mixed queue). Useful once generation is wired up and
 * users want to review/discard generated frames separately before they
 * get folded into the main sequence.
 */
export default function GeneratedGallery() {
  const { images, removeImage } = useImageQueue();
  const generated = images.filter((img) => img.source === "generated");

  if (generated.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="mono text-xs uppercase tracking-wide text-white/50">Generated frames</p>
      <div className="flex flex-wrap gap-2">
        {generated.map((img) => (
          <div key={img.id} className="group relative h-20 w-32 overflow-hidden rounded-md border border-white/10">
            <img src={img.previewUrl} alt="" className="h-full w-full object-cover" />
            <button
              onClick={() => removeImage(img.id)}
              className="absolute right-1 top-1 rounded bg-black/60 px-1 text-[10px] text-white/70 opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}