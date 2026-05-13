// inject.ts — programmatic API for other panels to push elements onto
// the Excalidraw canvas. Wraps `convertToExcalidrawElements` so each
// call is one undo step (Excalidraw's Ctrl+Z reverts our injections).
//
// Phase 2 ships the skeleton with the most-used calls. Later phases
// (P3 Solver arrows, P4/5 Graph pin-to-canvas, P15 ML descent paths)
// add specialised helpers built on these primitives.

import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

let apiRef: ExcalidrawImperativeAPI | null = null;

/** Called once by CanvasPanel after `excalidrawAPI` resolves. */
export function setExcalidrawAPI(api: ExcalidrawImperativeAPI | null): void {
  apiRef = api;
}

export function getExcalidrawAPI(): ExcalidrawImperativeAPI | null {
  return apiRef;
}

interface InjectArrowOpts {
  from: { x: number; y: number } | string; // string = anchor blockId
  to:   { x: number; y: number } | string;
  label?: string;
  color?: string;
  dashed?: boolean;
}

export function injectArrow(_opts: InjectArrowOpts): void {
  // Phase 3 builds out the bound-arrow flow; for now this just lays
  // down a free arrow if both ends are coordinates.
  const api = apiRef;
  if (!api) return;
  // Free-positioned arrow only (anchor binding lands in P3 with full
  // anchor → boundElement wiring). String IDs are no-oped here.
  if (typeof _opts.from === 'string' || typeof _opts.to === 'string') return;

  const skeleton = convertToExcalidrawElements([
    {
      type: 'arrow',
      x: _opts.from.x,
      y: _opts.from.y,
      width: _opts.to.x - _opts.from.x,
      height: _opts.to.y - _opts.from.y,
      strokeColor: _opts.color ?? '#6366f1',
      strokeStyle: _opts.dashed ? 'dashed' : 'solid',
    },
  ]);
  pushElements(skeleton);
}

interface InjectTextOpts {
  at: { x: number; y: number };
  text: string;
  fontSize?: number;
  color?: string;
}

export function injectText(opts: InjectTextOpts): void {
  if (!apiRef) return;
  const skeleton = convertToExcalidrawElements([
    {
      type: 'text',
      x: opts.at.x,
      y: opts.at.y,
      text: opts.text,
      fontSize: opts.fontSize ?? 20,
      strokeColor: opts.color ?? '#111111',
    },
  ]);
  pushElements(skeleton);
}

interface InjectImageOpts {
  at: { x: number; y: number };
  dataURL: string;
  width: number;
  height: number;
}

export function injectImage(_opts: InjectImageOpts): void {
  // Image injection requires registering a file blob first via
  // `addFiles` and then creating an image element referencing it.
  // Phase 4 (Graph 2D pin-to-canvas) implements the full flow.
  if (!apiRef) return;
  // TODO(P4): implement via api.addFiles + image element skeleton.
}

/** Raw escape hatch — push pre-built Excalidraw elements onto the scene. */
export function injectShapes(elements: ExcalidrawElement[]): void {
  pushElements(elements);
}

// ----- internals -------------------------------------------------------

function pushElements(elements: ExcalidrawElement[]): void {
  const api = apiRef;
  if (!api) return;
  const existing = api.getSceneElements();
  api.updateScene({
    elements: [...existing, ...elements],
    captureUpdate: 'capture' as unknown as never,
  });
}
