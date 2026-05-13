// Radix Switch, themed.

import * as RS from '@radix-ui/react-switch';
import { cx } from '../../utils/cx';

interface Props {
  checked?: boolean;
  onCheckedChange?(v: boolean): void;
  disabled?: boolean;
  id?: string;
  /** Accessible label when no <label htmlFor> is around. */
  ariaLabel?: string;
}

export function Switch({ checked, onCheckedChange, disabled, id, ariaLabel }: Props) {
  return (
    <RS.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cx(
        'inline-flex items-center w-9 h-5 rounded-full transition-colors duration-150 ease-out',
        'bg-border data-[state=checked]:bg-accent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app',
        'disabled:opacity-60 disabled:cursor-not-allowed',
      )}
    >
      <RS.Thumb
        className={cx(
          'block w-4 h-4 bg-surface rounded-full shadow-pill',
          'translate-x-0.5 data-[state=checked]:translate-x-[18px]',
          'transition-transform duration-150 ease-out',
        )}
      />
    </RS.Root>
  );
}
