// Inspector — pick a math block; render its MathJSON AST as a collapsible
// tree. Useful for debugging custom expressions, learning the symbolic
// structure compute-engine uses, and tracking down "why does this not
// simplify the way I expect" rabbit holes.

import { useMemo, useState } from 'react';
import { ComputeEngine, type BoxedExpression } from '@cortex-js/compute-engine';
import { useStore } from '../../state/store';
import { useSelectedMathBlocks } from '../../state/selectors';
import { PanelHeader, PanelStatus, EmptyState, Banner, Button } from '../../components/common';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';

const ce = new ComputeEngine();

export default function InspectorPanel() {
  const selected = useSelectedMathBlocks();
  const toast = useStore((s) => s.toast);

  const block = selected[0];
  const parsed = useMemo(() => {
    if (!block) return null;
    try {
      return ce.parse(block.latex);
    } catch (e) {
      return { error: (e as Error).message } as const;
    }
  }, [block?.latex]);

  if (!block) {
    return (
      <div className="flex flex-col h-full bg-surface">
        <PanelHeader title="Inspector" icon="search" />
        <EmptyState
          icon="search"
          title="Select a math block"
          description="Click into an equation on the canvas to see its MathJSON tree, free symbols, and numeric form."
        />
      </div>
    );
  }

  if (parsed && 'error' in parsed) {
    return (
      <div className="flex flex-col h-full bg-surface">
        <PanelHeader title="Inspector" icon="search" />
        <div className="p-3">
          <Banner kind="error" title="Parse failed">{parsed.error}</Banner>
        </div>
      </div>
    );
  }

  const expr = parsed as BoxedExpression;
  const json = expr.json as unknown;
  const unknowns = expr.unknowns ?? [];
  const numericLatex = (() => {
    try {
      const n = expr.N();
      const re = n.re;
      if (typeof re === 'number' && Number.isFinite(re)) return n.latex;
      return null;
    } catch { return null; }
  })();

  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader
        title="Inspector"
        icon="search"
        actions={
          <Button size="sm" variant="ghost" onClick={() => {
            void navigator.clipboard.writeText(JSON.stringify(json, null, 2));
            toast('MathJSON copied', 'success');
          }}>
            <Icon name="copy" /> JSON
          </Button>
        }
      />
      <div className="flex-1 overflow-auto p-3 flex flex-col gap-3 text-sm">
        <Section label="Source LaTeX">
          <code className="font-mono text-fg-2 break-all">{block.latex}</code>
        </Section>
        <Section label="Operator">
          <code className="font-mono text-accent">{expr.operator ?? '—'}</code>
        </Section>
        <Section label="Free symbols">
          {unknowns.length === 0
            ? <span className="text-fg-muted">none</span>
            : <div className="flex flex-wrap gap-1">
                {unknowns.map((u) => (
                  <span key={u} className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-accent-bg text-accent">{u}</span>
                ))}
              </div>
          }
        </Section>
        {numericLatex && (
          <Section label="Numeric value">
            <code className="font-mono text-fg-2">{numericLatex}</code>
          </Section>
        )}
        <Section label="MathJSON tree">
          <Tree node={json} depth={0} />
        </Section>
      </div>
      <PanelStatus>
        block <span className="text-fg">{block.id.slice(0, 6)}</span>
        <span>· {unknowns.length} free symbol{unknowns.length === 1 ? '' : 's'}</span>
      </PanelStatus>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] uppercase tracking-wide text-fg-muted">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Tree({ node, depth }: { node: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 3);

  if (typeof node === 'number' || typeof node === 'string') {
    return (
      <code className={cx('font-mono', typeof node === 'number' ? 'text-accent' : 'text-fg-2')}>
        {JSON.stringify(node)}
      </code>
    );
  }
  if (node === null) return <code className="font-mono text-fg-faint">null</code>;
  if (Array.isArray(node)) {
    const head = node[0];
    const rest = node.slice(1);
    return (
      <div className={cx(depth > 0 && 'ml-3 border-l border-border-soft pl-2')}>
        {/* eslint-disable-next-line no-restricted-syntax -- inline disclosure inside a tree row; styled to flow with siblings, not a panel button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 text-fg hover:text-accent"
        >
          <Icon name={open ? 'chevron-down' : 'chevron-right'} className="w-3 h-3" />
          <code className="font-mono text-accent">{typeof head === 'string' ? head : '[…]'}</code>
          <span className="text-[10px] text-fg-faint">({rest.length})</span>
        </button>
        {open && (
          <ul className="flex flex-col gap-0.5 mt-1">
            {rest.map((child: unknown, i: number) => (
              <li key={i}>
                <Tree node={child} depth={depth + 1} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return (
    <div className={cx(depth > 0 && 'ml-3 border-l border-border-soft pl-2')}>
      {Object.entries(node as Record<string, unknown>).map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-1">
          <code className="font-mono text-fg-muted">{k}:</code>
          <Tree node={v} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}
