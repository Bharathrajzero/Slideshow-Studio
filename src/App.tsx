import React, { useState, useMemo } from "react";
// Import your true core processing functions and bridge wrappers
import { renderVideo } from "./core/vediorenderer";
import { FFmpegBridge } from "./core/Ffmpegworker";
import { MemoryManager } from "./core/memorymanager";

export default function App() {
  // Application UI and functional pipeline states
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorLog, setErrorLog] = useState<string | null>(null);
  const [frames, setFrames] = useState<any[]>([]);
  
  // Track the final physical browser media link URL
  const [downloadableVideoUrl, setDownloadableVideoUrl] = useState<string | null>(null);
  
  // Export and video builder parameter configurations
  const [settings, setSettings] = useState({
    effect: "ken-burns",
    holdTime: "3",
    resolution: "720p",
    format: "mp4"
  });
  
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Idle");

  // Initialize instances safely inside the React lifecycle to prevent 'load is not a function' TypeError
  const bridgeInstance = useMemo(() => new FFmpegBridge((progress) => {
    setRenderProgress(progress.percent);
    setStatusMessage(`${progress.stage.toUpperCase()}: ${progress.message}`);
  }), []);
  
  const memoryInstance = useMemo(() => new MemoryManager(), []);

  // 1. Client-Side Image Generation Handler
  const handleGenerateFrame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorLog(null);
    setDownloadableVideoUrl(null);

    try {
      const response = await fetch("/api/generate-frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      // Intercept HTML fallback errors arriving from proxy failure redirection routes
      const contentType = response.headers.get("content-type");
      if (!response.ok || (contentType && contentType.includes("text/html"))) {
        throw new Error(`Server returned HTML text instead of JSON data payload.`);
      }

      const data = await response.json();
      
      // Fetch the generated URL image blob and parse into project workspace schema
      const imgBlob = await (await fetch(data.imageUrl)).blob();
      setFrames((prev) => [...prev, { 
        id: Date.now(), 
        url: data.imageUrl, 
        file: imgBlob,
        processedBlob: imgBlob,
        durationSec: parseInt(settings.holdTime),
        order: prev.length 
      }]);
      setPrompt("");
      setIsGenerating(false);
    } catch (err: any) {
      console.warn("API server down or returning HTML. Engaging stable client canvas renderer:", err.message);
      
      // Execute the procedural fallback canvas engine synchronously
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const seed = prompt.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, `hsl(${seed % 360}, 65%, 93%)`);
        grad.addColorStop(1, '#f8fafc');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(prompt.substring(0, 40), canvas.width / 2, canvas.height / 2);
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          const localUrl = URL.createObjectURL(blob);
          setFrames((prev) => [...prev, {
            id: Date.now(),
            url: localUrl,
            file: blob,
            processedBlob: blob,
            durationSec: parseInt(settings.holdTime),
            order: prev.length
          }]);
        }
        setErrorLog("Remote gateway offline. Rendered sandbox backup canvas.");
        setIsGenerating(false);
        setPrompt("");
      }, 'image/jpeg');
    }
  };

  // 2. Manual Upload Asset Allocation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDownloadableVideoUrl(null);
    files.forEach((file) => {
      const fileUrl = URL.createObjectURL(file);
      setFrames((prev) => [...prev, { 
        id: Date.now() + Math.random(), 
        url: fileUrl, 
        file: file,
        processedBlob: file,
        durationSec: parseInt(settings.holdTime),
        order: prev.length
      }]);
    });
  };

  // 3. TRUE WASM ENCODING PIPELINE ROUTER BLOCK
  const handleRenderVideo = async () => {
    if (frames.length === 0) return;
    setIsRendering(true);
    setDownloadableVideoUrl(null);
    setStatusMessage("Initializing assembly...");

    // Map resolutions down to absolute pixel configurations
    const dimensions = settings.resolution === "1080p" 
      ? { w: 1920, h: 1080 } 
      : settings.resolution === "480p" 
        ? { w: 854, h: 480 } 
        : { w: 1280, h: 720 };

    // Inject the current holdTime dropdown configuration dynamically into all frames right before compilation
    const processedFrames = frames.map(frame => ({
      ...frame,
      durationSec: parseInt(settings.holdTime)
    }));

    try {
      // Execute true layout composition rendering engine
      const result = await renderVideo(
        bridgeInstance,
        memoryInstance,
        {
          images: processedFrames,
          effects: { preset: settings.effect },
          options: {
            format: settings.format,
            fps: 30,
            width: dimensions.w,
            height: dimensions.h,
            resolution: settings.resolution
          }
        },
        (progress) => {
          setRenderProgress(progress.percent);
          setStatusMessage(`${progress.stage.toUpperCase()}: ${progress.message}`);
        }
      );

      setDownloadableVideoUrl(result.url);
      setStatusMessage("Done");
    } catch (renderError: any) {
      console.error("WASM Encoder execution exception occurred:", renderError);
      setErrorLog(`Pipeline Error: ${renderError.message}`);
      setStatusMessage("Failed");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 font-sans relative">
      
      {/* Toast Notification Container */}
      {downloadableVideoUrl && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-4 animate-fade-in border border-slate-800">
          <span className="text-xs font-medium">Video compilation finished</span>
          <a 
            href={downloadableVideoUrl} 
            download={`video-${Math.floor(Date.now() / 1000)}.${settings.format}`}
            className="bg-white text-slate-950 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-slate-200 transition-all shadow-sm"
            onClick={() => setDownloadableVideoUrl(null)}
          >
            Download file
          </a>
        </div>
      )}

      {/* Main Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white text-xs font-bold tracking-tight">S</div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-900">Slideshow Studio</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> WebWASM Engine Active
        </div>
      </header>

      {/* Workspace Frame */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* Settings panel */}
        <section className="w-80 border-r border-slate-200 bg-white p-6 flex flex-col justify-between overflow-y-auto">
          <div className="flex flex-col gap-6">
            
            {/* Form Step */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">01 / Assets</span>
              <form onSubmit={handleGenerateFrame} className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Describe an image to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                  className="w-full"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all"
                >
                  {isGenerating ? "Generating..." : "Generate image"}
                </button>
              </form>

              {errorLog && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-[10px] text-amber-800 font-medium">
                  {errorLog}
                </div>
              )}

              <div className="relative flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center hover:bg-slate-50 transition-all group">
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="absolute inset-0 cursor-pointer opacity-0" />
                <span className="text-[11px] text-slate-500 group-hover:text-slate-700">Upload clean media files</span>
              </div>
            </div>

            {/* Config Step */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">02 / Adjustments</span>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500">Motion Style</label>
                <select 
                  value={settings.effect} 
                  onChange={(e) => setSettings(prev => ({ ...prev, effect: e.target.value }))}
                >
                  <option value="ken-burns">Ken Burns Zoom</option>
                  <option value="static">Static Hold</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-medium text-slate-500">Segment Length</label>
                <select 
                  value={settings.holdTime} 
                  onChange={(e) => setSettings(prev => ({ ...prev, holdTime: e.target.value }))}
                >
                  <option value="1">1 Second</option>
                  <option value="3">3 Seconds</option>
                  <option value="5">5 Seconds</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-500">Output Resolution</label>
                  <select 
                    value={settings.resolution} 
                    onChange={(e) => setSettings(prev => ({ ...prev, resolution: e.target.value }))}
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-medium text-slate-500">Container</label>
                  <select 
                    value={settings.format} 
                    onChange={(e) => setSettings(prev => ({ ...prev, format: e.target.value }))}
                  >
                    <option value="mp4">MP4</option>
                    <option value="webm">WebM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRenderVideo}
            disabled={isRendering || frames.length === 0}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all shadow-sm shadow-blue-600/10"
          >
            {isRendering ? `Encoding: ${renderProgress}%` : `Compile video stream`}
          </button>
        </section>

        {/* Workspace Display Area */}
        <section className="flex flex-1 flex-col bg-slate-50 p-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline Workspace</h3>
            <span className="mono text-[11px] font-medium text-slate-500">Runtime: {frames.length * parseInt(settings.holdTime)}s</span>
          </div>

          <div className="flex-1 rounded-xl border border-slate-200 bg-white p-6 overflow-y-auto shadow-sm">
            {frames.length === 0 ? (
              <div className="flex h-full w-full flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-400 tracking-normal">No image frames built. Enter a prompt or drop standard files to start.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {frames.map((frame, idx) => (
                  <div key={frame.id} className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-inner">
                    <img src={frame.url} alt="Timeline Segment" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="truncate text-[10px] text-white font-medium mono">{frame.prompt || "Uploaded Asset"}</p>
                    </div>
                    <div className="absolute top-2 left-2 flex h-5 w-5 items-center justify-center rounded-md bg-white/90 text-[10px] font-bold text-slate-800 shadow-sm border border-slate-100">{idx + 1}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 mono text-[10px] text-slate-400">
            <div>Log status: <span className="text-slate-700 font-medium">{statusMessage}</span></div>
            <div>Isolation state: CoOp Cross-Origin</div>
          </footer>
        </section>
      </main>
    </div>
  );
}