// Renders a ```mermaid``` fenced code block from Notes. mermaid.render
// is async — we show a tiny spinner while it resolves, then drop the
// SVG via dangerouslySetInnerHTML (mermaid sanitises its own output
// via securityLevel: 'strict').

import { useEffect, useState } from 'react';
import { Spinner } from '../../components/common';
import { renderMermaid } from './renderMermaid';

interface Props { source: string }

export function MermaidBlock({ source }: Props) {
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSvg(null);
    setError(null);
    void renderMermaid(source).then((r) => {
      if (cancelled) return;
      if (r.svg) setSvg(r.svg);
      else setError(r.error ?? 'Render failed');
    });
    return () => { cancelled = true; };
  }, [source]);

  return (
    <div className="my-2 rounded-md border border-border bg-surface-2 overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border-soft bg-surface">
        <span className="text-[11px] uppercase tracking-wide text-fg-muted font-semibold">mermaid</span>
      </div>
      <div className="p-3 flex items-center justify-center min-h-[80px]">
        {error
          ? <pre className="text-xs text-danger whitespace-pre-wrap">{error}</pre>
          : svg
            ? <div className="max-w-full overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />
            : <Spinner size="sm" />}
      </div>
    </div>
  );
}
