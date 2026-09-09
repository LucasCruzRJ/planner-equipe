import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tunnelProcess = null;
let publicUrl = null;

export function startCloudflareTunnel(port = 3000, onUrlReady) {
  const binaryPath = path.join(__dirname, '..', 'cloudflared.exe');
  if (!fs.existsSync(binaryPath)) {
    return null;
  }

  try {
    tunnelProcess = spawn(binaryPath, ['tunnel', '--url', `http://localhost:${port}`], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/;

    const handleOutput = (data) => {
      const text = data.toString();
      const match = text.match(urlRegex);
      if (match && !publicUrl) {
        publicUrl = match[0];
        if (onUrlReady) {
          onUrlReady(publicUrl);
        }
      }
    };

    tunnelProcess.stdout.on('data', handleOutput);
    tunnelProcess.stderr.on('data', handleOutput);

    tunnelProcess.on('error', (err) => {
      console.log('Túnel público não pôde ser iniciado automaticamente:', err.message);
    });

    return tunnelProcess;
  } catch (err) {
    return null;
  }
}

export function getPublicTunnelUrl() {
  return publicUrl;
}
