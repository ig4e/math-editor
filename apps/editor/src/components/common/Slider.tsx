// Radix Slider styled to match Excalidraw's native range chrome —
// same `--color-slider-track` rail, `--color-primary` thumb. Single-
// value only (no range) — the Variables panel sliders are the primary
// consumer.

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
      <RS.Track
        style={{ background: 'var(--button-bg, var(--color-surface-low))' }}
        className="h-1 grow rounded-full relative"
      >
        <RS.Range
          style={{ background: 'var(--color-slider-track, var(--color-primary))' }}
          className="absolute h-full rounded-full"
        />
      </RS.Track>
      <RS.Thumb
        style={{
          background: 'var(--island-bg-color, #fff)',
          borderColor: 'var(--color-primary)',
        }}
        className={cx(
          'block w-4 h-4 border-2 rounded-full shadow-pill',
          'focus-visible:outline-none',
        )}
      />
    </RS.Root>
  );
}
