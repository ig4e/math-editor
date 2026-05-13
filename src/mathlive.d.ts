/// <reference types="vite/client" />

// JSX type augmentation for the <math-field> custom element shipped by MathLive.
// React 19 prefers types under `React.JSX`, but the global namespace
// augmentation is still honored when @types/react aliases it.

import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { MathfieldElement } from 'mathlive';

type MathFieldAttrs = DetailedHTMLProps<
  HTMLAttributes<MathfieldElement> & {
    'virtual-keyboard-policy'?: 'manual' | 'auto' | 'sandboxed';
    'read-only'?: boolean | '';
    'default-mode'?: 'inline-math' | 'math' | 'text';
  },
  MathfieldElement
>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': MathFieldAttrs;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': MathFieldAttrs;
    }
  }
}

export {};
