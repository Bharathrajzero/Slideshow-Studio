import { GenerationSettings } from '../../types';

export async function generateRemoteImage(
  prompt: string,
  settings: GenerationSettings
): Promise<string> {
  try {
    // 1. Attempt the true remote server API call
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, settings }),
    });

    if (!response.ok) {
      throw new Error(`API error: status code ${response.status}`);
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.warn(
      "Remote backend server offline. Intercepting proxy rules and routing through client fallback...",
      error
    );

    // 2. Client Fallback: Generates a 16:9 cinematic color placeholder frame inside the browser canvas
    return new Promise((resolve) => {
      setTimeout(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Build a programmatic dark gradient inspired by your prompt string
          const seed = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const hue = seed % 360;

          const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          grad.addColorStop(0, `hsl(${hue}, 45%, 16%)`);
          grad.addColorStop(1, '#0d0e11');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw procedural film reel sprocket markers
          ctx.fillStyle = 'rgba(245, 244, 240, 0.04)';
          for (let x = 0; x < canvas.width; x += 40) {
            ctx.fillRect(x + 10, 20, 20, 20);
            ctx.fillRect(x + 10, canvas.height - 40, 20, 20);
          }

          // Display the prompt text onto the rendering preview frame
          ctx.fillStyle = '#f5f4f0';
          ctx.font = 'bold 36px "Space Grotesk", system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const printableText = prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt;
          ctx.fillText(printableText, canvas.width / 2, canvas.height / 2);

          // Subtitle identifier
          ctx.fillStyle = '#e0562c';
          ctx.font = '500 14px "JetBrains Mono", monospace';
          ctx.fillText('[ SANDBOX DEVELOPMENT ACTIVE • CLIENT RENDERING ]', canvas.width / 2, canvas.height / 2 + 65);
        }

        // Output base64 data image asset string
        resolve(canvas.toDataURL('image/jpeg'));
      }, 900);
    });
  }
}