// Wolfram Alpha backend — online. Requires a deployment with the edge
// function (api/wolfram.ts) configured + WOLFRAM_APPID env set. The
// runner only reaches this solver when `allowOnline: true` is passed
// in SolveOptions.

import { registerSolver, type Solver, type SolverInput, type SolverResult } from './index';

const wolfram: Solver = {
  id: 'wolfram',
  capabilities: ['simplify', 'solve', 'differentiate', 'integrate'],
  priority: 2,           // lower than compute-engine; fallback when local fails
  online: true,
  async invoke(input: SolverInput): Promise<SolverResult> {
    const src = Array.isArray(input.source) ? input.source[0] : input.source;
    if (!src) return { ok: false, error: 'No source' };
    const verb = capabilityToVerb(input.capability);
    const q = `${verb} ${src}`;

    try {
      const res = await fetch(`/api/wolfram?q=${encodeURIComponent(q)}&format=short`);
      if (!res.ok) {
        const body = await res.text();
        return { ok: false, error: `Wolfram: ${res.status} ${body.slice(0, 80)}` };
      }
      const txt = (await res.text()).trim();
      if (!txt) return { ok: false, error: 'Wolfram returned no result' };
      return { ok: true, latex: txt, note: 'via Wolfram Alpha' };
    } catch (e) {
      return { ok: false, error: `Wolfram unreachable: ${(e as Error).message}` };
    }
  },
};

function capabilityToVerb(cap: SolverInput['capability']): string {
  switch (cap) {
    case 'simplify': return 'simplify';
    case 'solve':    return 'solve';
    case 'differentiate': return 'differentiate';
    case 'integrate':     return 'integrate';
    default:         return '';
  }
}

registerSolver(wolfram);
