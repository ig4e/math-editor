// Pre-warm heavy lazy modules in the background once the app has been
// idle. The user's first interaction with the Solver / Matrix /
// Notes-Python paths no longer triggers a cold 10 MB download — it's
// already in IDB by the time they click.
//
// Uses `requestIdleCallback` (with a setTimeout fallback) so we don't
// fight the initial paint. Each pre-warm is wrapped in its own try
// block — a missing optional dep should never crash the rest.

import { useEffect } from 'react';

interface IdleWindow {
  requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
  cancelIdleCallback?: (id: number) => void;
}

const onIdle = (cb: () => void, timeout = 4000): number => {
  if (typeof window === 'undefined') return 0;
  const w = window as unknown as IdleWindow;
  if (w.requestIdleCallback) return w.requestIdleCallback(cb, { timeout });
  return window.setTimeout(cb, timeout) as unknown as number;
};

const cancelIdle = (id: number): void => {
  if (typeof window === 'undefined') return;
  const w = window as unknown as IdleWindow;
  if (w.cancelIdleCallback) w.cancelIdleCallback(id);
  else window.clearTimeout(id);
};

export function usePrewarm() {
  useEffect(() => {
    const ids: number[] = [];

    // 1. JSXGraph — small but the first plot blocks for ~150 ms
    //    without this nudge.
    ids.push(onIdle(() => {
      void import('jsxgraph').catch(() => {});
    }, 2500));

    // 2. Three.js — the Graph 3D panel benefits when the first surface
    //    plot shouldn't stutter.
    ids.push(onIdle(() => {
      void import('three').catch(() => {});
      void import('@react-three/fiber').catch(() => {});
    }, 4500));

    // 3. TFJS — heavyweight but worth warming for the ML lab. Promote
    //    only after JSXGraph + Three are already on the wire.
    ids.push(onIdle(() => {
      void import('@tensorflow/tfjs').catch(() => {});
    }, 6500));

    // 4. Pyodide — ~10 MB. Toasted on first explicit use, but if the
    //    user appears idle we get a head-start.
    ids.push(onIdle(() => {
      void import('../solvers/pyodide/loader').then(({ ensurePyodide }) => {
        // ensurePyodide() itself toasts; we don't await — it's fire-and-
        // forget. Wrap in try in case anything fails (e.g. blocked
        // network).
        try { void ensurePyodide(); } catch {}
      }).catch(() => {});
    }, 12_000));

    return () => { for (const id of ids) cancelIdle(id); };
  }, []);
}
