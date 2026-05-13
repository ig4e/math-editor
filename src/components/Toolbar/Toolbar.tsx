// Toolbar shell. Composes the group components and one cross-cutting
// behavior: prevent toolbar buttons from stealing focus from the active
// math-field (so selection-based actions like color/highlight work).

import type { ColorName } from '../../state/types';
import { AddBlockGroup }      from './AddBlockGroup';
import { ToolGroupButtons }   from './ToolGroupButtons';
import { FeatureToggleGroup } from './FeatureToggleGroup';
import { SolveButton }        from './SolveButton';
import { ColorPalette }       from './ColorPalette';
import { ZoomGroup }          from './ZoomGroup';
import { FileGroup }          from './FileGroup';
import { ThemeGroup }         from './ThemeGroup';

export interface ToolbarProps {
  onAddMath: () => void;
  onAddText: () => void;
  onHighlight: () => void;
  onColorPicked: (name: ColorName) => void;
  onSolve: () => void;
  onSimplify: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onSave: () => void;
  onOpen: () => void;
  onPNG: () => void;
  onClear: () => void;
  onHelp: () => void;
}

export function Toolbar(p: ToolbarProps) {
  // pointerdown-preventDefault keeps the math-field's selection intact —
  // otherwise the field blurs before color/highlight/evaluate can read it.
  const keepFocus = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) e.preventDefault();
  };

  return (
    <header
      onPointerDown={keepFocus}
      className="fixed top-0 inset-x-0 z-20 flex flex-wrap items-center gap-1.5
                 px-2.5 py-1.5 bg-surface-glass backdrop-blur-md
                 border-b border-border shadow-pill"
    >
      <AddBlockGroup onAddMath={p.onAddMath} onAddText={p.onAddText} />
      <ToolGroupButtons />
      <FeatureToggleGroup />
      <SolveButton onSolve={p.onSolve} onSimplify={p.onSimplify} />
      <ColorPalette onColorPicked={p.onColorPicked} onHighlight={p.onHighlight} />
      <ZoomGroup
        onZoomIn={p.onZoomIn}
        onZoomOut={p.onZoomOut}
        onResetView={p.onResetView}
      />
      <FileGroup
        onSave={p.onSave}
        onOpen={p.onOpen}
        onPNG={p.onPNG}
        onClear={p.onClear}
      />
      <ThemeGroup onHelp={p.onHelp} />
    </header>
  );
}
