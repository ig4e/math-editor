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

// ---------- Marks (drawn on the whiteboard) ----------------------------

/** Freehand pen stroke — a sequence of world-coord points. */
export interface Stroke {
  id: string;
  color: string;
  width: number;
  points: [number, number][];
}

/** Parametric shapes produced by the auto-shape recognizer. */
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

/** Visible equation link between two blocks; solving any one solves the group. */
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
