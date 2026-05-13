import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'mllab',
  title: 'ML Lab',
  icon: 'brain',
  component: lazyPanel(() => import('./MLLabPanel')),
  defaultLocation: 'right',
  description: 'Hands-on ML demos that compose every other panel.',
  stub: true,
});
