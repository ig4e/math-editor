// The one Button in the app. Every other clickable that isn't a link uses
// this — direct <button> elements outside common/ are blocked by ESLint
// (see docs/contributing.md). Backed by a native <button>; we own the
// height, padding, focus ring, and disabled feel.

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cx } from '../../utils/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:   'bg-accent text-white hover:brightness-110 disabled:brightness-100',
  secondary: 'bg-surface-2 text-fg border border-border hover:bg-surface',
  ghost:     'bg-transparent text-fg-2 hover:bg-surface-2',
  danger:    'bg-danger text-white hover:brightness-110',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1',
  md: 'h-8 px-3 text-sm gap-1.5',
  lg: 'h-10 px-4 text-sm gap-2',
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'secondary', size = 'md', leadingIcon, trailingIcon, fullWidth, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      {...rest}
      className={cx(
        'inline-flex items-center justify-center font-medium rounded-md',
        'transition-colors duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  ),
);
Button.displayName = 'Button';
