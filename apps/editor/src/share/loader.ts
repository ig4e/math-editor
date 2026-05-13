// On-boot share-link loader. If the URL hash carries an encoded share
// payload, decode + apply to the store. Workspaces prompt for confirm
// before replacing the user's existing sheets; sheets just append.

import { decodeHash, applyShare } from './url';
import { useStore } from '../state/store';
import { askConfirm } from '../components/ConfirmDialog';

let consumed = false;

export async function applyShareFromHash(): Promise<void> {
  if (consumed) return;
  if (typeof window === 'undefined') return;
  const hash = window.location.hash;
  if (!hash) return;

  const decoded = decodeHash(hash);
  if (!decoded) return;
  consumed = true;

  if (decoded.kind === 'workspace') {
    const ok = await askConfirm({
      title: 'Replace workspace with shared one?',
      message: `This shared link contains ${(decoded.payload as { sheetOrder: string[] }).sheetOrder.length} sheets and will replace your current workspace.`,
      destructive: true,
      confirmLabel: 'Replace',
    });
    if (!ok) {
      // Strip the hash so subsequent loads don't re-prompt.
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }
  }

  applyShare(decoded);
  useStore.getState().toast(
    decoded.kind === 'workspace' ? 'Workspace loaded from link' : 'Sheet loaded from link',
    'success',
  );
  // Clear the hash so refresh doesn't re-apply.
  window.history.replaceState(null, '', window.location.pathname);
}
