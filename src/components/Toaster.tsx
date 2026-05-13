import { useStore } from '../state/store';
import { Icon, type IconName } from './Icons';
import type { ToastKind } from '../state/types';

const ICON: Record<ToastKind, IconName> = {
  info: 'info',
  success: 'check',
  warn: 'warn',
  error: 'warn',
};

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="toaster" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.kind}`}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          <Icon name={ICON[t.kind]} />
          <span className="toast-msg">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            <Icon name="close" />
          </button>
        </div>
      ))}
    </div>
  );
}
