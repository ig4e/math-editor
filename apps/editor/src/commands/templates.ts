// Commands for math-diagram templates. The umbrella command
// `canvas.insertTemplate` opens the TemplatePicker Dialog; individual
// commands `canvas.template.<id>` drop a specific template directly
// (so power users can type "insert venn 2" in the palette).

import { registerCommands, type Command } from './commands';
import { TEMPLATES } from '../panels/canvas/templates';

const commands: Command[] = [
  {
    id: 'canvas.insertTemplate',
    label: 'Insert template…',
    description: 'Pick a math diagram template (number line, unit circle, Venn, MLP, …) to drop on the canvas.',
    category: 'View',
    icon: 'sparkles',
    run: async () => {
      const { openTemplatePicker } = await import('../panels/canvas/TemplatePicker');
      openTemplatePicker();
    },
  },
  ...TEMPLATES.map((t): Command => ({
    id: `canvas.template.${t.id}`,
    label: `Insert ${t.name}`,
    description: t.description,
    category: 'View',
    icon: 'sparkles',
    run: async (ctx) => {
      const { convertToExcalidrawElements } = await import('@excalidraw/excalidraw');
      const { injectShapes, getExcalidrawAPI } = await import('../panels/canvas/inject');
      const api = getExcalidrawAPI();
      if (!api) { ctx.getState().toast('Canvas not ready', 'warn'); return; }
      const state = api.getAppState();
      const ox = (-state.scrollX + state.width / 2) / state.zoom.value - 100;
      const oy = (-state.scrollY + state.height / 2) / state.zoom.value - 80;
      const elements = convertToExcalidrawElements(t.build({ x: ox, y: oy }));
      injectShapes(elements as never);
      ctx.getState().toast(`Inserted ${t.name}`, 'success');
    },
  })),
];

export function registerTemplateCommands(): void {
  registerCommands(commands);
}
