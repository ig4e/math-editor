// blockElements.ts — helpers that read/write math + text-block elements
// on the Excalidraw scene. The scene is the source-of-truth: each block
// is one `ExcalidrawMathElement` / `ExcalidrawTextBlockElement` carrying
// its content (latex / text / note) and position.
//
// The store still exposes Block objects via a mirror (so panels can
// subscribe with selectors as before), but every mutation flows
// through here -> api.updateScene. That eliminates the feedback loop
// the previous anchors.ts had: there is exactly one direction
// scene -> store, and no store -> scene write-back during onChange.

import {
  convertToExcalidrawElements,
  isBlockElement,
} from '@excalidraw/excalidraw';
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';
import type {
  ExcalidrawElement,
  ExcalidrawMathElement,
  ExcalidrawTextBlockElement,
} from '@excalidraw/excalidraw/element/types';
import { getExcalidrawAPI } from './inject';
import type { Block, MathBlock, TextBlock } from '../../state/types';

// Combined patch for either block kind. We can't use
// `Partial<MathBlock & TextBlock>` because intersecting the two narrows
// `type` to `never` (the literals don't overlap). Omitting both
// discriminators and IDs gives a flat shape that covers every field a
// caller might patch.
export type BlockPatch = Partial<Omit<MathBlock, 'type' | 'id'>> &
  Partial<Omit<TextBlock, 'type' | 'id'>>;

// ----- defaults --------------------------------------------------------

const DEFAULT_W = 280;
const MATH_DEFAULT_H = 56;
const TEXT_DEFAULT_H = 64;

const DEFAULT_MATH_FONT = 22;
const DEFAULT_TEXT_FONT = 16;

function nextId(): string {
  return `block-${Math.random().toString(36).slice(2, 11)}`;
}

// ----- create ----------------------------------------------------------

export function addMathElement(
  opts: Partial<MathBlock> = {},
): string | null {
  const api = getExcalidrawAPI();
  if (!api) return null;
  const id = nextId();
  const elements = api.getSceneElements();
  const skeleton: ExcalidrawElementSkeleton = {
    type: 'math',
    x: opts.x ?? 100,
    y: opts.y ?? 100,
    width: DEFAULT_W,
    height: MATH_DEFAULT_H,
    blockId: id,
    latex: opts.latex ?? '',
    fontSize: opts.fontSize ?? DEFAULT_MATH_FONT,
    ...(opts.note !== undefined ? { note: opts.note } : {}),
    showNote: opts.showNote ?? false,
  } as ExcalidrawElementSkeleton;
  const built = convertToExcalidrawElements([skeleton]);
  const first = built[0];
  api.updateScene({
    elements: [...elements, ...built],
    captureUpdate: 'capture' as unknown as never,
  });
  api.setActiveTool({ type: 'selection' });
  if (first) {
    // Select the new block so the user can immediately type.
    api.updateScene({
      appState: { selectedElementIds: { [first.id]: true } } as never,
      captureUpdate: 'never' as unknown as never,
    });
  }
  return id;
}

export function addTextBlockElement(
  opts: Partial<TextBlock> = {},
): string | null {
  const api = getExcalidrawAPI();
  if (!api) return null;
  const id = nextId();
  const elements = api.getSceneElements();
  const skeleton: ExcalidrawElementSkeleton = {
    type: 'text-block',
    x: opts.x ?? 100,
    y: opts.y ?? 100,
    width: DEFAULT_W,
    height: TEXT_DEFAULT_H,
    blockId: id,
    text: opts.text ?? '',
    fontSize: opts.fontSize ?? DEFAULT_TEXT_FONT,
    ...(opts.note !== undefined ? { note: opts.note } : {}),
    showNote: opts.showNote ?? false,
  } as ExcalidrawElementSkeleton;
  const built = convertToExcalidrawElements([skeleton]);
  const first = built[0];
  api.updateScene({
    elements: [...elements, ...built],
    captureUpdate: 'capture' as unknown as never,
  });
  api.setActiveTool({ type: 'selection' });
  if (first) {
    api.updateScene({
      appState: { selectedElementIds: { [first.id]: true } } as never,
      captureUpdate: 'never' as unknown as never,
    });
  }
  return id;
}

// ----- update / delete -------------------------------------------------

/** Find a math/text-block element by its `blockId`. */
export function findBlockElement(blockId: string) {
  const api = getExcalidrawAPI();
  if (!api) return null;
  const elements = api.getSceneElementsIncludingDeleted();
  for (const el of elements) {
    if (
      isBlockElement(el) &&
      !el.isDeleted &&
      'blockId' in el &&
      el.blockId === blockId
    ) {
      return el;
    }
  }
  return null;
}

/** Patch a block element's content (latex / text / note / fontSize). */
export function updateBlockElement(
  blockId: string,
  patch: BlockPatch,
): void {
  const api = getExcalidrawAPI();
  if (!api) return;
  const elements = api.getSceneElements();
  let touched = false;
  const next: ExcalidrawElement[] = elements.map((el) => {
    if (!isBlockElement(el)) return el;
    if (!('blockId' in el) || el.blockId !== blockId) return el;
    const merged = { ...el, ...patch } as ExcalidrawElement;
    touched = true;
    return merged;
  });
  if (!touched) return;
  api.updateScene({
    elements: next,
    captureUpdate: 'capture' as unknown as never,
  });
}

/** Soft-delete a block element. */
export function deleteBlockElement(blockId: string): void {
  const api = getExcalidrawAPI();
  if (!api) return;
  const elements = api.getSceneElementsIncludingDeleted();
  let touched = false;
  const next: ExcalidrawElement[] = elements.map((el) => {
    if (!isBlockElement(el)) return el;
    if (!('blockId' in el) || el.blockId !== blockId) return el;
    touched = true;
    return { ...el, isDeleted: true } as ExcalidrawElement;
  });
  if (!touched) return;
  api.updateScene({
    elements: next as never,
    captureUpdate: 'capture' as unknown as never,
  });
}

/** Duplicate: copy the element with a fresh blockId, offset by +30px. */
export function duplicateBlockElement(blockId: string): string | null {
  const api = getExcalidrawAPI();
  if (!api) return null;
  const source = findBlockElement(blockId);
  if (!source) return null;
  const newId = nextId();
  const elements = api.getSceneElements();
  const copy = {
    ...source,
    id: `${source.id}-copy-${Math.random().toString(36).slice(2, 8)}`,
    blockId: newId,
    x: source.x + 30,
    y: source.y + 30,
  } as ExcalidrawElement;
  api.updateScene({
    elements: [...elements, copy] as never,
    captureUpdate: 'capture' as unknown as never,
  });
  api.updateScene({
    appState: { selectedElementIds: { [copy.id]: true } } as never,
    captureUpdate: 'never' as unknown as never,
  });
  return newId;
}

// ----- store mirror ----------------------------------------------------

/** Build a Block (store shape) from a scene element. */
export function blockFromElement(
  el: ExcalidrawMathElement | ExcalidrawTextBlockElement,
): Block {
  if (el.type === 'math') {
    return {
      id: el.blockId,
      type: 'math',
      x: el.x,
      y: el.y,
      latex: el.latex,
      fontSize: el.fontSize,
      note: el.note ?? '',
      showNote: el.showNote ?? false,
    };
  }
  return {
    id: el.blockId,
    type: 'text',
    x: el.x,
    y: el.y,
    text: el.text,
    fontSize: el.fontSize,
    note: el.note ?? '',
    showNote: el.showNote ?? false,
  };
}

/** Snapshot every block element on the scene into the store shape. */
export function collectBlocks(): Block[] {
  const api = getExcalidrawAPI();
  if (!api) return [];
  const out: Block[] = [];
  for (const el of api.getSceneElements()) {
    if (
      isBlockElement(el) &&
      'blockId' in el &&
      typeof el.blockId === 'string'
    ) {
      out.push(blockFromElement(el));
    }
  }
  return out;
}
