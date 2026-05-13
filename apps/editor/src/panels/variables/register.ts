import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'variables',
  title: 'Variables',
  icon: 'tag',
  component: lazyPanel(() => import('./VariablesPanel')),
  defaultLocation: 'right',
  description: 'Detected definitions with live sliders.',
  stub: true,
});
