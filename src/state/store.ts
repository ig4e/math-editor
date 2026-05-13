// Zustand root store. Slice composition + IDB persist + zundo undo.
//
// Greenfield project — no migrations from prior versions. We bumped the
// persist key from `math-sheet:v2` to `math-notebook:v1`; anything in the
// old localStorage entry is dead and ignored on first run.
//
// Storage moves from localStorage to IndexedDB so sheets + scenes can
// scale past 5 MB (Excalidraw scenes get large quickly).

import { create, type StateCreator } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';

import { createSheetsSlice,    type SheetsSlice    } from './slices/sheets';
import { createBlocksSlice,    type BlocksSlice    } from './slices/blocks';
import { createStrokesSlice,   type StrokesSlice   } from './slices/strokes';
import { createShapesSlice,    type ShapesSlice    } from './slices/shapes';
import { createLinksSlice,     type LinksSlice     } from './slices/links';
import { createSelectionSlice, type SelectionSlice } from './slices/selection';
import { createUiSlice,        type UiSlice        } from './slices/ui';
import { createToastSlice,     type ToastSlice     } from './slices/toasts';
import { createWorkspaceSlice, type WorkspaceSlice } from './slices/workspace';
import { createPrefsSlice,     type PrefsSlice     } from './slices/prefs';
import { createKeysSlice,      type KeysSlice      } from './slices/keys';

import { idbStorage } from './idb-storage';

export type Store =
  & SheetsSlice
  & BlocksSlice
  & StrokesSlice
  & ShapesSlice
  & LinksSlice
  & SelectionSlice
  & UiSlice
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
        ...createStrokesSlice(set, get, api),
        ...createShapesSlice(set, get, api),
        ...createLinksSlice(set, get, api),
        ...createSelectionSlice(set, get, api),
        ...createUiSlice(set, get, api),
        ...createToastSlice(set, get, api),
        ...createWorkspaceSlice(set, get, api),
        ...createPrefsSlice(set, get, api),
        ...createKeysSlice(set, get, api),
      })),
      {
        limit: UNDO_LIMIT,
        // Only snapshot user-data — never tool / theme / selection / toasts.
        // This is what makes Ctrl+Z feel right: it doesn't accidentally
        // revert a theme toggle or undo a selection click.
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
      // IndexedDB via idb-keyval so sheets/scenes aren't capped at 5 MB.
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({
        // sheets
        sheets: s.sheets,
        sheetOrder: s.sheetOrder,
        activeSheetId: s.activeSheetId,
        // legacy ui (kept until Phase 2 deletes ui slice)
        theme: s.theme,
        autoShape: s.autoShape,
        showSteps: s.showSteps,
        // workspace
        layout: s.layout,
        layoutVersion: s.layoutVersion,
        openPanels: s.openPanels,
        activePanelId: s.activePanelId,
        presets: s.presets,
        activePresetId: s.activePresetId,
        // prefs
        themeAuto: s.themeAuto,
        fontScale: s.fontScale,
        curriculum: s.curriculum,
        curriculumCustom: s.curriculumCustom,
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
