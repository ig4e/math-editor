// Color swatches that apply \textcolor on click + a highlight button that
// wraps the selection in \colorbox.

import { useStore } from '../../state/store';
import { PALETTE } from '../../utils/colors';
import { cx } from '../../utils/cx';
import { Icon } from '../Icons';
import { ToolGroup, ToolbarButton } from './ToolbarPrimitives';

interface Props {
  onColorPicked: (name: typeof PALETTE[number]['name']) => void;
  onHighlight: () => void;
}

export function ColorPalette({ onColorPicked, onHighlight }: Props) {
  const current = useStore((s) => s.colorName);
  return (
    <ToolGroup ariaLabel="Color">
      <div className="flex items-center gap-1 px-1">
        {PALETTE.map((c) => (
          <button
            key={c.name}
            title={c.label}
            aria-label={c.label}
            onClick={() => onColorPicked(c.name)}
            style={{ background: c.hex }}
            className={cx(
              'w-[22px] h-[22px] rounded-full border-2 border-surface',
              'outline-1 outline-border',
              current === c.name && 'outline-2 outline-fg',
            )}
          />
        ))}
      </div>
      <ToolbarButton onClick={onHighlight} title="Highlight selection">
        <Icon name="highlight" />
      </ToolbarButton>
    </ToolGroup>
  );
}
