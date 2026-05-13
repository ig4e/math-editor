import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'numerics',
  title: 'Numerics',
  icon: 'function',
  component: lazyPanel(() => import('./NumericsPanel')),
  defaultLocation: 'right',
  description: 'Numerical methods playground.',
  stub: true,
});
