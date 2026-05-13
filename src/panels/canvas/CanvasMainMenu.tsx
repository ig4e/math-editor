// Math-specific items appended to Excalidraw's MainMenu. We don't replace
// Excalidraw's menu — we keep their LoadScene / Export / Help items and
// add ours alongside, plus surface Excalidraw's built-in Text-to-Diagram
// (Mermaid) trigger so users can generate diagrams from a prompt.

import { MainMenu, TTDDialogTrigger } from '@excalidraw/excalidraw';
import { useCommand } from '../../commands/useCommand';
import { Icon } from '../../components/Icons';

export function CanvasMainMenu() {
  const { runCommand } = useCommand();

  return (
    <MainMenu>
      <MainMenu.Item onSelect={() => void runCommand('file.newSheet')}>
        New sheet
      </MainMenu.Item>
      <MainMenu.Item onSelect={() => void runCommand('canvas.insertTemplate')}>
        Insert template…
      </MainMenu.Item>

      <MainMenu.Separator />

      <MainMenu.Item onSelect={() => void runCommand('view.open.solver')}>
        Open Solver
      </MainMenu.Item>
      <MainMenu.Item onSelect={() => void runCommand('view.open.variables')}>
        Open Variables
      </MainMenu.Item>
      <MainMenu.Item onSelect={() => void runCommand('view.open.graph2d')}>
        Open Graph 2D
      </MainMenu.Item>
      <MainMenu.Item onSelect={() => void runCommand('view.open.ai')}>
        Open AI chat
      </MainMenu.Item>

      <MainMenu.Separator />

      {/* Excalidraw's built-in Text-to-Diagram (Mermaid) generator.
          The trigger renders a labeled menu row; the dialog is mounted
          via <CanvasTTDDialog />. */}
      <TTDDialogTrigger icon={<Icon name="sparkles" />}>
        Generate diagram (Mermaid)
      </TTDDialogTrigger>

      <MainMenu.Separator />

      <MainMenu.DefaultItems.LoadScene />
      <MainMenu.DefaultItems.SaveAsImage />
      <MainMenu.DefaultItems.Export />

      <MainMenu.Separator />

      <MainMenu.Item onSelect={() => void runCommand('view.open.settings')}>
        Settings…
      </MainMenu.Item>
      <MainMenu.Item onSelect={() => void runCommand('help.keybindings')}>
        Keyboard shortcuts
      </MainMenu.Item>
      <MainMenu.Item onSelect={() => void runCommand('view.commandPalette')}>
        Command palette
      </MainMenu.Item>

      <MainMenu.Separator />

      <MainMenu.DefaultItems.ClearCanvas />
      <MainMenu.DefaultItems.Help />
    </MainMenu>
  );
}
