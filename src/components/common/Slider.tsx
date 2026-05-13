// Radix Slider, themed. Single-value only (no range) — the Variables
// panel sliders are the primary consumer.

import * as RS from '@radix-ui/react-slider';
import { cx } from '../../utils/cx';

interface Props {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?(v: number): void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Slider({
  value, min = 0, max = 1, step = 0.01,
  onValueChange, disabled, className, ariaLabel,
}: Props) {
  return (
    <RS.Root
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => v[0] !== undefined && onValueChange?.(v[0])}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cx(
        'relative flex items-center h-5 w-full select-none touch-none',
        'data-[disabled]:opacity-60',
        className,
      )}
    >
      <RS.Track className="bg-border h-1 grow rounded-full relative">
        <RS.Range className="absolute bg-accent h-full rounded-full" />
      </RS.Track>
      <RS.Thumb
        className={cx(
          'block w-4 h-4 bg-surface border-2 border-accent rounded-full shadow-pill',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app',
        )}
      />
    </RS.Root>
  );
}
