// Move / Pen / Eraser radio group.

import { useStore } from '../../state/store';
import type { Tool } from '../../state/types';
import { Icon } from '../Icons';
import { ToolGroup, ToolbarButton } from './ToolbarPrimitives';

const TOOLS: { value: Tool; icon: 'cursor' | 'pen' | 'eraser'; title: string }[] = [
  { value: 'move',   icon: 'cursor', title: 'Move / select (V)' },
  { value: 'pen',    icon: 'pen',    title: 'Pen (P)' },
  { value: 'eraser', icon: 'eraser', title: 'Eraser (X)' },
];

export function ToolGroupButtons() {
  const current = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  return (
    <ToolGroup ariaLabel="Tool">
      {TOOLS.map((t) => (
        <ToolbarButton
          key={t.value}
          role="radio"
          ariaChecked={current === t.value}
          active={current === t.value}
          title={t.title}
          onClick={() => setTool(t.value)}
        >
          <Icon name={t.icon} />
        </ToolbarButton>
      ))}
    </ToolGroup>
  );
}
