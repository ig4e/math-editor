// Vite config — Cloudflare Pages + Vercel both serve from `/`, so we drop
// the previous `./` base used for GitHub Pages.
//
// PWA: vite-plugin-pwa with the `injectManifest` strategy. The custom SW
// source is `src/sw.ts`; the plugin injects the precache manifest at build
// time and emits `dist/sw.js`. Dev mode runs without the SW to avoid
// fighting Vite's HMR (see src/pwa.ts).
//
// MathLive fonts: emitted into `dist/fonts/` so the app renders math
// offline. `MathfieldElement.fontsDirectory` is set to `/fonts` in
// src/main.tsx. The PWA precaches *.woff2 via globPatterns so a service
// worker hit also serves them without a network round-trip.

import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

/** Vite plugin: copy mathlive's bundled woff2 fonts into `dist/fonts/`.
 *  We resolve the package's install location via require.resolve so this
 *  survives hoisting (pnpm / yarn workspaces / npm). Dev server gets the
 *  same files via `configureServer` so hot-reload doesn't 404. */
function mathliveFontsPlugin(): Plugin {
  const require = createRequire(import.meta.url);
  let fontsDir: string;
  let entries: { name: string; data: Buffer }[] = [];

  return {
    name: 'mathlive-fonts',
    apply: () => true,
    configResolved() {
      // mathlive's `package.json` isn't in its `exports` map, so we
      // resolve a known exported entry instead and walk up.
      const entry = require.resolve('mathlive');
      // entry path like `.../node_modules/mathlive/dist/mathlive.mjs`;
      // walk up until we find a folder containing `fonts/`.
      let cur = dirname(entry);
      for (let i = 0; i < 5; i++) {
        try {
          if (readdirSync(cur).includes('fonts')) break;
        } catch { /* keep walking */ }
        cur = dirname(cur);
      }
      fontsDir = join(cur, 'fonts');
      entries = readdirSync(fontsDir)
        .filter((n) => n.endsWith('.woff2'))
        .map((name) => ({ name, data: readFileSync(join(fontsDir, name)) }));
    },
    // Emit during the build so the PWA's `globPatterns` picks them up.
    generateBundle() {
      for (const e of entries) {
        this.emitFile({
          type: 'asset',
          fileName: `fonts/${e.name}`,
          source: e.data,
        });
      }
    },
    // Dev server: intercept `/fonts/*.woff2` and serve from node_modules.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        const m = url.match(/^\/fonts\/(KaTeX_[\w-]+\.woff2)(?:\?.*)?$/);
        if (!m) return next();
        const file = entries.find((e) => e.name === m[1]);
        if (!file) return next();
        res.setHeader('Content-Type', 'font/woff2');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.end(file.data);
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    mathliveFontsPlugin(),
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
