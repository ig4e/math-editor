import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'settings',
  title: 'Settings',
  icon: 'settings',
  component: lazyPanel(() => import('./SettingsPanel')),
  defaultLocation: 'center',
  description: 'Appearance, keybinds, layout, AI keys, curriculum.',
});
