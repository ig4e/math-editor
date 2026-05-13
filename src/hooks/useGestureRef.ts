// Tiny helper for pointer-gesture state that survives across pointermove
// events without triggering React re-renders. Pattern: each gesture stores
// its in-flight data in a ref keyed by pointer id.

import { useRef, useCallback } from 'react';

export interface GestureRef<T> {
  /** Begin a gesture; subsequent moves/up events with the same pointerId match. */
  start: (pointerId: number, data: T) => void;
  /** End the gesture if pointerId matches. */
  end: (pointerId: number) => void;
  /** True if this pointer is the one currently held. */
  matches: (pointerId: number) => boolean;
  /** Read the current data (or null when idle). */
  read: () => (T & { pointerId: number }) | null;
}

export function useGestureRef<T>(): GestureRef<T> {
  const ref = useRef<(T & { pointerId: number }) | null>(null);

  const start = useCallback((pointerId: number, data: T) => {
    ref.current = { ...data, pointerId };
  }, []);
  const end = useCallback((pointerId: number) => {
    if (ref.current?.pointerId === pointerId) ref.current = null;
  }, []);
  const matches = useCallback(
    (pointerId: number) => ref.current?.pointerId === pointerId,
    [],
  );
  const read = useCallback(() => ref.current, []);

  return { start, end, matches, read };
}
