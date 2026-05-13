import { useZoom } from '../../state/selectors';
import { Icon } from '../Icons';
import { ToolGroup, ToolbarButton } from './ToolbarPrimitives';

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export function ZoomGroup({ onZoomIn, onZoomOut, onResetView }: Props) {
  const zoom = useZoom();
  return (
    <ToolGroup>
      <ToolbarButton onClick={onZoomOut} title="Zoom out (−)">
        <Icon name="zoom-out" />
      </ToolbarButton>
      <span className="min-w-[44px] text-center text-fg-muted tabular-nums text-xs">
        {Math.round(zoom * 100)}%
      </span>
      <ToolbarButton onClick={onZoomIn} title="Zoom in (+)">
        <Icon name="zoom-in" />
      </ToolbarButton>
      <ToolbarButton onClick={onResetView} title="Reset view (0)">
        <Icon name="home" />
      </ToolbarButton>
    </ToolGroup>
  );
}
