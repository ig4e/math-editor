// UI preferences slice — tool, color, theme.

import type { AppSlice } from '../store';
import type { ColorName, Theme, Tool } from '../types';

export interface UiSlice {
  tool: Tool;
  colorName: ColorName;
  theme: Theme;

  setTool: (t: Tool) => void;
  setColorName: (c: ColorName) => void;
  setTheme: (t: Theme) => void;
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

  setTool:      (t) => set((s) => { s.tool = t; }),
  setColorName: (c) => set((s) => { s.colorName = c; }),
  // Theme → <html data-theme> is handled by useThemeSync, so the slice
  // just stores the value. Keeps this slice pure.
  setTheme:     (t) => set((s) => { s.theme = t; }),
});
