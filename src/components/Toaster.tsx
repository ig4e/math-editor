// Top-right toast stack. Each toast animates in via the @keyframes in
// index.css and auto-dismisses via useToastLifecycle (mounted in App).

import { useStore } from '../state/store';
import { cx } from '../utils/cx';
import { Icon, type IconName } from './Icons';
import type { ToastKind } from '../state/types';

const ICON: Record<ToastKind, IconName> = {
  info: 'info',
  success: 'check',
  warn: 'warn',
  error: 'warn',
};
const ICON_COLOR: Record<ToastKind, string> = {
  info:    'text-accent',
  success: 'text-success',
  warn:    'text-warning',
  error:   'text-danger',
};

export function Toaster() {
  const toasts  = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-[90px] right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === 'error' ? 'alert' : 'status'}
          className="pointer-events-auto inline-flex items-center gap-2.5
                     min-w-[220px] max-w-[360px] px-3 py-2.5
                     bg-surface border border-border rounded-[10px]
                     shadow-toast animate-toast-in"
        >
          <Icon name={ICON[t.kind]} className={cx('!w-4 !h-4', ICON_COLOR[t.kind])} />
          <span className="flex-1 text-[13px] text-fg">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
            className="inline-flex items-center justify-center w-[22px] h-[22px]
                       rounded text-fg-faint hover:bg-border-soft hover:text-fg"
          >
            <Icon name="close" className="!w-3 !h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
