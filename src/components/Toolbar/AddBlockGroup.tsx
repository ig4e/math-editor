import { Icon } from '../Icons';
import { ToolGroup, ToolbarButton } from './ToolbarPrimitives';

interface Props {
  onAddMath: () => void;
  onAddText: () => void;
}

export function AddBlockGroup({ onAddMath, onAddText }: Props) {
  return (
    <ToolGroup>
      <ToolbarButton onClick={onAddMath} title="Add equation (E)">
        <Icon name="fx" /><span className="text-[13px]">Math</span>
      </ToolbarButton>
      <ToolbarButton onClick={onAddText} title="Add text (T)">
        <Icon name="text" /><span className="text-[13px]">Text</span>
      </ToolbarButton>
    </ToolGroup>
  );
}
