export type Tool = 'move' | 'pen' | 'eraser';

export type ColorName =
  | 'black' | 'red' | 'blue' | 'green' | 'orange' | 'purple';

export interface BaseBlock {
  id: string;
  x: number;          // world coords
  y: number;
  fontSize: number;   // base pixel size at zoom=1 (default 20)
  note: string;       // empty string when no note
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

export interface Stroke {
  id: string;
  color: string;                    // hex, baked at draw time
  width: number;                    // base width at zoom=1
  points: [number, number][];       // world coords
}

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
  view: View;
}

export type ToastKind = 'info' | 'success' | 'warn' | 'error';

export interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

export type Theme = 'light' | 'dark';
