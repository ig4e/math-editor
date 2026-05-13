// Imperative workspace actions surfaced as a React hook. Used by the
// command registry's CommandContext, by panels that want to spawn other
// panels (e.g. AI's "Open Graph" tool-call), and by direct UI handlers.
//
// With v3's FlexLayout-free design every panel lives as a tab inside
// Excalidraw's native <Sidebar>. "Opening a panel" = toggling the
// sidebar to that tab via the API seam in panels/canvas/inject.ts.

import { useCallback } from 'react';
import { useStore } from '../state/store';
import { openPanelTab } from '../panels/canvas/inject';

export interface WorkspaceController {
  openPanel(id: string): void;
  closePanel(id: string): void;
  focusPanel(id: string): void;
  resetLayout(): void;
}

/** React hook variant. */
export function useWorkspace(): WorkspaceController {
  const setActive = useStore((s) => s.setActiveSidebarTab);
  const reset = useStore((s) => s.resetLayout);
  return {
    openPanel: useCallback((id: string) => {
      setActive(id);
      openPanelTab(id);
    }, [setActive]),
    closePanel: useCallback((id: string) => {
      const cur = useStore.getState().activeSidebarTab;
      if (cur === id) {
        setActive(null);
        openPanelTab(id);
      }
    }, [setActive]),
    focusPanel: useCallback((id: string) => {
      setActive(id);
      openPanelTab(id);
    }, [setActive]),
    resetLayout: useCallback(() => {
      reset();
    }, [reset]),
  };
}

/** Non-hook entry — same semantics, callable from commands. */
export const workspaceController: WorkspaceController = {
  openPanel(id) {
    useStore.getState().setActiveSidebarTab(id);
    openPanelTab(id);
  },
  closePanel(id) {
    const s = useStore.getState();
    if (s.activeSidebarTab === id) {
      s.setActiveSidebarTab(null);
      openPanelTab(id);
    }
  },
  focusPanel(id) {
    useStore.getState().setActiveSidebarTab(id);
    openPanelTab(id);
  },
  resetLayout() {
    useStore.getState().resetLayout();
  },
};
