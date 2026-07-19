import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;

  try {
    if (msg.type === 'load') {
      ffmpeg.on('progress', (progress) => {
        self.postMessage({ type: 'progress', ratio: progress.progress });
      });
      await ffmpeg.load();
      self.postMessage({ type: 'loaded' });
    } 
    
    else if (msg.type === 'writeFile') {
      await ffmpeg.writeFile(msg.name, msg.data);
      self.postMessage({ type: 'written', name: msg.name });
    } 
    
    else if (msg.type === 'exec') {
      await ffmpeg.exec(msg.args);
      self.postMessage({ type: 'exec-done' });
    } 
    
    else if (msg.type === 'readFile') {
      const data = await ffmpeg.readFile(msg.name);
      self.postMessage({ type: 'file', name: msg.name, data });
    } 
    
    else if (msg.type === 'cleanup') {
      for (const name of msg.names) {
        await ffmpeg.deleteFile(name);
      }
      self.postMessage({ type: 'cleaned' });
    }
  } catch (error: any) {
    if (msg.type === 'load') {
      self.postMessage({ type: 'load-error', message: error.message });
    } else if (msg.type === 'exec') {
      self.postMessage({ type: 'exec-error', message: error.message });
    } else {
      console.error("Worker error:", error);
    }
  }
};