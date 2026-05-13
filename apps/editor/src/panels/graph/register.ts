import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'graph2d',
  title: 'Graph 2D',
  icon: 'graph',
  component: lazyPanel(() => import('./GraphPanel')),
  defaultLocation: 'right',
  description: 'Plot equations and watch sliders.',
  stub: true,
});
