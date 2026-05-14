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

// Excalidraw's `DEFAULT_ELEMENT_PROPS.strokeColor` is `#1e1e1e`, which
// reads beautifully on Excalidraw's stock light/dark canvas (their
// "dark" theme actually keeps the bg light-ish so #1e1e1e is legible).
// Math Notebook is true-dark on a #121212 canvas — black strokes are
// invisible there. We override the block creation defaults with a
// theme-aware light gray so freshly-created blocks have a visible
// frame AND visible content (BlockEmbed maps `strokeColor` straight
// to the math-field / contenteditable `color`).
const DEFAULT_BLOCK_STROKE_COLOR = '#e5e5e5';
// Transparent so the canvas frame is the only visible fill; lets
// users see what's behind a block without it acting as a sticky note.
const DEFAULT_BLOCK_BACKGROUND_COLOR = 'transparent';

// ----- create ----------------------------------------------------------

// blockId is always equal to the underlying element.id. We pass a
// placeholder into convertToExcalidrawElements so the skeleton typecheck
// is happy, then overwrite it on the produced element. The returned
// string is the element.id, which is what the store keys on.
function harmonizeBlockId(
  built: readonly { id: string }[],
): string | null {
  const first = built[0];
  if (!first) return null;
  (first as unknown as { blockId: string }).blockId = first.id;
  return first.id;
}

export function addMathElement(
  opts: Partial<MathBlock> = {},
): string | null {
  const api = getExcalidrawAPI();
  if (!api) return null;
  const elements = api.getSceneElements();
  const skeleton: ExcalidrawElementSkeleton = {
    type: 'math',
    x: opts.x ?? 100,
    y: opts.y ?? 100,
    width: DEFAULT_W,
    height: MATH_DEFAULT_H,
    // Placeholder — overwritten with element.id below.
    blockId: '',
    latex: opts.latex ?? '',
    fontSize: opts.fontSize ?? DEFAULT_MATH_FONT,
    strokeColor: DEFAULT_BLOCK_STROKE_COLOR,
    backgroundColor: DEFAULT_BLOCK_BACKGROUND_COLOR,
    ...(opts.note !== undefined ? { note: opts.note } : {}),
    showNote: opts.showNote ?? false,
  } as ExcalidrawElementSkeleton;
  const built = convertToExcalidrawElements([skeleton]);
  const id = harmonizeBlockId(built);
  if (!id) return null;
  api.updateScene({
    elements: [...elements, ...built],
    captureUpdate: 'capture' as unknown as never,
  });
  api.setActiveTool({ type: 'selection' });
  // Select the new block so the user can immediately type.
  api.updateScene({
    appState: { selectedElementIds: { [id]: true } } as never,
    captureUpdate: 'never' as unknown as never,
  });
  return id;
}

export function addTextBlockElement(
  opts: Partial<TextBlock> = {},
): string | null {
  const api = getExcalidrawAPI();
  if (!api) return null;
  const elements = api.getSceneElements();
  const skeleton: ExcalidrawElementSkeleton = {
    type: 'text-block',
    x: opts.x ?? 100,
    y: opts.y ?? 100,
    width: DEFAULT_W,
    height: TEXT_DEFAULT_H,
    blockId: '',
    text: opts.text ?? '',
    fontSize: opts.fontSize ?? DEFAULT_TEXT_FONT,
    strokeColor: DEFAULT_BLOCK_STROKE_COLOR,
    backgroundColor: DEFAULT_BLOCK_BACKGROUND_COLOR,
    ...(opts.note !== undefined ? { note: opts.note } : {}),
    showNote: opts.showNote ?? false,
  } as ExcalidrawElementSkeleton;
  const built = convertToExcalidrawElements([skeleton]);
  const id = harmonizeBlockId(built);
  if (!id) return null;
  api.updateScene({
    elements: [...elements, ...built],
    captureUpdate: 'capture' as unknown as never,
  });
  api.setActiveTool({ type: 'selection' });
  api.updateScene({
    appState: { selectedElementIds: { [id]: true } } as never,
    captureUpdate: 'never' as unknown as never,
  });
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
  const elements = api.getSceneElements();
  // Generate a single fresh id; blockId mirrors element.id so paste +
  // duplicate share one source of uniqueness.
  const newId = `${source.id}-copy-${Math.random().toString(36).slice(2, 8)}`;
  const copy = {
    ...source,
    id: newId,
    blockId: newId,
    x: source.x + 30,
    y: source.y + 30,
  } as ExcalidrawElement;
  api.updateScene({
    elements: [...elements, copy] as never,
    captureUpdate: 'capture' as unknown as never,
  });
  api.updateScene({
    appState: { selectedElementIds: { [newId]: true } } as never,
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
