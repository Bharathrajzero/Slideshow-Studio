import { useAppStore } from "@/store/useAppStore";
import { triggerDownload } from "@/utils/fileHelpers";

export default function VideoPlayer() {
  const resultUrl = useAppStore((s) => s.resultUrl);
  const format = useAppStore((s) => s.renderOptions.format);

  if (!resultUrl) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-850 p-4">
      <video src={resultUrl} controls className="w-full rounded-lg bg-black" />
      <button
        onClick={() => triggerDownload(resultUrl, `slideshow.${format}`)}
        className="self-start rounded-lg border border-reel/40 px-4 py-2 text-sm text-reel transition-colors hover:bg-reel hover:text-white"
      >
        Download {format.toUpperCase()}
      </button>
    </div>
  );
}