// Imperative workspace actions surfaced as a React hook. Used by the
// command registry's CommandContext, by panels that want to spawn other
// panels (e.g. AI's "Open Graph" tool-call), and by direct UI handlers.
//
// The hook is a thin convenience layer over the workspaceSlice — it
// resolves a panel ID to a registered Panel, mutates the persisted
// layout JSON via flexlayout's `Actions` API, and falls back to a fresh
// layout if the persisted JSON drifts out of schema.

import { useCallback } from 'react';
import { Actions, DockLocation, type Model } from 'flexlayout-react';
import { useStore } from '../state/store';
import { getPanel } from './PanelRegistry';

export interface WorkspaceController {
  openPanel(id: string): void;
  closePanel(id: string): void;
  focusPanel(id: string): void;
  resetLayout(): void;
}

/**
 * Builds a controller given the live flexlayout Model. The Workspace
 * component owns the Model and passes it in; the rest of the app calls
 * controller actions through CommandContext or through useWorkspace().
 */
export function buildController(model: Model | null): WorkspaceController {
  return {
    openPanel(id) {
      if (!getPanel(id)) {
        console.warn(`[workspace] no panel registered for "${id}"`);
        return;
      }
      useStore.getState().openPanel(id);

      if (!model) return;
      // Already in layout? just focus it.
      const existing = model.getNodeById(id);
      if (existing) {
        model.doAction(Actions.selectTab(id));
        return;
      }
      // Insert as a new tab. Prefer the panel's defaultLocation; default
      // is the right column.
      const panel = getPanel(id);
      const location = panel?.defaultLocation ?? 'right';
      const targetTabset = pickTabset(model, location);
      if (!targetTabset) return;
      model.doAction(
        Actions.addNode(
          { type: 'tab', id, name: panel?.title ?? id, component: id },
          targetTabset,
          DockLocation.CENTER,
          -1,
        ),
      );
    },
    closePanel(id) {
      useStore.getState().closePanel(id);
      if (!model) return;
      const node = model.getNodeById(id);
      if (node) model.doAction(Actions.deleteTab(id));
    },
    focusPanel(id) {
      useStore.getState().focusPanel(id);
      if (!model) return;
      const node = model.getNodeById(id);
      if (node) model.doAction(Actions.selectTab(id));
    },
    resetLayout() {
      useStore.getState().resetLayout();
      // Workspace component listens to layout=null and re-mounts with defaults.
    },
  };
}

/** React hook variant — for callers without direct Model access. */
export function useWorkspace(): WorkspaceController {
  const openPanel  = useStore((s) => s.openPanel);
  const closePanel = useStore((s) => s.closePanel);
  const focusPanel = useStore((s) => s.focusPanel);
  const resetLayout = useStore((s) => s.resetLayout);

  return {
    openPanel: useCallback((id: string) => openPanel(id), [openPanel]),
    closePanel: useCallback((id: string) => closePanel(id), [closePanel]),
    focusPanel: useCallback((id: string) => focusPanel(id), [focusPanel]),
    resetLayout: useCallback(() => resetLayout(), [resetLayout]),
  };
}

// ----- internals -------------------------------------------------------

function pickTabset(model: Model, location: 'left' | 'right' | 'bottom' | 'center') {
  // Walk the layout tree for a tabset matching the requested location.
  // Heuristic: 'left' = first tabset, 'right' = last tabset, 'center' =
  // largest tabset, 'bottom' = last tabset (placeholder until we surface
  // a real bottom border).
  const tabsets: string[] = [];
  model.visitNodes((node) => {
    if (node.getType() === 'tabset') tabsets.push(node.getId());
  });
  if (tabsets.length === 0) return undefined;
  switch (location) {
    case 'left':   return tabsets[0];
    case 'right':  return tabsets[tabsets.length - 1];
    case 'bottom': return tabsets[tabsets.length - 1];
    case 'center': return tabsets[Math.floor(tabsets.length / 2)];
  }
}
