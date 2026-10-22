import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { serviceWorkerPlugin } from './vite-pwa.ts';

function basePath(): string {
  if (process.env.GITHUB_PAGES !== 'true') return '/';
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  if (!repo || repo.endsWith('.github.io')) return '/';
  return `/${repo}/`;
}

export default defineConfig({
  base: basePath(),
  plugins: [react(), tailwindcss(), serviceWorkerPlugin()],
  server: { host: '127.0.0.1', port: 4317, strictPort: true },
  preview: { host: '127.0.0.1', port: 4317, strictPort: true },
  build: { sourcemap: false },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
