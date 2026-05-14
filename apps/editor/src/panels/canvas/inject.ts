// inject.ts — programmatic API for other panels to push elements onto
// the Excalidraw canvas. Wraps `convertToExcalidrawElements` so each
// call is one undo step (Excalidraw's Ctrl+Z reverts our injections).

import { convertToExcalidrawElements, isBlockElement } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

let apiRef: ExcalidrawImperativeAPI | null = null;

/** Called once by AppShell after `excalidrawAPI` resolves. */
export function setExcalidrawAPI(api: ExcalidrawImperativeAPI | null): void {
  apiRef = api;
}

export function getExcalidrawAPI(): ExcalidrawImperativeAPI | null {
  return apiRef;
}

// ----- Sidebar toggle ---------------------------------------------------
// AppShell registers a function that opens the panel sidebar to a named
// tab. Commands + AI tool-calls reach the sidebar through this seam so
// they don't need a direct ref to the Excalidraw API.

type SidebarToggler = (tab: string) => boolean;
let sidebarToggler: SidebarToggler | null = null;

export function setSidebarToggler(fn: SidebarToggler | null): void {
  sidebarToggler = fn;
}

export function openPanelTab(tab: string): boolean {
  return sidebarToggler ? sidebarToggler(tab) : false;
}

/** Find the scene element id for a block by its blockId. Returns null
 *  if no element with that blockId exists in the scene. */
export function blockElementId(blockId: string): string | null {
  if (!apiRef) return null;
  for (const el of apiRef.getSceneElements()) {
    if (
      isBlockElement(el) &&
      'blockId' in el &&
      el.blockId === blockId
    ) {
      return el.id;
    }
  }
  return null;
}

interface InjectArrowOpts {
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  color?: string;
  dashed?: boolean;
}

/** Draw a free-positioned arrow between two scene coords. */
export function injectArrow(opts: InjectArrowOpts): void {
  if (!apiRef) return;
  const elements = convertToExcalidrawElements([
    {
      type: 'arrow',
      x: opts.from.x,
      y: opts.from.y,
      width: opts.to.x - opts.from.x,
      height: opts.to.y - opts.from.y,
      strokeColor: opts.color ?? '#6366f1',
      strokeStyle: opts.dashed ? 'dashed' : 'solid',
      label: opts.label ? { text: opts.label } : undefined,
    },
  ]);
  pushElements(elements);
}

interface InjectBoundArrowOpts {
  fromAnchorId: string;     // block ID
  toAnchorId: string;       // block ID
  label?: string;
  color?: string;
  dashed?: boolean;
}

/**
 * Draw an arrow whose endpoints are bound to two block anchors. When
 * either block moves, Excalidraw repositions the arrow automatically.
 */
export function injectBoundArrow(opts: InjectBoundArrowOpts): void {
  const api = apiRef;
  if (!api) return;
  const fromId = blockElementId(opts.fromAnchorId);
  const toId = blockElementId(opts.toAnchorId);
  if (!fromId || !toId) {
    console.warn('[inject] block element not found', {
      fromBlockId: opts.fromAnchorId,
      toBlockId: opts.toAnchorId,
    });
    return;
  }
  const elements = api.getSceneElements();
  const fromEl = elements.find((el) => el.id === fromId);
  const toEl = elements.find((el) => el.id === toId);
  if (!fromEl || !toEl) {
    console.warn('[inject] block element resolved but not in scene', {
      fromId,
      toId,
    });
    return;
  }
  // Start the arrow at fromEl's center; convertToExcalidrawElements +
  // its `start`/`end` shorthand handles binding.
  const fromCx = fromEl.x + fromEl.width / 2;
  const fromCy = fromEl.y + fromEl.height / 2;
  const toCx = toEl.x + toEl.width / 2;
  const toCy = toEl.y + toEl.height / 2;

  const built = convertToExcalidrawElements([
    {
      type: 'arrow',
      x: fromCx,
      y: fromCy,
      width: toCx - fromCx,
      height: toCy - fromCy,
      strokeColor: opts.color ?? '#6366f1',
      strokeStyle: opts.dashed ? 'dashed' : 'solid',
      start: { id: fromId },
      end: { id: toId },
      label: opts.label ? { text: opts.label } : undefined,
    },
  ]);
  pushElements(built);
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

/**
 * Drop a PNG (data-URL) onto the canvas as an Excalidraw image element.
 * Registers the file blob via `addFiles` first, then injects an `image`
 * element referencing the fileId. Each call is one undo step.
 */
export function injectImage(opts: InjectImageOpts): void {
  const api = apiRef;
  if (!api) return;
  const fileId = randomFileId();
  api.addFiles([{
    id: fileId,
    dataURL: opts.dataURL as `data:${string}`,
    mimeType: 'image/png',
    created: Date.now(),
    lastRetrieved: Date.now(),
  } as Parameters<ExcalidrawImperativeAPI['addFiles']>[0][number]]);

  const built = convertToExcalidrawElements([
    {
      type: 'image',
      x: opts.at.x,
      y: opts.at.y,
      width: opts.width,
      height: opts.height,
      // Excalidraw brands FileId; the runtime value is just a string.
      fileId: fileId as unknown as `${string}` & { _brand: 'FileId' },
      status: 'saved',
      scale: [1, 1],
    },
  ]);
  pushElements(built);
}

function randomFileId(): string {
  return `f${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
}

/** Raw escape hatch — push pre-built Excalidraw elements. */
export function injectShapes(elements: ExcalidrawElement[]): void {
  pushElements(elements);
}

// ----- internals -------------------------------------------------------

function pushElements(elements: readonly ExcalidrawElement[]): void {
  const api = apiRef;
  if (!api) return;
  const existing = api.getSceneElements();
  api.updateScene({
    elements: [...existing, ...elements],
    captureUpdate: 'capture' as unknown as never,
  });
}

/** Find the rough bottom-right of the active block cluster — used to
 *  place a new block "near" the current sources. */
export function findInsertionPointBelowAnchors(blockIds: readonly string[]): { x: number; y: number } | null {
  const api = apiRef;
  if (!api) return null;
  const wanted = new Set(blockIds);
  const elements = api.getSceneElements().filter(
    (el) =>
      isBlockElement(el) && 'blockId' in el && wanted.has(el.blockId),
  );
  if (elements.length === 0) return null;
  let minX = Infinity;
  let maxY = -Infinity;
  for (const el of elements) {
    if (el.x < minX) minX = el.x;
    if (el.y + el.height > maxY) maxY = el.y + el.height;
  }
  return { x: minX, y: maxY + 80 };
}
