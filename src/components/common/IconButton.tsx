// Square button + Radix Tooltip. The default chrome for panel headers
// and toolbars. Uses Icons.tsx names through a typed `icon` prop.

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icons';
import { Tooltip } from './Tooltip';
import { cx } from '../../utils/cx';

export type IconButtonSize = 'sm' | 'md' | 'lg';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  icon: IconName;
  /** Accessible label + tooltip text. */
  label: string;
  /** Optional shortcut shown in the tooltip. */
  shortcut?: string;
  size?: IconButtonSize;
  /** Highlight as the active tool / mode. */
  active?: boolean;
  /** Danger variant — used in destructive header actions. */
  variant?: 'default' | 'danger';
}

const SIZES: Record<IconButtonSize, string> = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ icon, label, shortcut, size = 'md', active, variant = 'default', className, ...rest }, ref) => (
    <Tooltip label={label} shortcut={shortcut}>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        {...rest}
        className={cx(
          'inline-flex items-center justify-center rounded-md',
          'transition-colors duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          variant === 'danger'
            ? 'text-danger hover:bg-danger/10'
            : active
              ? 'bg-accent-bg text-accent'
              : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
          SIZES[size],
          className,
        )}
      >
        <Icon name={icon} />
      </button>
    </Tooltip>
  ),
);
IconButton.displayName = 'IconButton';
