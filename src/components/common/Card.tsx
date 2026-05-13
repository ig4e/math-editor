// Surface + border + radius + padding. Used for steps cards, AI
// message bubbles, reference entries, settings groups.
//
// Radius (12 px) matches Excalidraw's `.island` chrome — the rounded
// panel they use for the library / dock / dialogs. Density picks line
// up with Excalidraw's `--space-factor` rhythm.

import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';

interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Tone of the card border / bg. */
  tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'success';
  /** Compact (p-2), standard (p-3), large (p-4). */
  density?: 'compact' | 'standard' | 'comfortable';
  /** Optional top-of-card title row. */
  title?: ReactNode;
  /** Right slot in the title row — buttons, kbds, etc. */
  titleActions?: ReactNode;
}

const TONES = {
  neutral: 'bg-surface border-border',
  accent:  'bg-accent-bg border-accent-border',
  warn:    'bg-warning/10 border-warning/30',
  danger:  'bg-danger/10 border-danger/30',
  success: 'bg-success/10 border-success/30',
} as const;

const DENSITIES = {
  compact: 'p-2',
  standard: 'p-3',
  comfortable: 'p-4',
} as const;

export function Card({ tone = 'neutral', density = 'standard', title, titleActions, className, children, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={cx('rounded-xl border', TONES[tone], DENSITIES[density], className)}
    >
      {(title || titleActions) && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{title}</div>
          {titleActions && <div className="flex items-center gap-1">{titleActions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
