// Sheet-level graph helpers — at the moment, computing connected components
// of math blocks via Link edges (used by the solver to pick up the "linked
// group" around a focused block).

import type { Sheet, MathBlock, Block } from './types';

/** Returns all math blocks transitively linked to `startId` (inclusive).
 *  Treats links as undirected. */
export function connectedMathBlocks(sheet: Sheet, startId: string): MathBlock[] {
  const seen = new Set<string>([startId]);
  const stack = [startId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const l of sheet.links) {
      const next = l.fromId === id ? l.toId
                 : l.toId   === id ? l.fromId
                 : null;
      if (next && !seen.has(next)) {
        seen.add(next);
        stack.push(next);
      }
    }
  }
  return [...seen]
    .map((id) => sheet.blocks.find((b: Block) => b.id === id))
    .filter((b): b is MathBlock => !!b && b.type === 'math');
}
