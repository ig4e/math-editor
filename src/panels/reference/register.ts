import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'reference',
  title: 'Reference',
  icon: 'book',
  component: lazyPanel(() => import('./ReferencePanel')),
  defaultLocation: 'right',
  description: 'Formulas, constants, identities.',
  stub: true,
});
