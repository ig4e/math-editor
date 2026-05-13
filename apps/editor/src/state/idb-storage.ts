// IndexedDB-backed storage adapter for Zustand's `persist` middleware.
//
// Why not localStorage: sheets + Excalidraw scenes routinely run into MBs;
// localStorage caps at ~5 MB and is sync, which jank-stalls writes on big
// scenes. IDB is async and ~unlimited.
//
// Usage:
//   persist(
//     temporal(immer(...)),
//     { name: 'math-notebook:v1', storage: createJSONStorage(() => idbStorage) },
//   )

import { get, set, del } from 'idb-keyval';
import type { PersistStorage } from 'zustand/middleware';

/** Storage shape Zustand's createJSONStorage wraps with a JSON layer. */
export const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get<string | undefined>(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

// ----- pre-typed helper for slices that want the *unwrapped* IDB API ---
// Used by the keys slice (encrypted blob) and the canvas scene cache —
// places where JSON-wrapping the value would waste bytes / hurt perf.
export async function idbGet<T>(key: string): Promise<T | undefined> {
  return get<T>(key);
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  await set(key, value);
}

export async function idbDel(key: string): Promise<void> {
  await del(key);
}

// ----- typed PersistStorage variant ------------------------------------
// Zustand's createJSONStorage type-narrows enough that most callers don't
// need this, but expose it for completeness.
export function typedIdbStorage<S>(): PersistStorage<S> {
  return {
    getItem: async (name) => {
      const raw = await get<string | undefined>(name);
      if (!raw) return null;
      return JSON.parse(raw) as { state: S; version: number };
    },
    setItem: async (name, value) => {
      await set(name, JSON.stringify(value));
    },
    removeItem: async (name) => {
      await del(name);
    },
  };
}
