// JSXGraph 2D backend. Lazy-loaded — only the active GraphPanel pulls it.
//
// JSXGraph ships with no first-class TypeScript types; we declare the
// narrow surface we use ambiently (see src/vite-env.d.ts).
//
// Important quirks the consumer should know:
//   - JSXGraph mutates the DOM container directly; React must not own
//     its children. We mount via a passthrough div + ref.
//   - Board events are imperative; for Variables-binding we re-create
//     all plot elements when `variables` changes (board.suspendUpdate
//     batches it).

import { registerGrapher, type Grapher, type GrapherInstance, type GrapherInput } from './index';
import { compileFunction } from './detectSpec';
import { PLOT_COLORS } from './spec';

interface JXGBoard {
  create(type: string, parents: unknown[], opts?: Record<string, unknown>): unknown;
  removeObject(obj: unknown): void;
  setBoundingBox(box: [number, number, number, number], keepaspectratio?: boolean): void;
  suspendUpdate(): void;
  unsuspendUpdate(): void;
  containerObj: HTMLElement;
  on(event: string, cb: (e: Event) => void): void;
  off(event: string, cb: (e: Event) => void): void;
}

interface JXGStatic {
  JSXGraph: {
    initBoard(container: HTMLElement | string, opts: Record<string, unknown>): JXGBoard;
    freeBoard(board: JXGBoard): void;
  };
}

let cachedJXG: JXGStatic | null = null;

async function loadJSXGraph(): Promise<JXGStatic> {
  if (cachedJXG) return cachedJXG;
  // jsxgraph exposes `JXG` as default export in its ESM build.
  const mod = await import('jsxgraph');
  cachedJXG = (mod as unknown as { default: JXGStatic }).default ?? (mod as unknown as JXGStatic);
  // CSS for the JSXGraph board chrome (axis labels, etc.). Vendored —
  // the upstream package's `exports` map blocks deep CSS imports, so we
  // ship a snapshot under src/vendor/ with the upstream license header.
  await import('../vendor/jsxgraph.vendor.css');
  return cachedJXG;
}

const jsxgraph2d: Grapher = {
  id: 'jsxgraph2d',
  dimensions: '2d',
  supports: ['function', 'parametric', 'implicit', 'points'],

  async create(container: HTMLElement, input: GrapherInput): Promise<GrapherInstance> {
    const JXG = await loadJSXGraph();
    const bounds = input.bounds ?? defaultBounds(input);

    const board = JXG.JSXGraph.initBoard(container, {
      boundingBox: [bounds.xMin, bounds.yMax, bounds.xMax, bounds.yMin],
      axis: true,
      grid: input.grid ?? true,
      keepaspectratio: input.equalScale ?? false,
      showCopyright: false,
      showNavigation: true,
      pan: { enabled: true, needShift: false },
      zoom: { wheel: true },
    });

    let plotted: unknown[] = [];

    const apply = (next: GrapherInput) => {
      // Zustand + immer deep-freezes its state. JSXGraph mutates the
      // option objects we pass it (e.g. it sets .x on point options
      // during board construction), which throws "Cannot assign to
      // read only property" on frozen inputs. Defensive clone before
      // hand-off.
      const specs = next.specs.map((s) => structuredClone(s)) as typeof next.specs;
      const variables = next.variables ? { ...next.variables } : undefined;

      board.suspendUpdate();
      for (const obj of plotted) board.removeObject(obj);
      plotted = [];
      specs.forEach((spec, i) => {
        const color = (spec as { color?: string }).color ?? PLOT_COLORS[i % PLOT_COLORS.length];
        const baseOpts = { strokeColor: color, strokeWidth: 2, highlight: false, name: spec.kind === 'function' ? spec.label : undefined };
        switch (spec.kind) {
          case 'function': {
            const f = compileFunction(spec.expression, spec.variable ?? 'x', variables);
            plotted.push(board.create('functiongraph', [f], { ...baseOpts }));
            break;
          }
          case 'parametric': {
            const fx = compileFunction(spec.xExpression, spec.parameter ?? 't', variables);
            const fy = compileFunction(spec.yExpression, spec.parameter ?? 't', variables);
            plotted.push(board.create('curve', [fx, fy, spec.tMin ?? -10, spec.tMax ?? 10], { ...baseOpts }));
            break;
          }
          case 'implicit': {
            const fxy = compileImplicit(spec.expression, variables);
            plotted.push(board.create('implicitcurve', [fxy], { ...baseOpts }));
            break;
          }
          case 'points': {
            for (const pt of spec.points) {
              // `pt` is a tuple from the cloned spec; JSXGraph wants
              // primitive numbers it can read by index.
              const x = Number(pt[0]);
              const y = Number(pt[1]);
              plotted.push(board.create('point', [x, y], { ...baseOpts, fixed: true }));
            }
            break;
          }
          case 'inequality': {
            const f = compileFunction(spec.expression, 'x', variables);
            plotted.push(board.create('inequality', [
              board.create('functiongraph', [f], { ...baseOpts }),
            ], { ...baseOpts, fillColor: color, fillOpacity: 0.15 }));
            break;
          }
        }
      });
      board.unsuspendUpdate();
    };

    apply(input);

    return {
      element: null, // We rendered into `container` imperatively
      async snapshotToDataURL() {
        const svg = container.querySelector('svg');
        if (!svg) return null;
        const xml = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([xml], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        try {
          const img = await loadImage(url);
          const rect = container.getBoundingClientRect();
          const canvas = document.createElement('canvas');
          canvas.width = rect.width;
          canvas.height = rect.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, rect.width, rect.height);
          return {
            dataURL: canvas.toDataURL('image/png'),
            width: rect.width,
            height: rect.height,
          };
        } finally {
          URL.revokeObjectURL(url);
        }
      },
      dispose() {
        for (const obj of plotted) board.removeObject(obj);
        try { (JXG.JSXGraph.freeBoard ?? (() => {}))(board); } catch { /* ignore */ }
      },
    };
  },
};

registerGrapher(jsxgraph2d);

// ----- helpers --------------------------------------------------------

function compileImplicit(
  latexExpr: string,
  variables?: Record<string, number>,
): (x: number, y: number) => number {
  // Two-variable implicit: re-derive a single-variable evaluator with
  // `x` baked in as a substitution on each call. Slower than a true
  // 2-var compile but uses the same compute-engine pipeline.
  return (x: number, y: number) =>
    compileFunction(latexExpr, 'y', { ...(variables ?? {}), x })(y);
}

function defaultBounds(_input: GrapherInput) {
  return { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = url;
  });
}
