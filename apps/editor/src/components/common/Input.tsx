// Themed text input. Wraps native <input>; we own height, padding,
// border, focus ring. No JS — it's just classes.

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '../../utils/cx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ invalid, className, ...rest }, ref) => (
    <input
      ref={ref}
      {...rest}
      className={cx(
        'h-8 px-2.5 text-sm rounded-md bg-surface text-fg',
        'border border-border placeholder:text-fg-faint',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-app',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        invalid && 'border-danger focus-visible:ring-danger',
        className,
      )}
    />
  ),
);
Input.displayName = 'Input';
