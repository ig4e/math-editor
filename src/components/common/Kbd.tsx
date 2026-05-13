// Render a keyboard combo inline — either pass a raw tinykeys-format
// string (`$mod+Enter`) which we'll pretty-print via formatCombo, or
// pass children to render as-is.

import type { ReactNode } from 'react';
import { formatCombo } from '../../keybinds/defaults';
import { cx } from '../../utils/cx';

interface Props {
  combo?: string;
  children?: ReactNode;
  className?: string;
}

export function Kbd({ combo, children, className }: Props) {
  const label = combo ? formatCombo(combo) : children;
  return (
    <kbd
      className={cx(
        'inline-block text-[10px] font-mono font-medium',
        'px-1.5 py-0.5 rounded',
        'bg-surface-2 text-fg-2 border border-border-soft',
        className,
      )}
    >
      {label}
    </kbd>
  );
}
