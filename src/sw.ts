// Custom service worker — registered by `vite-plugin-pwa` with the
// `injectManifest` strategy, which means *this* file is the SW source and
// the plugin only injects the precache manifest at __WB_MANIFEST.
//
// Strategy summary:
//   - precache: every emitted asset, manifest, MathLive fonts, icons.
//   - same-origin static (cache-first): assets served outside /api/.
//   - /api/* (network-only): edge functions; offline → real failure.
//   - navigation (network-first, falls back to cached shell): index.html.

/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope & {
  // vite-plugin-pwa scans the source for the literal `self.__WB_MANIFEST`
  // and inlines the precache manifest at build time.
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// ----- precache --------------------------------------------------------
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ----- API routes: never cache (so failures surface honestly) ---------
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly(),
);

// ----- same-origin static cache-first ---------------------------------
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/api/') &&
    (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font' ||
      request.destination === 'image'),
  new CacheFirst({
    cacheName: 'static-v1',
    plugins: [new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

// ----- navigation: network-first, fall back to the precached shell ---
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'pages-v1',
      networkTimeoutSeconds: 3,
    }),
  ),
);

// ----- lifecycle: skip-waiting on demand ------------------------------
self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', () => {
  // Don't self.skipWaiting() automatically — let the client opt-in via
  // postMessage so we don't reload mid-edit.
});
