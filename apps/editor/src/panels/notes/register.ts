import { lazyPanel } from '../../utils/lazy';
import { registerPanel } from '../../workspace/PanelRegistry';

registerPanel({
  id: 'notes',
  title: 'Notes',
  icon: 'note',
  component: lazyPanel(() => import('./NotesPanel')),
  defaultLocation: 'right',
  description: 'Free-form markdown.',
  stub: true,
});
