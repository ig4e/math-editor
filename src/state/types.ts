// Domain types. The v2 transformation keeps math + text blocks and sheets,
// and adds workspace layout, encrypted-keys, prefs. The strokes / shapes /
// links types below are LEGACY — still present so the old code keeps
// building during P1; Phase 2 deletes them when Excalidraw takes over.

// Legacy: pen / eraser / link tools go away in P2; selection is implicit
// in the new world. Keep the union for the old toolbar to compile.
export type Tool = 'move' | 'pen' | 'eraser' | 'link';

export type ColorName =
  | 'black' | 'red' | 'blue' | 'green' | 'orange' | 'purple';

export interface BaseBlock {
  id: string;
  x: number;          // world coords
  y: number;
  fontSize: number;
  note: string;
  showNote: boolean;
}

export interface MathBlock extends BaseBlock {
  type: 'math';
  latex: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  text: string;
}

export type Block = MathBlock | TextBlock;

// ---------- Marks (LEGACY — Phase 2 deletes) ---------------------------

export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: [number, number][];
}

export interface ShapeBase {
  id: string;
  color: string;
  width: number;
}
export interface CircleShape   extends ShapeBase { kind: 'circle';   cx: number; cy: number; r: number }
export interface RectShape     extends ShapeBase { kind: 'rect';     x: number; y: number; w: number; h: number }
export interface LineShape     extends ShapeBase { kind: 'line';     x1: number; y1: number; x2: number; y2: number }
export interface ArrowShape    extends ShapeBase { kind: 'arrow';    x1: number; y1: number; x2: number; y2: number }
export interface TriangleShape extends ShapeBase { kind: 'triangle'; points: [number, number][] }

export type Shape = CircleShape | RectShape | LineShape | ArrowShape | TriangleShape;

export interface Link {
  id: string;
  fromId: string;
  toId: string;
}

// ---------- View / Sheet ----------------------------

export interface View {
  panX: number;
  panY: number;
  zoom: number;
}

export interface Sheet {
  id: string;
  name: string;
  blocks: Block[];
  // Legacy fields kept for the existing slices; Phase 2 drops them.
  strokes: Stroke[];
  shapes: Shape[];
  links: Link[];
  view: View;
}

export type ToastKind = 'info' | 'success' | 'warn' | 'error';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

export type Theme = 'light' | 'dark';

// ---------- v2 additions: workspace, prefs, keys -----------------------

/** Curriculum the user picked in Settings. Drives AI prompt + Reference filter. */
export type Curriculum =
  | 'none'
  | 'ap-calc-ab' | 'ap-calc-bc'
  | 'ib-math-sl' | 'ib-math-hl'
  | 'a-level-further' | 'us-common-core-hs'
  | 'gre' | 'custom';

/** Workspace layout JSON, opaque to the rest of the store — flexlayout owns it. */
export type LayoutJSON = unknown;

/** Encrypted blob plus its WebCrypto IV. The key derives from a salt in IDB. */
export interface EncryptedKey {
  iv: string;       // base64
  ciphertext: string;
}

/** One provider's BYOK record. */
export interface ProviderKey {
  providerId: string;        // 'anthropic', 'openai', 'openai-compat:<label>', …
  model?: string;            // default model the user picked
  baseURL?: string;          // only for openai-compat
  key: EncryptedKey;
}
