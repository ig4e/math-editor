// UI preferences slice.
//   tool       — which whiteboard tool is active
//   colorName  — selected palette color (applies to pen AND \textcolor)
//   theme      — light/dark
//   autoShape  — when on, pen strokes that look like shapes get corrected
//   showSteps  — when on, solve emits a multi-step derivation

import type { AppSlice } from '../store';
import type { ColorName, Theme, Tool } from '../types';

export interface UiSlice {
  tool: Tool;
  colorName: ColorName;
  theme: Theme;
  autoShape: boolean;
  showSteps: boolean;

  setTool: (t: Tool) => void;
  setColorName: (c: ColorName) => void;
  setTheme: (t: Theme) => void;
  setAutoShape: (v: boolean) => void;
  setShowSteps: (v: boolean) => void;
}

const initialTheme: Theme =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export const createUiSlice: AppSlice<UiSlice> = (set) => ({
  tool: 'move',
  colorName: 'black',
  theme: initialTheme,
  autoShape: false,
  showSteps: true,

  setTool:      (t) => set((s) => { s.tool = t; }),
  setColorName: (c) => set((s) => { s.colorName = c; }),
  setTheme:     (t) => set((s) => { s.theme = t; }),
  setAutoShape: (v) => set((s) => { s.autoShape = v; }),
  setShowSteps: (v) => set((s) => { s.showSteps = v; }),
});
