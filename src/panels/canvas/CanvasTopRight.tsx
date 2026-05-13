// The right-hand chip cluster that Excalidraw mounts via renderTopRightUI.
// Sits beside the (collab / live-collab) area in stock Excalidraw — we
// repurpose it for "add math block" / "add text block". The app is
// dark-only so there's no theme toggle anymore.
//
// Visual style intentionally mirrors Excalidraw's own pill-style buttons
// so the addition reads as part of the same chrome.

import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useStore } from '../../state/store';
import { Tooltip } from '../../components/common/Tooltip';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';

interface Props {
  apiRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
}

export function CanvasTopRight({ apiRef }: Props) {
  const addMathBlock = useStore((s) => s.addMathBlock);
  const addTextBlock = useStore((s) => s.addTextBlock);

  const placeMathBlock = () => {
    const api = apiRef.current;
    if (!api) return;
    const state = api.getAppState();
    const x = (-state.scrollX + state.width / 2) / state.zoom.value - 110;
    const y = (-state.scrollY + state.height / 2) / state.zoom.value - 28;
    addMathBlock({ x, y });
  };

  const placeTextBlock = () => {
    const api = apiRef.current;
    if (!api) return;
    const state = api.getAppState();
    const x = (-state.scrollX + state.width / 2) / state.zoom.value - 110;
    const y = (-state.scrollY + state.height / 2) / state.zoom.value - 28;
    addTextBlock({ x, y });
  };

  return (
    <div className="flex items-center gap-1">
      <PillButton label="Add math block (E)" onClick={placeMathBlock}>
        <Icon name="fx" /> <span>Math</span>
      </PillButton>
      <PillButton label="Add text block (T)" onClick={placeTextBlock}>
        <Icon name="text" /> <span>Text</span>
      </PillButton>
    </div>
  );
}

function PillButton({
  label, onClick, children,
}: { label: string; onClick(): void; children: React.ReactNode }) {
  return (
    <Tooltip label={label}>
      {/* eslint-disable-next-line no-restricted-syntax -- bespoke pill chrome matched to Excalidraw's renderTopRightUI slot */}
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cx(
          'inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-xs font-medium',
          'bg-surface text-fg border border-border hover:bg-surface-2',
          'transition-colors duration-150 ease-out',
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}
