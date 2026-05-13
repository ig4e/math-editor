// Math-diagram templates — curated set of one-click drop-ins users
// invoke from "Insert template…" (canvas.insertTemplate command) or from
// individual commands canvas.template.<id>.
//
// Each template's `build(origin)` returns an ExcalidrawElementSkeleton[]
// (the input shape convertToExcalidrawElements accepts). Skeletons are
// laid out relative to `origin`; the command shifts origin to roughly
// the canvas viewport center before insertion.
//
// A separate Node script `scripts/emit-library.mjs` re-runs each build()
// to generate `public/math-templates.excalidrawlib` so the templates
// also appear in Excalidraw's native Library panel.

import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform';

export type TemplateCategory = 'numeracy' | 'geometry' | 'sets' | 'logic' | 'ml';

export interface TemplateDef {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  build(origin: { x: number; y: number }): ExcalidrawElementSkeleton[];
}

// ----- builders --------------------------------------------------------

function numberLine({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  const els: ExcalidrawElementSkeleton[] = [
    { type: 'line', x, y, width: 400, height: 0, strokeWidth: 2 },
  ];
  for (let i = 0; i <= 10; i++) {
    const tx = x + i * 40;
    els.push({ type: 'line', x: tx, y: y - 6, width: 0, height: 12, strokeWidth: 1 });
    els.push({ type: 'text', x: tx - 6, y: y + 10, text: String(i - 5), fontSize: 14 });
  }
  return els;
}

function unitCircle({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  const r = 120, cx = x + r, cy = y + r;
  return [
    { type: 'ellipse', x, y, width: r * 2, height: r * 2, strokeWidth: 2 },
    { type: 'line', x: cx - r - 20, y: cy, width: r * 2 + 40, height: 0 },     // x-axis
    { type: 'line', x: cx, y: cy - r - 20, width: 0, height: r * 2 + 40 },     // y-axis
    { type: 'text', x: cx + r + 4, y: cy - 16, text: 'x', fontSize: 16 },
    { type: 'text', x: cx + 4,     y: cy - r - 24, text: 'y', fontSize: 16 },
    { type: 'text', x: cx + r * 0.7 - 12, y: cy - r * 0.7 - 18, text: 'π/4', fontSize: 14 },
    { type: 'text', x: cx + r * 0.5 - 12, y: cy - r * 0.87 - 18, text: 'π/3', fontSize: 14 },
    { type: 'text', x: cx + r * 0.87 - 12, y: cy - r * 0.5 - 18, text: 'π/6', fontSize: 14 },
  ];
}

function coordinatePlane({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  const size = 240, cx = x + size / 2, cy = y + size / 2;
  const els: ExcalidrawElementSkeleton[] = [
    { type: 'arrow', x: x - 10, y: cy, width: size + 20, height: 0, strokeWidth: 1.5 },
    { type: 'arrow', x: cx, y: y + size + 10, width: 0, height: -size - 20, strokeWidth: 1.5 },
    { type: 'text', x: x + size + 8, y: cy - 18, text: 'x', fontSize: 16 },
    { type: 'text', x: cx + 6, y: y - 14, text: 'y', fontSize: 16 },
    { type: 'text', x: cx + 4, y: cy + 4, text: '0', fontSize: 12 },
  ];
  // light grid: 5 minor lines each side
  for (let i = 1; i <= 5; i++) {
    const off = i * 24;
    els.push({ type: 'line', x: cx + off, y: cy - 4, width: 0, height: 8, strokeWidth: 1 });
    els.push({ type: 'line', x: cx - off, y: cy - 4, width: 0, height: 8, strokeWidth: 1 });
    els.push({ type: 'line', x: cx - 4, y: cy + off, width: 8, height: 0, strokeWidth: 1 });
    els.push({ type: 'line', x: cx - 4, y: cy - off, width: 8, height: 0, strokeWidth: 1 });
  }
  return els;
}

function venn2({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  const r = 90;
  return [
    { type: 'ellipse', x, y, width: r * 2, height: r * 2, strokeWidth: 2 },
    { type: 'ellipse', x: x + r * 1.1, y, width: r * 2, height: r * 2, strokeWidth: 2 },
    { type: 'text', x: x + r * 0.4 - 8, y: y - 22, text: 'A', fontSize: 18 },
    { type: 'text', x: x + r * 1.7 - 8, y: y - 22, text: 'B', fontSize: 18 },
  ];
}

function venn3({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  const r = 80;
  return [
    { type: 'ellipse', x, y: y + r * 0.6, width: r * 2, height: r * 2, strokeWidth: 2 },
    { type: 'ellipse', x: x + r * 1.1, y: y + r * 0.6, width: r * 2, height: r * 2, strokeWidth: 2 },
    { type: 'ellipse', x: x + r * 0.55, y, width: r * 2, height: r * 2, strokeWidth: 2 },
    { type: 'text', x: x - 18, y: y + r * 1.7, text: 'A', fontSize: 18 },
    { type: 'text', x: x + r * 2 + 10, y: y + r * 1.7, text: 'B', fontSize: 18 },
    { type: 'text', x: x + r * 1.4, y: y - 22, text: 'C', fontSize: 18 },
  ];
}

function rightTriangle({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  return [
    { type: 'line', x, y: y + 160, width: 200, height: 0, strokeWidth: 2 },       // a (bottom)
    { type: 'line', x, y, width: 0, height: 160, strokeWidth: 2 },                // b (left)
    { type: 'line', x, y, width: 200, height: 160, strokeWidth: 2 },              // c (hypotenuse)
    { type: 'text', x: x + 90, y: y + 168, text: 'a', fontSize: 16 },
    { type: 'text', x: x - 16, y: y + 70, text: 'b', fontSize: 16 },
    { type: 'text', x: x + 105, y: y + 60, text: 'c', fontSize: 16 },
  ];
}

function functionMachine({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  return [
    { type: 'text', x, y: y + 22, text: 'input', fontSize: 14 },
    { type: 'arrow', x: x + 56, y: y + 30, width: 40, height: 0, strokeWidth: 1.5 },
    { type: 'rectangle', x: x + 100, y, width: 100, height: 60, strokeWidth: 2 },
    { type: 'text', x: x + 134, y: y + 22, text: 'f(x)', fontSize: 16 },
    { type: 'arrow', x: x + 200, y: y + 30, width: 40, height: 0, strokeWidth: 1.5 },
    { type: 'text', x: x + 244, y: y + 22, text: 'output', fontSize: 14 },
  ];
}

function truthTable({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  const cw = 60, rh = 26;
  const els: ExcalidrawElementSkeleton[] = [];
  const headers = ['P', 'Q', 'P ∧ Q', 'P ∨ Q'];
  for (let c = 0; c < headers.length; c++) {
    els.push({ type: 'rectangle', x: x + c * cw, y, width: cw, height: rh, strokeWidth: 1 });
    els.push({ type: 'text', x: x + c * cw + 22, y: y + 6, text: headers[c]!, fontSize: 14 });
  }
  const rows = [['T', 'T', 'T', 'T'], ['T', 'F', 'F', 'T'], ['F', 'T', 'F', 'T'], ['F', 'F', 'F', 'F']];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < 4; c++) {
      els.push({ type: 'rectangle', x: x + c * cw, y: y + (r + 1) * rh, width: cw, height: rh, strokeWidth: 1 });
      els.push({ type: 'text', x: x + c * cw + 26, y: y + (r + 1) * rh + 6, text: rows[r]![c]!, fontSize: 13 });
    }
  }
  return els;
}

function perceptron({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  const els: ExcalidrawElementSkeleton[] = [];
  const inX = x, inY = y, cellR = 30, outX = x + 200, outY = y + 30;
  for (let i = 0; i < 3; i++) {
    const cy = inY + i * 60;
    els.push({ type: 'ellipse', x: inX, y: cy, width: cellR * 2, height: cellR * 2, strokeWidth: 1.5 });
    els.push({ type: 'text', x: inX + 18, y: cy + 18, text: `x${i + 1}`, fontSize: 14 });
    els.push({ type: 'arrow', x: inX + cellR * 2, y: cy + cellR, width: outX - (inX + cellR * 2), height: outY + cellR - (cy + cellR), strokeWidth: 1 });
  }
  els.push({ type: 'ellipse', x: outX, y: outY, width: cellR * 2, height: cellR * 2, strokeWidth: 1.5 });
  els.push({ type: 'text', x: outX + 22, y: outY + 18, text: 'y', fontSize: 14 });
  return els;
}

function mlpLayers({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  const els: ExcalidrawElementSkeleton[] = [];
  const r = 18, colDx = 90;
  const layers = [3, 4, 4, 2];
  for (let L = 0; L < layers.length; L++) {
    const n = layers[L]!;
    const colX = x + L * colDx;
    for (let i = 0; i < n; i++) {
      const cy = y + i * 50 + (4 - n) * 25;
      els.push({ type: 'ellipse', x: colX, y: cy, width: r * 2, height: r * 2, strokeWidth: 1.2 });
      if (L < layers.length - 1) {
        const nNext = layers[L + 1]!;
        for (let j = 0; j < nNext; j++) {
          const ny = y + j * 50 + (4 - nNext) * 25;
          els.push({ type: 'line', x: colX + r * 2, y: cy + r, width: colDx - r * 2, height: (ny + r) - (cy + r), strokeWidth: 0.6 });
        }
      }
    }
  }
  return els;
}

function computationGraph({ x, y }: { x: number; y: number }): ExcalidrawElementSkeleton[] {
  // x → (·) → ŷ ; w, b feed in
  const sz = 40;
  return [
    { type: 'ellipse', x, y: y + 30, width: sz, height: sz, strokeWidth: 1.5 },
    { type: 'text', x: x + 14, y: y + 42, text: 'x', fontSize: 14 },
    { type: 'ellipse', x, y: y + 90, width: sz, height: sz, strokeWidth: 1.5 },
    { type: 'text', x: x + 14, y: y + 102, text: 'w', fontSize: 14 },
    { type: 'rectangle', x: x + 110, y: y + 50, width: sz, height: sz, strokeWidth: 1.5 },
    { type: 'text', x: x + 122, y: y + 62, text: '×', fontSize: 18 },
    { type: 'arrow', x: x + sz, y: y + 50, width: 70, height: 20, strokeWidth: 1 },
    { type: 'arrow', x: x + sz, y: y + 110, width: 70, height: -25, strokeWidth: 1 },
    { type: 'ellipse', x: x + 220, y: y + 50, width: sz, height: sz, strokeWidth: 1.5 },
    { type: 'text', x: x + 226, y: y + 62, text: 'ŷ', fontSize: 14 },
    { type: 'arrow', x: x + 150, y: y + 70, width: 70, height: 0, strokeWidth: 1 },
  ];
}

// ----- registry -------------------------------------------------------

export const TEMPLATES: readonly TemplateDef[] = [
  { id: 'number-line', name: 'Number line', category: 'numeracy',
    description: 'Labeled −5 … 5 number line for ranges and intervals.', build: numberLine },
  { id: 'unit-circle', name: 'Unit circle', category: 'geometry',
    description: 'Circle with x/y axes and key angles π/6, π/4, π/3.', build: unitCircle },
  { id: 'coordinate-plane', name: 'Coordinate plane', category: 'geometry',
    description: 'Axes with tick marks for sketching curves and points.', build: coordinatePlane },
  { id: 'right-triangle', name: 'Right triangle', category: 'geometry',
    description: 'a/b/c labeled for Pythagorean / trig setups.', build: rightTriangle },
  { id: 'venn-2', name: 'Venn diagram (2-set)', category: 'sets',
    description: 'Two intersecting circles labeled A, B.', build: venn2 },
  { id: 'venn-3', name: 'Venn diagram (3-set)', category: 'sets',
    description: 'Three intersecting circles labeled A, B, C.', build: venn3 },
  { id: 'function-machine', name: 'Function machine', category: 'logic',
    description: 'input → f(x) → output sketch.', build: functionMachine },
  { id: 'truth-table', name: 'Truth table (P, Q)', category: 'logic',
    description: 'P / Q / P ∧ Q / P ∨ Q grid pre-filled.', build: truthTable },
  { id: 'perceptron', name: 'Perceptron', category: 'ml',
    description: 'Three inputs → single output neuron.', build: perceptron },
  { id: 'mlp-layers', name: 'MLP layers (3-4-4-2)', category: 'ml',
    description: 'Fully-connected four-layer schematic.', build: mlpLayers },
  { id: 'computation-graph', name: 'Computation graph (ŷ = w·x)', category: 'ml',
    description: 'Two inputs, one product node, one output.', build: computationGraph },
];

export function findTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
