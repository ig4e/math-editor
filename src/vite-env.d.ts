/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// tinykeys 3.0.0's `exports` map lacks a `types` field, so tsc can't pick
// up dist/tinykeys.d.ts via the bare specifier. Re-export the types via
// the deep path until upstream fixes the packaging.
declare module 'tinykeys' {
  export type KeyBindingPress = [string[], string];
  export type KeyBindingMap = Record<string, (event: KeyboardEvent) => void>;
  export interface KeyBindingOptions {
    timeout?: number;
    event?: 'keydown' | 'keyup';
    capture?: boolean;
  }
  export function tinykeys(
    target: Window | HTMLElement,
    keyBindingMap: KeyBindingMap,
    options?: KeyBindingOptions,
  ): () => void;
}
