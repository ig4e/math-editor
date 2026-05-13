// Math/text-block anchors — invisible Excalidraw rectangles that mirror
// each React block's bounds. This is what makes Excalidraw's native
// lasso/marquee/move/keyboard-nudge/alignment-guides work on math blocks
// the same as on shapes.
//
// Two directions of sync, both wired by useAnchorSync below:
//   1) block.x/y/size  → anchor element bounds  (when the user edits a
//                         field or we programmatically move a block)
//   2) anchor element bounds → block.x/y/size  (when the user drags the
//                         anchor in Excalidraw)
//
// Anchor elements are tagged with `customData = { kind: 'mathBlockAnchor',
// blockId, role? }` so we can round-trip them across persist + collab.

import { useEffect, useRef } from 'react';
import type {
  ExcalidrawElement,
  NonDeleted,
} from '@excalidraw/excalidraw/element/types';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import type { Block } from '../../state/types';

export interface AnchorCustomData {
  kind: 'mathBlockAnchor';
  blockId: string;
  role?: 'source' | 'derived' | 'system-member';
}

/** Default placeholder size if a block hasn't been measured yet. */
const DEFAULT_W = 240;
const DEFAULT_H = 48;

/** True when an Excalidraw element is one of our block anchors. */
export function isAnchor(el: ExcalidrawElement): boolean {
  const d = (el as ExcalidrawElement & { customData?: unknown }).customData as AnchorCustomData | undefined;
  return d?.kind === 'mathBlockAnchor';
}

export function anchorBlockId(el: ExcalidrawElement): string | null {
  const d = (el as ExcalidrawElement & { customData?: unknown }).customData as AnchorCustomData | undefined;
  return d?.kind === 'mathBlockAnchor' ? d.blockId : null;
}

/**
 * useAnchorSync — keeps a 1:1 anchor element on the canvas for every
 * block. Mount this once inside the Canvas panel.
 *
 * The implementation is intentionally cheap: we diff blocks and anchors
 * on each `appState` mutation tick (~250 ms debounced upstream) and call
 * `updateScene({ elements, captureUpdate: 'never' })` to push our deltas
 * — `captureUpdate: 'never'` keeps anchor sync out of Excalidraw's undo
 * stack so Ctrl+Z still feels right.
 */
export function useAnchorSync(
  apiRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>,
): void {
  const sheet = useActiveSheet();
  const moveBlock = useStore((s) => s.moveBlock);

  // Track the last known block positions we wrote to the canvas, so a
  // user-side drag (anchor changed → write back to block) doesn't
  // trigger us re-pushing the same position.
  const lastWritten = useRef(new Map<string, { x: number; y: number }>());

  // ---- store → anchors ----
  useEffect(() => {
    const api = apiRef.current;
    if (!api || !sheet) return;
    syncAnchorsToBlocks(api, sheet.blocks, lastWritten.current);
  }, [apiRef, sheet]);

  // ---- anchors → store ----
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const off = api.onChange(() => {
      pullAnchorsIntoBlocks(api, moveBlock, lastWritten.current);
    });
    return () => { off(); };
  }, [apiRef, moveBlock]);
}

// ----- impl ------------------------------------------------------------

function syncAnchorsToBlocks(
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
  const next: ExcalidrawElement[] = elements.map((el) => {
    const id = anchorBlockId(el);
    if (!id) return el;
    if (!wanted.has(id)) {
      // block deleted upstream → mark anchor deleted
      return { ...el, isDeleted: true } as ExcalidrawElement;
    }
    const block = blocks.find((b) => b.id === id);
    if (!block) return el;
    if (el.x === block.x && el.y === block.y) return el;
    lastWritten.set(id, { x: block.x, y: block.y });
    return { ...el, x: block.x, y: block.y } as ExcalidrawElement;
  });

  // Add any blocks that don't yet have an anchor.
  let needsUpdate = next.some((el, i) => el !== elements[i]);
  for (const block of blocks) {
    if (byBlockId.has(block.id)) continue;
    next.push(makeAnchor(block));
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

function pullAnchorsIntoBlocks(
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

function makeAnchor(block: Block): ExcalidrawElement {
  // We craft a minimal rectangle element. Type purity is sacrificed via
  // `as ExcalidrawElement` because crafting the entire Excalidraw element
  // shape inline triples the file size; updateScene tolerates extra fields.
  const id = `anchor:${block.id}`;
  return {
    id,
    type: 'rectangle',
    x: block.x,
    y: block.y,
    width: DEFAULT_W,
    height: DEFAULT_H,
    angle: 0,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 0,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: 0,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: hashId(id),
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    customData: {
      kind: 'mathBlockAnchor',
      blockId: block.id,
    } as AnchorCustomData,
    version: 1,
  } as unknown as ExcalidrawElement;
}

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
