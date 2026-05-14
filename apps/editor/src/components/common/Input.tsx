// Themed text input. Native <input> styled to match Excalidraw's
// `.TextInput` chrome — same height, padding, border, focus ring.

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cx } from '../../utils/cx';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const baseStyle: React.CSSProperties = {
  height: 32,
  padding: '0 10px',
  fontSize: 13,
  borderRadius: 'var(--border-radius-md, 6px)',
  background: 'var(--input-bg-color, var(--island-bg-color))',
  color: 'var(--text-primary-color)',
  border: '1px solid var(--input-border-color, var(--sidebar-border-color))',
  outline: 'none',
};

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ invalid, className, style, ...rest }, ref) => (
    <input
      ref={ref}
      {...rest}
      className={cx('panel-input', className)}
      style={{
        ...baseStyle,
        ...(invalid ? { borderColor: 'var(--color-danger, #db4f3d)' } : {}),
        ...style,
      }}
    />
  ),
);
Input.displayName = 'Input';
