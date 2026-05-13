// The right-hand chip cluster that Excalidraw mounts via renderTopRightUI.
// Sits beside the (collab / live-collab) area in stock Excalidraw — we
// repurpose it for "add math block" / "add text block" / theme toggle.
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
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const addMathBlock = useStore((s) => s.addMathBlock);
  const addTextBlock = useStore((s) => s.addTextBlock);

  const placeMathBlock = () => {
    // Drop the block at the current Excalidraw viewport center. The math
    // overlay (P2c) reads x/y as scene coords and uses
    // sceneCoordsToViewportCoords to position the React element.
    const api = apiRef.current;
    if (!api) return;
    const state = api.getAppState();
    const x = (-state.scrollX + state.width / 2) / state.zoom.value;
    const y = (-state.scrollY + state.height / 2) / state.zoom.value;
    addMathBlock({ x, y });
  };

  const placeTextBlock = () => {
    const api = apiRef.current;
    if (!api) return;
    const state = api.getAppState();
    const x = (-state.scrollX + state.width / 2) / state.zoom.value;
    const y = (-state.scrollY + state.height / 2) / state.zoom.value;
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
      <Tooltip label="Toggle theme" shortcut="⌘ ⇧ T">
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cx(
            'inline-flex items-center justify-center w-8 h-8 rounded-md',
            'text-fg-2 hover:bg-surface-2',
            'transition-colors duration-150 ease-out',
          )}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>
      </Tooltip>
    </div>
  );
}

function PillButton({
  label, onClick, children,
}: { label: string; onClick(): void; children: React.ReactNode }) {
  return (
    <Tooltip label={label}>
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
