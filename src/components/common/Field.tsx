// Form-row wrapper — label + control + optional hint / error / shortcut.
// Used in every settings form and dialog. Pairs label↔control via an
// auto-generated id.

import { useId, type ReactNode } from 'react';
import { cx } from '../../utils/cx';

interface Props {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Right-aligned tag (e.g. a kbd shortcut). */
  rightSlot?: ReactNode;
  /** Lay out label + control side-by-side (default: stacked). */
  inline?: boolean;
  /** Render-prop receives the id to wire into the control. */
  children: (id: string) => ReactNode;
  className?: string;
}

export function Field({ label, hint, error, rightSlot, inline, children, className }: Props) {
  const id = useId();
  return (
    <div className={cx('flex gap-2', inline ? 'flex-row items-center' : 'flex-col', className)}>
      {(label || rightSlot) && (
        <div className={cx('flex items-center justify-between', inline ? 'min-w-0 w-40' : '')}>
          {label && (
            <label htmlFor={id} className="text-sm font-medium text-fg">
              {label}
            </label>
          )}
          {rightSlot && <div className="ml-auto">{rightSlot}</div>}
        </div>
      )}
      <div className={cx('flex flex-col gap-1', inline && 'flex-1 min-w-0')}>
        {children(id)}
        {hint && !error && <div className="text-xs text-fg-muted">{hint}</div>}
        {error && <div className="text-xs text-danger">{error}</div>}
      </div>
    </div>
  );
}
