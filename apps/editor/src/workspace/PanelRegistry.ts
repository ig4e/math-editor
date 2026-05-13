// Panel registry — every dockable surface in the workspace registers here.
//
// Contract is documented in /docs/adding-a-panel.md. The registry is a
// flat Map keyed by Panel.id; flexlayout's factory looks up records by
// that ID when instantiating a tab.
//
// Panels register themselves via side-effect imports rooted in
// `src/panels/index.ts` — adding a new panel never touches the workspace
// shell, only its own folder + that one-line import.

import type { ComponentType, LazyExoticComponent, ReactNode } from 'react';
import type { IconName } from '../components/Icons';

export type PanelLocation = 'left' | 'right' | 'bottom' | 'center';

export interface Panel {
  /** Stable ID — referenced from layout JSON, command IDs, deep links. */
  id: string;

  /** Shown in the flexlayout tab strip. */
  title: string;

  /** From the shared icon set in `Icons.tsx`. */
  icon: IconName;

  /** Lazy-loaded; pass `lazyPanel(() => import('./MyPanel'))`. */
  component: LazyExoticComponent<ComponentType<unknown>>;

  /** Where to dock when first opened. */
  defaultLocation?: PanelLocation;

  /** Open weight (used by flexlayout when adding the tab). */
  defaultWeight?: number;

  /** Optional right-slot buttons in PanelHeader. */
  headerActions?: () => ReactNode;

  /** Short summary surfaced in the command palette + empty states. */
  description?: string;

  /** Render an EmptyState placeholder when registered-but-unmounted —
   *  Phase 1 ships everything as stubs; later phases replace with real
   *  components. The stub gets used by the welcome screen + "Open …"
   *  flows before the real component code has shipped. */
  stub?: boolean;
}

const registry = new Map<string, Panel>();
const listeners = new Set<() => void>();

/** Register a panel. Idempotent — re-registration overwrites, useful for HMR. */
export function registerPanel(panel: Panel): void {
  registry.set(panel.id, panel);
  for (const l of listeners) l();
}

export function getPanel(id: string): Panel | undefined {
  return registry.get(id);
}

export function getAllPanels(): readonly Panel[] {
  return [...registry.values()];
}

/** Subscribe to registry changes — used by tests + dev-time HMR. */
export function subscribePanels(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Reset between tests. */
export function __resetPanelRegistry(): void {
  registry.clear();
  for (const l of listeners) l();
}
