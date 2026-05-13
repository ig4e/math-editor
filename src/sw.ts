// Custom service worker — registered by `vite-plugin-pwa` with the
// `injectManifest` strategy. *This* file is the SW source; the plugin
// only injects the precache manifest at __WB_MANIFEST.
//
// Strategy:
//   - precache: every emitted asset, manifest, MathLive fonts, icons.
//   - same-origin script/style/font/image (stale-while-revalidate):
//     served from cache for speed, refreshed in the background.
//   - /api/* (network-only): edge functions; offline → real failure.
//   - navigation (network-first): always try the latest index.html so
//     a new deploy's hashed-chunk references win; fall back to cache.
//
// Lifecycle: install + skipWaiting + clientsClaim so a new SW kicks
// in immediately on the next visit. This trades a small risk of
// mid-edit chunk swaps for the much bigger benefit of users on the
// previous build (e.g. the FlexLayout v2 shell) getting the latest
// app code without a hard reload.

/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope & {
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

// ----- same-origin static stale-while-revalidate ----------------------
// SWR means the user sees a fast cached hit instantly *and* the worker
// fetches a fresh copy in the background. Combined with hashed-chunk
// filenames this is effectively immutable per build but self-healing
// across builds.
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/api/') &&
    (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font' ||
      request.destination === 'image'),
  new StaleWhileRevalidate({
    // Cache name bumped (was static-v1) so the old v2-era cache is
    // discarded on this SW activation.
    cacheName: 'static-v3',
    plugins: [new ExpirationPlugin({ maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 })],
  }),
);

// ----- navigation: network-first (so deploys land immediately) -------
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      // Bumped name to invalidate the old shell cache.
      cacheName: 'pages-v3',
      networkTimeoutSeconds: 3,
    }),
  ),
);

// ----- lifecycle -----------------------------------------------------
self.addEventListener('install', () => {
  // Activate immediately rather than waiting for old tabs to close.
  self.skipWaiting();
});

// Claim every open tab so the new SW services them right away.
clientsClaim();

self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
