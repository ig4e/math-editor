// Floating status pill at bottom-left — quick feedback that doesn't merit
// a toast (selection count, current tool hint, etc.)

import { useStore } from '../state/store';
import { useSelectedBlocks, useSelectedMathBlocks } from '../state/selectors';
import { Icon } from './Icons';

export function SelectionHint() {
  const tool        = useStore((s) => s.tool);
  const autoShape   = useStore((s) => s.autoShape);
  const linkPending = useStore((s) => s.linkPendingFrom);
  const selected    = useSelectedBlocks();
  const mathChosen  = useSelectedMathBlocks();

  const lines: string[] = [];
  if (tool === 'pen') {
    lines.push(autoShape
      ? 'Pen + auto-shape — sketches get cleaned up'
      : 'Pen — drag to draw');
  }
  if (tool === 'eraser') lines.push('Eraser — drag over marks/links to remove');
  if (tool === 'link') {
    lines.push(linkPending
      ? 'Pick another block to link'
      : 'Click a block to start linking');
  }
  if (mathChosen.length >= 2) {
    lines.push(`${mathChosen.length} equations selected — Solve will solve as a system`);
  } else if (selected.length > 0) {
    lines.push(`${selected.length} selected`);
  }
  if (lines.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="absolute bottom-3.5 left-3.5 z-[6] pointer-events-none
                 inline-flex items-center gap-1.5 px-2.5 py-1.5
                 bg-surface-glass backdrop-blur-md border border-border
                 rounded-lg text-xs text-fg-2 shadow-pill"
    >
      <Icon name="info" className="!w-3.5 !h-3.5 text-accent" />
      <span>{lines.join(' · ')}</span>
    </div>
  );
}
