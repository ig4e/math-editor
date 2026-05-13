// Smart Solve button. Label and accent state change to "Solve system (n)"
// when 2+ math blocks are multi-selected.

import { useSelectedMathBlocks } from '../../state/selectors';
import { Icon } from '../Icons';
import { ToolGroup, ToolbarButton } from './ToolbarPrimitives';

interface Props {
  onSolve: () => void;
}

export function SolveButton({ onSolve }: Props) {
  const selectedMath = useSelectedMathBlocks();
  const isSystem = selectedMath.length >= 2;
  const label = isSystem ? `Solve system (${selectedMath.length})` : 'Solve';

  return (
    <ToolGroup>
      <ToolbarButton
        onClick={onSolve}
        accent={isSystem}
        title="Evaluate / solve (Ctrl+Enter inside a math field)"
      >
        <Icon name="eval" />
        <span className="text-[13px]">{label}</span>
      </ToolbarButton>
    </ToolGroup>
  );
}
