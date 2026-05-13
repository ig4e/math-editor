// Single chokepoint for lazy-loading. Every heavy import in the app
// (Excalidraw, JSXGraph, mathsteps, Three.js, Pyodide, vision models)
// flows through here so:
//
//   - the loading state is consistent (one Skeleton)
//   - bundle-name comments are stable for tooling
//   - swapping React.lazy for an alt impl is a one-file change

import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';

interface LazyOptions {
  /** Bundle-name hint for tooling (and for humans reading the network tab). */
  chunkName?: string;
}

/**
 * Wraps `React.lazy` and pairs it with a `<Suspense>` fallback at usage
 * time. Returns the bare `LazyExoticComponent`; the caller (or the panel
 * registry) decides what fallback to show.
 */
export function lazyPanel<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _opts: LazyOptions = {},
): LazyExoticComponent<T> {
  return lazy(loader);
}

/**
 * Convenience wrapper for panels rendered inside flexlayout — wraps the
 * lazy element in a Suspense boundary with our standard skeleton.
 */
export function WithSuspense({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
