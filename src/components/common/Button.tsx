// The one Button in the app. Every other clickable that isn't a link
// uses this — raw <button> outside common/ is blocked by ESLint. The
// styling is deliberately a one-for-one match with Excalidraw's own
// `.ToolIcon` / `.dropdown-menu-item` chrome so panels feel like part
// of the canvas: same radius, same hover surface, same focus ring.
//
// For places that want literally Excalidraw's component (so e.g.
// keyboard nav behaves identically with their toolbar), import
// `XButton` from './excalidraw'.

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

// Excalidraw renders its buttons against #363541 surface-2 with hover
// brightening; we follow the same recipe via our tokens so dark mode
// stays consistent across the whole app.
const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-[#1a1a22] hover:brightness-110 disabled:brightness-100',
  secondary:
    'bg-surface-2 text-fg border border-border hover:bg-surface',
  ghost:
    'bg-transparent text-fg-2 hover:bg-surface-2 hover:text-fg',
  danger:
    'bg-danger text-white hover:brightness-110',
};

// Heights match Excalidraw's toolbar buttons (`min-height: 2rem;` ≈
// 32px). The `sm` flavour is 28px to match their dense dropdown rows.
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
        'inline-flex items-center justify-center font-medium rounded-lg',
        // 8px radius matches Excalidraw's `.ToolIcon` / `.App-toolbar` chrome.
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
