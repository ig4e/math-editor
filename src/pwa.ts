// Registers the service worker via vite-plugin-pwa's virtual module.
//
// With registerType: 'autoUpdate' the worker self-applies as soon as
// the install step completes — paired with sw.ts's skipWaiting +
// clientsClaim it means users on the previous build see the new app
// on their next visit without a manual reload prompt.

type RefreshCb = () => void;

let pending: RefreshCb | null = null;
const subscribers = new Set<(cb: RefreshCb | null) => void>();

/** Subscribe to "a new SW is waiting — call this to apply it". With
 *  autoUpdate this is rarely fired, but the hook stays in place so a
 *  later UI can show "the app has updated, refresh now". */
export function subscribeUpdate(cb: (refresh: RefreshCb | null) => void): () => void {
  subscribers.add(cb);
  cb(pending);
  return () => subscribers.delete(cb);
}

export function setupPWA(): void {
  // Dev-mode skip: avoids hot-reload churn fighting the SW.
  if (import.meta.env.DEV) return;

  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          pending = () => updateSW(true);
          subscribers.forEach((s) => s(pending));
        },
        onOfflineReady() {
          console.info('[pwa] offline-ready');
        },
        onRegisterError(err: unknown) {
          console.warn('[pwa] register failed', err);
        },
      });
    })
    .catch((err: unknown) => console.warn('[pwa] not available', err));
}

/**
 * Emergency: unregister every service worker + delete every cache
 * we've created. Surfaced as the `help.resetCache` command. The page
 * reloads after to fetch a fresh shell straight from the network.
 */
export async function resetServiceWorkerAndCaches(): Promise<void> {
  try {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if (typeof caches !== 'undefined') {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch (err) {
    console.warn('[pwa] reset failed', err);
  }
  if (typeof location !== 'undefined') {
    // Cache-bust so the browser's HTTP cache doesn't replay the old
    // shell either.
    location.replace(location.pathname + '?_=' + Date.now());
  }
}
