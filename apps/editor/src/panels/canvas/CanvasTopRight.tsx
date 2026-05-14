// Host buttons for "Add math block" / "Add text block". Rendered into
// the native shape toolbar via the <ToolbarExtras> tunnel so they sit
// alongside selection / rectangle / arrow / text / etc. with the same
// ToolButton chrome and the same keyboard-shortcut affordances.
//
// Nothing is mounted into renderTopRightUI any more — that slot is
// reserved for collaborator avatars + the library trigger.

import { ToolbarExtras, ToolButton } from '@excalidraw/excalidraw';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useStore } from '../../state/store';
import { Icon } from '../../components/Icons';

interface Props {
  apiRef: React.MutableRefObject<ExcalidrawImperativeAPI | null>;
}

export function CanvasTopRight({ apiRef }: Props) {
  const addMathBlock = useStore((s) => s.addMathBlock);
  const addTextBlock = useStore((s) => s.addTextBlock);

  const center = (): { x: number; y: number } | null => {
    const api = apiRef.current;
    if (!api) return null;
    const state = api.getAppState();
    return {
      x: (-state.scrollX + state.width / 2) / state.zoom.value - 110,
      y: (-state.scrollY + state.height / 2) / state.zoom.value - 28,
    };
  };

  return (
    <ToolbarExtras>
      <div className="App-toolbar__divider" />
      <ToolButton
        type="button"
        aria-label="Add math block"
        title="Add math block — E"
        keyBindingLabel="E"
        icon={<Icon name="fx" />}
        onClick={() => {
          const c = center();
          if (c) addMathBlock(c);
        }}
      />
      <ToolButton
        type="button"
        aria-label="Add text block"
        title="Add text block — T"
        keyBindingLabel="T"
        icon={<Icon name="text" />}
        onClick={() => {
          const c = center();
          if (c) addTextBlock(c);
        }}
      />
    </ToolbarExtras>
  );
}
