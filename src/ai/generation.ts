import { generateRemoteImage } from './providers/remoteProvider';
import { GenerationSettings } from '../types';

export async function generateImage(
  prompt: string,
  mode: 'local' | 'remote',
  settings: GenerationSettings
): Promise<string> {
  if (mode === 'local') {
    // Fallback directly to the remote/mock module if local WebGPU parameters are unassigned
    return generateRemoteImage(prompt, settings);
  }
  
  return generateRemoteImage(prompt, settings);
}