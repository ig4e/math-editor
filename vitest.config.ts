// Vitest config — jsdom environment + the same Vite plugins (React,
// Tailwind) so component tests render the same way the build does.
// Tests live in src/**/__tests__/*.test.ts(x).

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false, // skip Tailwind transform in tests for speed
  },
  resolve: {
    alias: {
      // Avoid pulling Excalidraw / mathlive into unit tests; provide
      // empty shims when something accidentally pulls them in.
      '@excalidraw/excalidraw': new URL('./src/__tests__/excalidraw-shim.ts', import.meta.url).pathname,
      'mathlive': new URL('./src/__tests__/mathlive-shim.ts', import.meta.url).pathname,
    },
  },
});
