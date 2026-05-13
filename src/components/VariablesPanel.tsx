// Bottom-right floating panel listing the variable definitions detected on
// the active sheet. Updated live as the user types.

import { useMemo } from 'react';
import { useActiveSheet } from '../state/selectors';
import { detectDefinition } from '../solver';
import type { MathBlock } from '../state/types';

export function VariablesPanel() {
  const sheet = useActiveSheet();

  const defs = useMemo(() => {
    const out: { name: string; latex: string }[] = [];
    for (const b of sheet.blocks) {
      if (b.type !== 'math') continue;
      const d = detectDefinition(b as MathBlock);
      if (d) out.push({ name: d.name, latex: d.latex });
    }
    return out;
  }, [sheet.blocks]);

  if (defs.length === 0) return null;

  return (
    <div
      className="absolute bottom-3.5 right-3.5 z-[6] pointer-events-none
                 max-w-[220px] px-2.5 py-2
                 bg-surface-glass backdrop-blur-md border border-border
                 rounded-lg shadow-pill text-xs"
    >
      <div className="text-fg-muted mb-1 uppercase tracking-wide text-[10px]">
        Known values · {defs.length}
      </div>
      <ul className="text-fg-2 space-y-0.5 font-mono tabular-nums">
        {defs.map((d, i) => (
          <li key={i}>
            <span className="text-accent">{d.name}</span>
            <span className="text-fg-faint"> = </span>
            <span>{d.latex}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
