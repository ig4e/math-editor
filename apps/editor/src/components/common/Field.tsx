// Form-row wrapper — label + control + optional hint / error /
// shortcut. Styled to match the Excalidraw sidebar tab content: label
// inherits `--text-primary-color`, hint uses the muted variant, error
// uses `--color-danger`. No Tailwind theme tokens are referenced.

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
    <div
      className={cx('flex gap-2', inline ? 'flex-row items-center' : 'flex-col', className)}
      style={{ color: 'var(--text-primary-color)' }}
    >
      {(label || rightSlot) && (
        <div
          className={cx('flex items-center justify-between', inline ? 'min-w-0 w-40' : '')}
        >
          {label && (
            <label
              htmlFor={id}
              style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary-color)' }}
            >
              {label}
            </label>
          )}
          {rightSlot && <div className="ml-auto">{rightSlot}</div>}
        </div>
      )}
      <div className={cx('flex flex-col gap-1', inline && 'flex-1 min-w-0')}>
        {children(id)}
        {hint && !error && (
          <div style={{ fontSize: 11, opacity: 0.65, color: 'var(--text-primary-color)' }}>
            {hint}
          </div>
        )}
        {error && (
          <div style={{ fontSize: 11, color: 'var(--color-danger, #db4f3d)' }}>{error}</div>
        )}
      </div>
    </div>
  );
}
