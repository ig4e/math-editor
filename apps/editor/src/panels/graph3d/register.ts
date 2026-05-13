import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'graph3d',
  title: 'Graph 3D',
  icon: 'cube',
  component: lazyPanel(() => import('./Graph3DPanel')),
  defaultLocation: 'right',
  description: 'Surfaces, vector fields, parametric curves.',
  stub: true,
});
