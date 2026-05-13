import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'matrix',
  title: 'Matrix',
  icon: 'matrix',
  component: lazyPanel(() => import('./MatrixPanel')),
  defaultLocation: 'right',
  description: 'Symbolic linear algebra GUI.',
  stub: true,
});
