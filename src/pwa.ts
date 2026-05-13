// Registers the service worker via vite-plugin-pwa's virtual module.
//
// We deliberately ask for `autoUpdate: false` (configured in vite.config.ts)
// so the user is in control of when the new SW takes over — important when
// they have unsaved edits in MathLive. `useRegisterSW` would tie us to a
// React hook; we keep the registration framework-agnostic instead.

// `virtual:pwa-register` is provided by vite-plugin-pwa at build time;
// its types come from the triple-slash reference in src/vite-env.d.ts.

type RefreshCb = () => void;

let pending: RefreshCb | null = null;
const subscribers = new Set<(cb: RefreshCb | null) => void>();

/** Subscribe to "a new SW is waiting — call this to apply it". */
export function subscribeUpdate(cb: (refresh: RefreshCb | null) => void): () => void {
  subscribers.add(cb);
  cb(pending);
  return () => subscribers.delete(cb);
}

export function setupPWA(): void {
  // Dev-mode skip: avoids hot-reload churn fighting the SW.
  if (import.meta.env.DEV) return;

  // Dynamic-imported so a build without the plugin (e.g. tests) still works.
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      const updateSW = registerSW({
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
