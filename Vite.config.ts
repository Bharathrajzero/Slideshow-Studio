import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,        // Moves away from the broken/locked 5173 port
    strictPort: false, // Automatically picks the next port if locked
    watch: {
      // Directs the file system watcher to ignore configuration files entirely
      ignored: ['**/vite.config.*', '**/Vite.config.*', '**/node_modules/**', '**/.git/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Keeps your backend port mapped
        changeOrigin: true,
        secure: false,
        // 🛠️ ADDED: Gracefully handle cases where the backend server on port 5000 is offline
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, res) => {
            console.warn(`[Vite Proxy Error]: Target server offline at ${options.target}${req.url}`);
            
            // Check if res is a standard response object before writing headers
            if (res && typeof res.writeHead === 'function') {
              res.writeHead(502, {
                'Content-Type': 'application/json',
              });
              res.end(JSON.stringify({ 
                error: 'Backend API server is offline', 
                details: err.message 
              }));
            }
          });
        }
      }
    },
    headers: {
      // ⚠️ CRITICAL: Required for FFmpeg.wasm multi-threading to unlock SharedArrayBuffer allocations!
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
  worker: {
    format: 'es', // Forces Vite to treat web workers as native EcmaScript modules
  },
  optimizeDeps: {
    // Stops Vite from optimization pre-bundling worker paths and crashing with path errors
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  }
})