// Excalidraw <WelcomeScreen> children — what an empty canvas shows. We
// keep Excalidraw's heading style but plug in our own copy + a couple of
// math-specific quickstart cards.

import { WelcomeScreen } from '@excalidraw/excalidraw';
import { useStore } from '../../state/store';

export function CanvasWelcome() {
  const addMathBlock = useStore((s) => s.addMathBlock);

  return (
    <WelcomeScreen>
      <WelcomeScreen.Hints.MenuHint />
      <WelcomeScreen.Hints.ToolbarHint />
      <WelcomeScreen.Hints.HelpHint />

      <WelcomeScreen.Center>
        <WelcomeScreen.Center.Logo />
        <WelcomeScreen.Center.Heading>
          Math Notebook
        </WelcomeScreen.Center.Heading>
        <WelcomeScreen.Center.Menu>
          <WelcomeScreen.Center.MenuItemLink
            href="https://github.com/excalidraw/excalidraw"
          >
            Built on Excalidraw
          </WelcomeScreen.Center.MenuItemLink>
          <WelcomeScreen.Center.MenuItem
            onSelect={() => addMathBlock({ x: 200, y: 200 })}
          >
            Add a math block
          </WelcomeScreen.Center.MenuItem>
          <WelcomeScreen.Center.MenuItem
            onSelect={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }));
              }
            }}
          >
            Open the command palette
          </WelcomeScreen.Center.MenuItem>
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
    </WelcomeScreen>
  );
}
