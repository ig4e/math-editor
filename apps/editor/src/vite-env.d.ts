/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// mathsteps 0.2 ships without TypeScript types. We declare the surface
// we use; the solvers/mathsteps adapter narrows it further.
declare module 'mathsteps' {
  interface Change {
    changeType: string;
    newNode: { toString(): string };
    oldNode?: { toString(): string };
    substeps?: Change[];
  }
  const mathsteps: {
    simplifyExpression(s: string): Change[];
    solveEquation(s: string): Change[];
    factor: (s: string) => Change[];
    ChangeTypes: Record<string, string>;
  };
  export default mathsteps;
  export const simplifyExpression: (s: string) => Change[];
  export const solveEquation: (s: string) => Change[];
}

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
