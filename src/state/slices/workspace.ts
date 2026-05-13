// Workspace slice — owns the flexlayout JSON, the set of mounted panels,
// and the currently focused one. Panels register themselves elsewhere
// (workspace/PanelRegistry.ts); this slice just tracks which of those
// registrations are actually live on screen.
//
// The layout JSON is treated as opaque (`LayoutJSON = unknown`) — flexlayout
// owns its schema, we just shuttle it through persist. A schema-bump in
// flexlayout would land us a JSON we can't render, so we version-tag our
// own wrapper and reset on mismatch.

import type { AppSlice } from '../store';
import type { LayoutJSON } from '../types';

/** Bump when we knowingly change layout shape (preset, default panels). */
export const WORKSPACE_LAYOUT_VERSION = 1;

export interface WorkspaceState {
  /** Persisted flexlayout model JSON; null until first render writes one. */
  layout: LayoutJSON | null;

  /** Version we wrote `layout` against; reset on mismatch. */
  layoutVersion: number;

  /** Panel IDs currently mounted in the layout. */
  openPanels: string[];

  /** Currently focused panel ID. */
  activePanelId: string | null;

  /** User-saved presets — name → layout JSON. Phase 1 ships just "Default". */
  presets: Record<string, LayoutJSON>;

  /** Active preset name; null = unsaved / custom. */
  activePresetId: string | null;
}

export interface WorkspaceActions {
  setLayout(layout: LayoutJSON, openPanels: string[]): void;
  openPanel(id: string): void;
  closePanel(id: string): void;
  focusPanel(id: string | null): void;
  resetLayout(): void;
  savePreset(name: string): void;
  applyPreset(name: string): void;
  deletePreset(name: string): void;
}

export type WorkspaceSlice = WorkspaceState & WorkspaceActions;

export const createWorkspaceSlice: AppSlice<WorkspaceSlice> = (set) => ({
  layout: null,
  layoutVersion: WORKSPACE_LAYOUT_VERSION,
  openPanels: ['canvas'],     // foundation default
  activePanelId: 'canvas',
  presets: {},
  activePresetId: null,

  setLayout: (layout, openPanels) =>
    set((s) => {
      s.layout = layout;
      s.layoutVersion = WORKSPACE_LAYOUT_VERSION;
      s.openPanels = openPanels;
    }),

  openPanel: (id) =>
    set((s) => {
      if (!s.openPanels.includes(id)) s.openPanels.push(id);
      s.activePanelId = id;
    }),

  closePanel: (id) =>
    set((s) => {
      s.openPanels = s.openPanels.filter((p) => p !== id);
      if (s.activePanelId === id) s.activePanelId = s.openPanels[0] ?? null;
    }),

  focusPanel: (id) =>
    set((s) => {
      s.activePanelId = id;
    }),

  resetLayout: () =>
    set((s) => {
      s.layout = null;
      s.openPanels = ['canvas'];
      s.activePanelId = 'canvas';
      s.activePresetId = null;
    }),

  savePreset: (name) =>
    set((s) => {
      if (s.layout) s.presets[name] = s.layout;
      s.activePresetId = name;
    }),

  applyPreset: (name) =>
    set((s) => {
      const preset = s.presets[name];
      if (preset != null) {
        s.layout = preset;
        s.activePresetId = name;
      }
    }),

  deletePreset: (name) =>
    set((s) => {
      delete s.presets[name];
      if (s.activePresetId === name) s.activePresetId = null;
    }),
});
