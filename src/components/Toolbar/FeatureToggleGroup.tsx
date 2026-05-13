// Toggleable features: auto-shape recognition + step-by-step solve output.
// Distinct from "tool" because they apply orthogonally to whatever tool
// is currently active.

import { useStore } from '../../state/store';
import { Icon } from '../Icons';
import { ToolGroup, ToolbarButton } from './ToolbarPrimitives';

export function FeatureToggleGroup() {
  const autoShape    = useStore((s) => s.autoShape);
  const showSteps    = useStore((s) => s.showSteps);
  const setAutoShape = useStore((s) => s.setAutoShape);
  const setShowSteps = useStore((s) => s.setShowSteps);
  return (
    <ToolGroup ariaLabel="Features">
      <ToolbarButton
        active={autoShape}
        onClick={() => setAutoShape(!autoShape)}
        title={autoShape
          ? 'Auto-shape ON — sketched shapes get cleaned up'
          : 'Auto-shape OFF — pen strokes stay freehand'}
      >
        <Icon name="wand" />
      </ToolbarButton>
      <ToolbarButton
        active={showSteps}
        onClick={() => setShowSteps(!showSteps)}
        title={showSteps
          ? 'Show steps ON — solver emits intermediate steps'
          : 'Show steps OFF — solver gives final answer only'}
      >
        <Icon name="steps" />
      </ToolbarButton>
    </ToolGroup>
  );
}
