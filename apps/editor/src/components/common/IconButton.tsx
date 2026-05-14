// Square icon button + tooltip. Renders Excalidraw's exported
// `ToolButton` underneath so the chrome matches the native
// `.ToolIcon` exactly (same hover surface, same active accent, same
// disabled treatment). The Tooltip wrapper still surfaces the
// keyboard shortcut next to the label.

import { forwardRef } from 'react';
import { ToolButton } from '@excalidraw/excalidraw';
import { Icon, type IconName } from '../Icons';
import { Tooltip } from './Tooltip';

export type IconButtonSize = 'sm' | 'md' | 'lg';

interface Props {
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
  disabled?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
  'data-testid'?: string;
}

const SIZE_MAP: Record<IconButtonSize, 'small' | 'medium'> = {
  sm: 'small',
  md: 'medium',
  lg: 'medium',
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(
  ({ icon, label, shortcut, size = 'md', active, variant = 'default', className, ...rest }, ref) => {
    return (
      <Tooltip label={label} shortcut={shortcut}>
        <ToolButton
          ref={ref}
          type="button"
          icon={<Icon name={icon} />}
          aria-label={label}
          title={label}
          selected={active}
          size={SIZE_MAP[size]}
          className={className}
          style={
            variant === 'danger'
              ? { color: 'var(--color-danger, #db4f3d)' }
              : undefined
          }
          {...rest}
        />
      </Tooltip>
    );
  },
);
IconButton.displayName = 'IconButton';
