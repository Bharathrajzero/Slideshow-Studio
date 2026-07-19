import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const ExportControls: React.FC = () => {
  const renderedVideoUrl = useAppStore((state) => state.renderedVideoUrl);
  const isRendering = useAppStore((state) => state.isRendering);
  const options = useAppStore((state) => (state as any).options);

  const handleDownload = () => {
    if (!renderedVideoUrl) return;

    // Trusted user gesture handler loop completely unblocked by browser security flags
    const link = document.createElement('a');
    link.href = renderedVideoUrl;
    
    const ext = options?.format === 'webm' ? 'webm' : 'mp4';
    link.download = `studio-export-${Math.floor(Date.now() / 1000)}.${ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-[#12141c]/50 p-4">
      <div className="flex items-center justify-between text-xs font-medium tracking-wide">
        <span className="text-white/40 uppercase mono">Pipeline Status</span>
        {renderedVideoUrl ? (
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Export Complete
          </span>
        ) : isRendering ? (
          <span className="text-amber-400 font-semibold animate-pulse">Encoding Track...</span>
        ) : (
          <span className="text-white/30">Idle</span>
        )}
      </div>

      {renderedVideoUrl && (
        <button
          onClick={handleDownload}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e0562c] py-2.5 text-sm font-bold text-white transition-all hover:bg-[#e0562c]/90 active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download Exported Video
        </button>
      )}
    </div>
  );
};