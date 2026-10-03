/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the client calls /api/* and Vite forwards it to the Express
// server, so the browser sees one origin. In production set VITE_API_URL.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    // Pure logic tests run in node; component tests (*.test.tsx) ask for jsdom in their first line
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    // e2e/ is Playwright's (npm run test:e2e)
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
