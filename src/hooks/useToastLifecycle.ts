// Auto-dismiss timers for toasts. Mounted once at App root.
// Keeping setTimeout out of the toast slice keeps the immer producer pure.

import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import type { ToastKind } from '../state/types';

const DURATIONS: Record<ToastKind, number> = {
  info: 2800,
  success: 2800,
  warn: 4000,
  error: 5000,
};

export function useToastLifecycle() {
  const toasts  = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  const timers  = useRef(new Map<string, number>());

  useEffect(() => {
    const seen = new Set(toasts.map((t) => t.id));

    // Schedule dismissal for new toasts
    for (const t of toasts) {
      if (!timers.current.has(t.id)) {
        timers.current.set(
          t.id,
          window.setTimeout(() => dismiss(t.id), DURATIONS[t.kind]),
        );
      }
    }
    // Clear timers for toasts dismissed externally (e.g. close button)
    for (const [id, handle] of timers.current) {
      if (!seen.has(id)) {
        clearTimeout(handle);
        timers.current.delete(id);
      }
    }
  }, [toasts, dismiss]);

  // Unmount cleanup — clear all pending timers
  useEffect(() => () => {
    for (const handle of timers.current.values()) clearTimeout(handle);
    timers.current.clear();
  }, []);
}
