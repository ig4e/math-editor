// Block-as-embeddable sync. Each math/text block in our store maps to a
// real Excalidraw `embeddable` element on the scene. The embeddable's
// `link` field carries `mathblock://<id>` or `textblock://<id>` so the
// canvas's `renderEmbeddable` callback can dispatch to the right React
// subtree.
//
// Because the block IS now a real scene element:
//   - drag / move / zoom / pan / scroll-out-of-viewport all work natively
//   - delete / copy-paste / group / arrow-bind all work natively
//   - undo / redo include block creates and moves
//
// Two-way sync:
//   1) block.x/y/w/h in state  →  element.x/y/width/height
//   2) element.x/y (Excalidraw drag) →  block.x/y
//
// Size only flows store → scene during creation; resize from Excalidraw
// is honoured as a hint and stored back. The block content (latex/text)
// is the React render — Excalidraw doesn't see it.

import { useEffect, useRef } from 'react';
import type {
  ExcalidrawElement,
  NonDeleted,
  ExcalidrawEmbeddableElement,
} from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import type { Block } from '../../state/types';

const DEFAULT_W = 280;
const DEFAULT_H = 56;
const TEXT_H = 64;

const MATH_PREFIX = 'mathblock://';
const TEXT_PREFIX = 'textblock://';

export function blockLink(block: Block): string {
  return `${block.type === 'math' ? MATH_PREFIX : TEXT_PREFIX}${block.id}`;
}

/** Extract a blockId from an embeddable element's `link`, or null if
 *  the element isn't one of ours. */
export function blockIdFromElement(el: ExcalidrawElement): { id: string; type: 'math' | 'text' } | null {
  if (el.type !== 'embeddable') return null;
  const link = (el as ExcalidrawEmbeddableElement).link;
  if (!link) return null;
  if (link.startsWith(MATH_PREFIX)) return { id: link.slice(MATH_PREFIX.length), type: 'math' };
  if (link.startsWith(TEXT_PREFIX)) return { id: link.slice(TEXT_PREFIX.length), type: 'text' };
  return null;
}

/** True if the Excalidraw element is one of our block embeddables. */
export function isAnchor(el: ExcalidrawElement): boolean {
  return blockIdFromElement(el) !== null;
}

export function anchorBlockId(el: ExcalidrawElement): string | null {
  return blockIdFromElement(el)?.id ?? null;
}

/** Validator passed to `<Excalidraw validateEmbeddable>` so our custom
 *  scheme is allowed and the canvas renders the embeddable. */
export function isBlockLink(link: string): boolean {
  return link.startsWith(MATH_PREFIX) || link.startsWith(TEXT_PREFIX);
}

/**
 * useEmbeddableSync — keeps a 1:1 embeddable element on the canvas for
 * every block. Two-way: store position → element, element position →
 * store. Run from CanvasPanel.
 */
export function useEmbeddableSync(
  apiRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>,
): void {
  const sheet = useActiveSheet();
  const moveBlock = useStore((s) => s.moveBlock);

  // Track last positions we wrote to the canvas so we don't ping-pong.
  const lastWritten = useRef(new Map<string, { x: number; y: number }>());

  // store → scene
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !sheet) return;
    syncEmbeddablesFromBlocks(api, sheet.blocks, lastWritten.current);
  }, [apiRef, sheet]);

  // scene → store
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const off = api.onChange(() => {
      pullEmbeddablePositions(api, moveBlock, lastWritten.current);
    });
    return () => { off(); };
  }, [apiRef, moveBlock]);
}

// ----- impl ------------------------------------------------------------

function syncEmbeddablesFromBlocks(
  api: ExcalidrawImperativeAPI,
  blocks: readonly Block[],
  lastWritten: Map<string, { x: number; y: number }>,
): void {
  const elements = api.getSceneElementsIncludingDeleted();
  const byBlockId = new Map<string, ExcalidrawElement>();
  for (const el of elements) {
    const id = anchorBlockId(el);
    if (id) byBlockId.set(id, el);
  }

  const wanted = new Set(blocks.map((b) => b.id));
  let needsUpdate = false;
  const next: ExcalidrawElement[] = elements.map((el) => {
    const id = anchorBlockId(el);
    if (!id) return el;
    if (!wanted.has(id)) {
      needsUpdate = true;
      return { ...el, isDeleted: true } as ExcalidrawElement;
    }
    const block = blocks.find((b) => b.id === id);
    if (!block) return el;
    if (el.x === block.x && el.y === block.y) return el;
    lastWritten.set(id, { x: block.x, y: block.y });
    needsUpdate = true;
    return { ...el, x: block.x, y: block.y } as ExcalidrawElement;
  });

  // Add any blocks that don't yet have an embeddable.
  for (const block of blocks) {
    if (byBlockId.has(block.id)) continue;
    next.push(makeEmbeddable(block));
    lastWritten.set(block.id, { x: block.x, y: block.y });
    needsUpdate = true;
  }

  if (needsUpdate) {
    api.updateScene({
      elements: next as NonDeleted<ExcalidrawElement>[],
      captureUpdate: 'never' as unknown as never,
    });
  }
}

function pullEmbeddablePositions(
  api: ExcalidrawImperativeAPI,
  moveBlock: (id: string, x: number, y: number) => void,
  lastWritten: Map<string, { x: number; y: number }>,
): void {
  const elements = api.getSceneElements();
  for (const el of elements) {
    const id = anchorBlockId(el);
    if (!id) continue;
    const seen = lastWritten.get(id);
    if (seen && seen.x === el.x && seen.y === el.y) continue;
    lastWritten.set(id, { x: el.x, y: el.y });
    moveBlock(id, el.x, el.y);
  }
}

function makeEmbeddable(block: Block): ExcalidrawElement {
  const w = DEFAULT_W;
  const h = block.type === 'text' ? TEXT_H : DEFAULT_H;
  const id = `block-${block.id}`;
  return {
    id,
    type: 'embeddable',
    x: block.x,
    y: block.y,
    width: w,
    height: h,
    angle: 0,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: { type: 3 },
    seed: hashId(id),
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: blockLink(block),
    locked: false,
    customData: { kind: 'mathBlockAnchor', blockId: block.id, blockType: block.type },
    version: 1,
    validated: true,
  } as unknown as ExcalidrawElement;
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Legacy alias kept for callers that haven't migrated. */
export const useAnchorSync = useEmbeddableSync;
