// Vite config — Cloudflare Pages + Vercel both serve from `/`, so we drop
// the previous `./` base used for GitHub Pages.
//
// PWA: vite-plugin-pwa with the `injectManifest` strategy. The custom SW
// source is `src/sw.ts`; the plugin injects the precache manifest at build
// time and emits `dist/sw.js`. Dev mode runs without the SW to avoid
// fighting Vite's HMR (see src/pwa.ts).

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: false, // we register manually via src/pwa.ts
      manifest: false,        // we ship public/manifest.webmanifest by hand
      injectManifest: {
        // The biggest assets we ever precache should be Excalidraw chunks.
        // Anything above 4 MB is almost certainly a mistake or Pyodide
        // (which we explicitly cache lazily via IDB, not the SW precache).
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest,json}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Keep the main entry small. Big stable deps each get their own
        // chunk so the browser caches them across deploys when the app code
        // changes. Lazy panels (Excalidraw, JSXGraph, Three) are split
        // automatically by dynamic import — no manual entry needed for those.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          // Order matters — most specific first.
          if (id.includes('mathlive')) return 'vendor-mathlive';
          if (id.includes('@cortex-js/compute-engine')) return 'vendor-cas';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('zustand') || id.includes('zundo') || id.includes('immer')) return 'vendor-state';
          // React stays in the default vendor bundle alongside the app so
          // the state slice (which imports zustand which imports react)
          // doesn't form a cross-chunk cycle.
          return undefined;
        },
      },
    },
  },
});
