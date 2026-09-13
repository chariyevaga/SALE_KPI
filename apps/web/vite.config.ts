import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Ports live in the repo-root .env so Docker Compose and local development agree.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, repoRoot, '');
  const apiPort = Number(rootEnv.API_PORT);
  const resolvedApiPort = Number.isInteger(apiPort) && apiPort > 0 ? apiPort : 3000;
  const apiBaseUrl =
    process.env.VITE_API_BASE_URL?.trim() ||
    rootEnv.API_BASE_URL?.trim() ||
    `http://localhost:${resolvedApiPort}`;
  const webPort = Number(rootEnv.WEB_PORT);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      ...(Number.isInteger(webPort) && webPort > 0 ? { port: webPort } : {}),
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
  };
});
