// Pass-through to Excalidraw's native Switch so panels share its
// chrome. The local component keeps the older
// `onCheckedChange` / `ariaLabel` API so call sites don't need to
// migrate in lockstep.

import { Switch as XSwitch } from '@excalidraw/excalidraw';

let switchAutoIdSeq = 0;

interface Props {
  checked?: boolean;
  onCheckedChange?(v: boolean): void;
  disabled?: boolean;
  id?: string;
  /** Accessible label when no <label htmlFor> is around. */
  ariaLabel?: string;
}

export function Switch({ checked = false, onCheckedChange, disabled, id, ariaLabel }: Props) {
  // Excalidraw's Switch requires a stable `name`; derive one from the
  // id prop or fall back to a per-instance counter.
  const name = id ?? `switch-${++switchAutoIdSeq}`;
  return (
    <XSwitch
      name={name}
      title={ariaLabel}
      checked={checked}
      onChange={onCheckedChange ?? (() => undefined)}
      disabled={disabled}
    />
  );
}
