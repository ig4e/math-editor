// App root — composes the workspace shell, the command palette, the
// global overlays (toaster + confirm dialog), and the icon sprite.
//
// The legacy single-Whiteboard composition (Toolbar / TabBar / Whiteboard /
// SelectionHint / VariablesPanel) is gone in this file as of P1d. Its
// supporting files (Toolbar/*, Whiteboard.tsx, MarksLayer.tsx, hooks/use
// PenTool / useEraserTool / etc.) are kept around but unreferenced — Phase
// 2 deletes them when Excalidraw takes over the canvas panel.

import { useEffect } from 'react';

// Side-effect imports — these register the panels + bootstrap commands.
// Panels MUST register before commands (bootstrap dynamically emits
// "Open <Panel>" commands).
import './panels';
import './commands';

import { Workspace }       from './workspace/Workspace';
import { CommandPalette }  from './commands/CommandPalette';
import { useKeybinds }     from './keybinds/useKeybinds';
import { Toaster }         from './components/Toaster';
import { ConfirmDialog }   from './components/ConfirmDialog';
import { IconSprite }      from './components/Icons';
import { TooltipProvider } from './components/common';
import { Tour }            from './onboarding/Tour';
import { seedWelcomeIfFresh } from './onboarding/welcome';

import { useStore } from './state/store';
import { useThemeSync }      from './hooks/useThemeSync';
import { useToastLifecycle } from './hooks/useToastLifecycle';
import { applyShareFromHash } from './share/loader';

export default function App() {
  useThemeSync();
  useToastLifecycle();
  useKeybinds();

  // Reflect the prefs fontScale onto the root, so MathLive + chrome
  // resize together.
  const fontScale = useStore((s) => s.fontScale);
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale * 100}%`;
    return () => { document.documentElement.style.fontSize = ''; };
  }, [fontScale]);

  // On boot, if the URL hash carries a share payload, apply it.
  // Then, on a true first run, seed the welcome blocks.
  useEffect(() => {
    void (async () => {
      await applyShareFromHash();
      // Defer to next tick so persisted state has rehydrated.
      setTimeout(() => seedWelcomeIfFresh(), 200);
    })();
  }, []);

  // If the URL hash carries a room=<id>, join that collab session.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    void (async () => {
      const { readRoomFromHash, startCollab } = await import('./collab/session');
      const roomId = readRoomFromHash();
      if (!roomId) return;
      startCollab({
        roomId,
        user: {
          name: prompt(`Joining room ${roomId}. Your name?`) ?? 'Guest',
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 55%)`,
        },
      });
    })();
  }, []);

  return (
    <TooltipProvider delayDuration={350}>
      <IconSprite />
      <Workspace />
      <CommandPalette />
      <Toaster />
      <ConfirmDialog />
      <Tour />
    </TooltipProvider>
  );
}
