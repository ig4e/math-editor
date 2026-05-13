// Tool schema the AI panel exposes to the LLM. Each tool either runs
// purely client-side (solve, simplify, graph, insert_block, pin_to_canvas)
// or routes to an edge function (ask_wolfram — P10). Tools that mutate
// the canvas or open panels go through the existing inject / workspace
// APIs so the AI's edits are indistinguishable from the user's.

import { tool } from 'ai';
import { z } from 'zod';
import { solve } from '../solvers';
import '../solvers/all';
import { useStore } from '../state/store';
import { injectText, injectImage } from '../panels/canvas/inject';
import type { ProviderAdapter } from './providers';

export interface BuildToolsOpts {
  /** Lookup the active workspace so insert-panel calls find their home. */
  openPanel(id: string): void;
}

export function buildTools(_provider: ProviderAdapter, opts: BuildToolsOpts) {
  return {
    solve: tool({
      description: 'Solve an equation or simplify an expression in LaTeX. Returns the resulting LaTeX and an optional step list.',
      inputSchema: z.object({
        latex: z.string().describe('LaTeX of the equation or expression.'),
        capability: z.enum(['solve', 'simplify', 'differentiate', 'integrate']).default('solve'),
        wantsSteps: z.boolean().default(false),
      }),
      execute: async ({ latex, capability, wantsSteps }) => {
        const r = await solve({ source: latex, capability }, { requireSteps: wantsSteps });
        return r;
      },
    }),

    graph: tool({
      description: 'Open the Graph 2D panel and plot the given LaTeX expression. Use for `y = f(x)` and implicit equations.',
      inputSchema: z.object({
        latex: z.string(),
        title: z.string().optional(),
      }),
      execute: async ({ latex, title }) => {
        // Inserting as a new math block is the simplest way to surface a
        // plot — the GraphPanel auto-plots any selected block.
        const id = useStore.getState().addMathBlock({ x: 250, y: 250, latex });
        opts.openPanel('graph2d');
        return { ok: true, blockId: id, title: title ?? latex };
      },
    }),

    graph3d: tool({
      description: 'Open Graph 3D and plot the given LaTeX expression. Use for `z = f(x,y)` and 3-tuples like `(cos(t), sin(t), t)`.',
      inputSchema: z.object({
        latex: z.string(),
      }),
      execute: async ({ latex }) => {
        const id = useStore.getState().addMathBlock({ x: 250, y: 250, latex });
        opts.openPanel('graph3d');
        return { ok: true, blockId: id };
      },
    }),

    insert_block: tool({
      description: 'Insert a new math or text block onto the active canvas.',
      inputSchema: z.object({
        type: z.enum(['math', 'text']).default('math'),
        content: z.string().describe('LaTeX for math, plain text for text.'),
        x: z.number().optional(),
        y: z.number().optional(),
      }),
      execute: async ({ type, content, x, y }) => {
        const at = { x: x ?? 250, y: y ?? 250 };
        const s = useStore.getState();
        const id = type === 'math'
          ? s.addMathBlock({ ...at, latex: content })
          : s.addTextBlock({ ...at, text: content });
        return { ok: true, blockId: id };
      },
    }),

    pin_text_to_canvas: tool({
      description: 'Drop a plain-text note onto the canvas at a position.',
      inputSchema: z.object({
        text: z.string(),
        x: z.number().default(200),
        y: z.number().default(200),
        fontSize: z.number().optional(),
      }),
      execute: async ({ text, x, y, fontSize }) => {
        injectText({ at: { x, y }, text, fontSize });
        return { ok: true };
      },
    }),

    pin_image_to_canvas: tool({
      description: 'Drop a PNG image (data URL) onto the canvas.',
      inputSchema: z.object({
        dataURL: z.string(),
        width: z.number(),
        height: z.number(),
        x: z.number().default(200),
        y: z.number().default(200),
      }),
      execute: async ({ dataURL, width, height, x, y }) => {
        injectImage({ at: { x, y }, dataURL, width, height });
        return { ok: true };
      },
    }),
  };
}
