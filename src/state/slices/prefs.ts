// Prefs slice — user-tunable everything: appearance, curriculum, defaults.
// Mirrors a small set of fields the legacy `uiSlice` also stores (theme,
// showSteps). Both stay live during P1 so the old App.tsx still boots;
// Phase 2 deletes the legacy duplicates.

import type { AppSlice } from '../store';
import type { Curriculum, Theme } from '../types';

export interface PrefsState {
  theme: Theme;
  /** Auto-follow system theme (overrides `theme`). */
  themeAuto: boolean;

  /** Multiplier on the base 14 px size. 1.0 = default. */
  fontScale: number;

  curriculum: Curriculum;
  /** Free-form name when curriculum === 'custom'. */
  curriculumCustom: string;

  /** Show step-by-step rewrites by default. */
  showSteps: boolean;

  /** Default AI provider + model picked in Settings. */
  defaultProvider: string | null;
  defaultModel: string | null;

  /** "Don't show install banner again". */
  installBannerDismissed: boolean;

  /** "Don't show first-run onboarding again". */
  onboardingDismissed: boolean;

  /** Bigger tap targets for stylus / touch input. Defaults true on
   *  pointer-coarse devices. The user can override either way. */
  tabletMode: boolean;

  /** Route AI chat through /api/ai-proxy instead of calling the
   *  provider directly from the browser. The proxy holds server keys
   *  and is the only path for providers that don't support browser
   *  CORS (Mistral). Off by default; turning it on means the user's
   *  local provider key isn't used. */
  useAIProxy: boolean;
}

export interface PrefsActions {
  setTheme(t: Theme): void;
  setThemeAuto(v: boolean): void;
  setFontScale(n: number): void;
  setCurriculum(c: Curriculum, custom?: string): void;
  setShowSteps(v: boolean): void;
  setDefaultProvider(provider: string | null, model: string | null): void;
  dismissInstallBanner(): void;
  dismissOnboarding(): void;
  setTabletMode(v: boolean): void;
  setUseAIProxy(v: boolean): void;
}

export type PrefsSlice = PrefsState & PrefsActions;

export const createPrefsSlice: AppSlice<PrefsSlice> = (set) => ({
  theme: 'light',
  themeAuto: true,
  fontScale: 1,
  curriculum: 'none',
  curriculumCustom: '',
  showSteps: true,
  defaultProvider: null,
  defaultModel: null,
  installBannerDismissed: false,
  onboardingDismissed: false,
  tabletMode: typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  useAIProxy: false,

  setTheme: (t) =>
    set((s) => {
      s.theme = t;
      s.themeAuto = false;
    }),

  setThemeAuto: (v) =>
    set((s) => {
      s.themeAuto = v;
    }),

  setFontScale: (n) =>
    set((s) => {
      s.fontScale = Math.max(0.75, Math.min(1.5, n));
    }),

  setCurriculum: (c, custom = '') =>
    set((s) => {
      s.curriculum = c;
      if (c === 'custom') s.curriculumCustom = custom;
    }),

  setShowSteps: (v) =>
    set((s) => {
      s.showSteps = v;
    }),

  setDefaultProvider: (provider, model) =>
    set((s) => {
      s.defaultProvider = provider;
      s.defaultModel = model;
    }),

  dismissInstallBanner: () =>
    set((s) => {
      s.installBannerDismissed = true;
    }),

  dismissOnboarding: () =>
    set((s) => {
      s.onboardingDismissed = true;
    }),

  setTabletMode: (v) =>
    set((s) => {
      s.tabletMode = v;
    }),

  setUseAIProxy: (v) =>
    set((s) => {
      s.useAIProxy = v;
    }),
});
