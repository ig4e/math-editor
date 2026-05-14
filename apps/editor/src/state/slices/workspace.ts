// Workspace slice — owns which sidebar tab is currently active. The
// FlexLayout JSON, layout presets, and panel-open list from the v2
// foundation are gone: panels now live as tabs inside Excalidraw's
// native <Sidebar>, so layout state is owned by Excalidraw itself
// (appState.openSidebar). We only persist the user's last-active tab
// so reload restores the same panel.

import type { AppSlice } from '../store';

export const SIDEBAR_WIDTH_DEFAULT = 460;
export const SIDEBAR_WIDTH_MIN = 320;
export const SIDEBAR_WIDTH_MAX = 900;

export interface WorkspaceState {
  /** ID of the panel currently shown in the sidebar; null = closed. */
  activeSidebarTab: string | null;
  /** Docked sidebar width in px. Persisted across reloads. */
  sidebarWidth: number;
}

export interface WorkspaceActions {
  /** Set the active sidebar tab (does NOT itself toggle the sidebar —
   *  AppShell mirrors this into Excalidraw via toggleSidebar). */
  setActiveSidebarTab(tab: string | null): void;

  /** Convenience: open the sidebar to a panel. The actual Excalidraw
   *  toggle is wired through openPanelTab() in panels/canvas/inject.ts;
   *  this just updates the persisted preference. */
  openPanel(id: string): void;
  closePanel(id: string): void;
  focusPanel(id: string): void;

  /** Resize the docked sidebar. Width is clamped to
   *  [SIDEBAR_WIDTH_MIN, SIDEBAR_WIDTH_MAX]. */
  setSidebarWidth(width: number): void;

  /** Closes the sidebar / resets the active tab to null. */
  resetLayout(): void;
}

export type WorkspaceSlice = WorkspaceState & WorkspaceActions;

export const createWorkspaceSlice: AppSlice<WorkspaceSlice> = (set) => ({
  activeSidebarTab: null,
  sidebarWidth: SIDEBAR_WIDTH_DEFAULT,

  setActiveSidebarTab: (tab) =>
    set((s) => {
      s.activeSidebarTab = tab;
    }),

  openPanel: (id) =>
    set((s) => {
      s.activeSidebarTab = id;
    }),

  closePanel: (id) =>
    set((s) => {
      if (s.activeSidebarTab === id) s.activeSidebarTab = null;
    }),

  focusPanel: (id) =>
    set((s) => {
      s.activeSidebarTab = id;
    }),

  setSidebarWidth: (width) =>
    set((s) => {
      const clamped = Math.max(
        SIDEBAR_WIDTH_MIN,
        Math.min(SIDEBAR_WIDTH_MAX, Math.round(width)),
      );
      s.sidebarWidth = clamped;
    }),

  resetLayout: () =>
    set((s) => {
      s.activeSidebarTab = null;
      s.sidebarWidth = SIDEBAR_WIDTH_DEFAULT;
    }),
});
