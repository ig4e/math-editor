// Grapher registry. Backends register via side-effect imports rooted in
// `src/graphers/all.ts`. Same one-file-per-backend pattern as solvers/.
//
// Each backend exposes:
//   id              — stable identifier (e.g. 'jsxgraph2d', 'three3d')
//   dimensions      — '2d' | '3d'
//   supports        — which PlotSpec kinds it can render
//   loaderHint      — KB the lazy chunk costs (informational)
//
// Boards are NOT rendered by the registry itself — the grapher returns
// a React node that the consuming panel embeds. This keeps each grapher's
// DOM lifecycle isolated.

import type { ReactNode } from 'react';
import type { PlotSpec } from './spec';

export type GrapherDimension = '2d' | '3d';

export interface GrapherInstance {
  /** React element to mount in the panel. */
  element: ReactNode;
  /** Snapshot the current board as a PNG data URL (for Pin-to-canvas). */
  snapshotToDataURL(): Promise<{ dataURL: string; width: number; height: number } | null>;
  /** Frees board resources. */
  dispose(): void;
}

export interface GrapherInput {
  specs: readonly PlotSpec[];
  /** Numeric substitutions from the Variables panel. */
  variables?: Record<string, number>;
  /** Initial bounds; the grapher should self-fit if absent. */
  bounds?: { xMin: number; xMax: number; yMin: number; yMax: number };
  /** Render with a 1-unit grid. */
  grid?: boolean;
  /** Lock axes to equal scale. */
  equalScale?: boolean;
}

export interface Grapher {
  id: string;
  dimensions: GrapherDimension;
  supports: readonly PlotSpec['kind'][];
  /** Loads the heavy lib and returns the React-embeddable instance. */
  create(container: HTMLElement, input: GrapherInput): Promise<GrapherInstance>;
}

const registry = new Map<string, Grapher>();

export function registerGrapher(g: Grapher): void {
  registry.set(g.id, g);
}

export function getGrapher(id: string): Grapher | undefined {
  return registry.get(id);
}

export function getGraphersFor(d: GrapherDimension): readonly Grapher[] {
  return [...registry.values()].filter((g) => g.dimensions === d);
}

export type { PlotSpec } from './spec';
export { PLOT_COLORS } from './spec';
