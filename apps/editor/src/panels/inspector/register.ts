import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'inspector',
  title: 'Inspector',
  icon: 'search',
  component: lazyPanel(() => import('./InspectorPanel')),
  defaultLocation: 'right',
  description: 'Symbolic AST of the selected block.',
  stub: true,
});
