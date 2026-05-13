// Default workspace layout. Phase 1 ships a minimal version — Canvas
// center, an empty right column with Solver / Variables / Graph tabs as
// stub placeholders. Phase 2+ fill in the panels.
//
// The shape follows flexlayout's IJsonModel; we keep `component` strings
// matching the panel IDs in PanelRegistry. Bumping the layout shape
// (adding/renaming panels) means bumping WORKSPACE_LAYOUT_VERSION in
// state/slices/workspace.ts so existing persisted layouts are reset.

import type { IJsonModel } from 'flexlayout-react';

export const defaultLayout: IJsonModel = {
  global: {
    tabEnableClose: true,
    tabEnableRename: false,
    tabSetMinHeight: 0,
    tabSetMinWidth: 0,
  },
  borders: [],
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'tabset',
        weight: 65,
        children: [
          {
            type: 'tab',
            name: 'Canvas',
            component: 'canvas',
            enableClose: false,
            enableRename: false,
          },
        ],
      },
      {
        type: 'tabset',
        weight: 35,
        children: [
          { type: 'tab', name: 'Solver', component: 'solver' },
          { type: 'tab', name: 'Variables', component: 'variables' },
          { type: 'tab', name: 'Graph', component: 'graph2d' },
        ],
      },
    ],
  },
};
