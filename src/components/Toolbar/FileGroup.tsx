import { Icon } from '../Icons';
import { ToolGroup, ToolbarButton } from './ToolbarPrimitives';

interface Props {
  onSave: () => void;
  onOpen: () => void;
  onPNG: () => void;
  onClear: () => void;
}

export function FileGroup({ onSave, onOpen, onPNG, onClear }: Props) {
  return (
    <ToolGroup>
      <ToolbarButton onClick={onSave}  title="Download workspace as .mathsheet">
        <Icon name="download" />
      </ToolbarButton>
      <ToolbarButton onClick={onOpen}  title="Open .mathsheet file">
        <Icon name="folder" />
      </ToolbarButton>
      <ToolbarButton onClick={onPNG}   title="Export current sheet as PNG">
        <Icon name="image" />
      </ToolbarButton>
      <ToolbarButton onClick={onClear} title="Clear sheet">
        <Icon name="trash" />
      </ToolbarButton>
    </ToolGroup>
  );
}
