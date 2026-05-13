// Zustand root store. Slice composition + IDB persist + zundo undo.
//
// Greenfield project — no migrations from prior versions. Persist key:
// `math-notebook:v1`. Anything in old localStorage entries is ignored.
//
// Storage is IndexedDB (via idb-keyval) so sheets + scenes can scale past
// localStorage's 5 MB cap. Excalidraw scenes get large quickly.

import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';

import { createSheetsSlice,    type SheetsSlice    } from './slices/sheets';
import { createBlocksSlice,    type BlocksSlice    } from './slices/blocks';
import { createSelectionSlice, type SelectionSlice } from './slices/selection';
import { createToastSlice,     type ToastSlice     } from './slices/toasts';
import { createWorkspaceSlice, type WorkspaceSlice } from './slices/workspace';
import { createPrefsSlice,     type PrefsSlice     } from './slices/prefs';
import { createKeysSlice,      type KeysSlice      } from './slices/keys';

import { idbStorage } from './idb-storage';

export type Store =
  & SheetsSlice
  & BlocksSlice
  & SelectionSlice
  & ToastSlice
  & WorkspaceSlice
  & PrefsSlice
  & KeysSlice;

export type AppSlice<T> = StateCreator<
  Store,
  [['zustand/immer', never]],
  [],
  T
>;

const PERSIST_KEY = 'math-notebook:v1';
const PERSIST_VERSION = 1;
/** Cap undo history so deep edit sessions don't grow unbounded. */
const UNDO_LIMIT = 100;

export const useStore = create<Store>()(
  persist(
    temporal(
      immer((set, get, api) => ({
        ...createSheetsSlice(set, get, api),
        ...createBlocksSlice(set, get, api),
        ...createSelectionSlice(set, get, api),
        ...createToastSlice(set, get, api),
        ...createWorkspaceSlice(set, get, api),
        ...createPrefsSlice(set, get, api),
        ...createKeysSlice(set, get, api),
      })),
      {
        limit: UNDO_LIMIT,
        // Only snapshot user-data — never theme / selection / toasts.
        partialize: (s) => ({
          sheets: s.sheets,
          sheetOrder: s.sheetOrder,
        }),
        equality: (a, b) =>
          a.sheets === b.sheets && a.sheetOrder === b.sheetOrder,
      },
    ),
    {
      name: PERSIST_KEY,
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({
        // sheets
        sheets: s.sheets,
        sheetOrder: s.sheetOrder,
        activeSheetId: s.activeSheetId,
        // workspace (v3: just remembers the last-active sidebar tab)
        activeSidebarTab: s.activeSidebarTab,
        // prefs
        theme: s.theme,
        themeAuto: s.themeAuto,
        fontScale: s.fontScale,
        curriculum: s.curriculum,
        curriculumCustom: s.curriculumCustom,
        showSteps: s.showSteps,
        defaultProvider: s.defaultProvider,
        defaultModel: s.defaultModel,
        installBannerDismissed: s.installBannerDismissed,
        onboardingDismissed: s.onboardingDismissed,
        // keys
        salt: s.salt,
        providers: s.providers,
        keybindOverrides: s.keybindOverrides,
      }),
    },
  ),
);
