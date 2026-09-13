import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Ports and the API URL live in the repo-root .env so docker-compose and local dev agree.
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, repoRoot, '');
  const apiBaseUrl = rootEnv.API_BASE_URL ?? 'http://localhost:3000';
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
