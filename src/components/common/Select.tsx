// Themed Radix Select. Public API: <Select value onValueChange items />
// — items are { value, label, description? }. Use this anywhere you'd
// reach for a native <select>.

import * as RS from '@radix-ui/react-select';
import { Icon } from '../Icons';
import { cx } from '../../utils/cx';

export interface SelectItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface Props {
  value?: string;
  onValueChange?(v: string): void;
  items: readonly SelectItem[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Accessible name when there's no visible label. */
  ariaLabel?: string;
}

export function Select({ value, onValueChange, items, placeholder, disabled, className, ariaLabel }: Props) {
  return (
    <RS.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RS.Trigger
        aria-label={ariaLabel}
        className={cx(
          'inline-flex items-center gap-2 h-8 px-2.5 text-sm rounded-md',
          'bg-surface text-fg border border-border',
          'data-[placeholder]:text-fg-faint',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-app',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          className,
        )}
      >
        <RS.Value placeholder={placeholder} />
        <RS.Icon className="text-fg-muted ml-auto">
          <Icon name="chevron-down" />
        </RS.Icon>
      </RS.Trigger>
      <RS.Portal>
        <RS.Content
          position="popper"
          sideOffset={4}
          className="z-[210] bg-surface border border-border rounded-md shadow-card overflow-hidden min-w-[180px]"
        >
          <RS.Viewport className="p-1">
            {items.map((it) => (
              <RS.Item
                key={it.value}
                value={it.value}
                disabled={it.disabled}
                className={cx(
                  'flex items-center gap-2 px-2 h-8 rounded-md text-sm text-fg',
                  'data-[highlighted]:bg-accent-bg data-[highlighted]:text-accent data-[highlighted]:outline-none',
                  'data-[state=checked]:font-medium',
                  'data-[disabled]:opacity-60 data-[disabled]:cursor-not-allowed',
                )}
              >
                <RS.ItemText>{it.label}</RS.ItemText>
                {it.description && (
                  <span className="text-xs text-fg-muted ml-auto">{it.description}</span>
                )}
              </RS.Item>
            ))}
          </RS.Viewport>
        </RS.Content>
      </RS.Portal>
    </RS.Root>
  );
}
