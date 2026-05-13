// Layout settings. In v3 the workspace is a single Excalidraw canvas
// with one toggleable side panel — there's no multi-pane layout to
// save or restore. This section just exposes "close the side panel"
// for symmetry with the old "reset layout" affordance.

import { useStore } from '../../state/store';
import { Button, Card } from '../../components/common';

export function LayoutSection() {
  const reset = useStore((s) => s.resetLayout);

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <Card title="Workspace">
        <p className="text-sm text-fg-2 leading-relaxed">
          The app is one Excalidraw canvas with a slide-in side panel for
          tools. The toolbar's panel buttons toggle the side panel; ⌘ K
          opens any panel by name.
        </p>
      </Card>

      <Card title="Close side panel">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-fg-2">
            Closes the current panel and returns the canvas to its
            maximised state.
          </div>
          <Button variant="secondary" size="sm" onClick={reset}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
