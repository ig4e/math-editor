// Promise-based confirm modal built on @radix-ui/react-dialog so we get
// proper focus trap, Esc, scroll-lock, click-outside, and ARIA for free.
// Public API stays the same:
//   const ok = await askConfirm({ title: 'Clear sheet?', destructive: true });

import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { cx } from '../utils/cx';

interface Request {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}
interface PendingRequest extends Request {
  resolve: (ok: boolean) => void;
}

// ----- imperative store: one in-flight dialog at a time -----
let pending: PendingRequest | null = null;
const listeners = new Set<(r: PendingRequest | null) => void>();
const notify = () => { for (const l of listeners) l(pending); };

export function askConfirm(req: Request): Promise<boolean> {
  return new Promise((resolve) => {
    if (pending) pending.resolve(false); // cancel any pending dialog
    pending = { ...req, resolve };
    notify();
  });
}

function dismiss(ok: boolean) {
  const cur = pending;
  pending = null;
  notify();
  cur?.resolve(ok);
}

// ----- component -----
export function ConfirmDialog() {
  const [req, setReq] = useState<PendingRequest | null>(pending);
  useEffect(() => {
    const l = (r: PendingRequest | null) => setReq(r);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const open = req !== null;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) dismiss(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]
                     data-[state=open]:animate-[toast-in_120ms_ease-out]"
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     z-[201] w-[min(420px,calc(100vw-32px))]
                     bg-surface border border-border rounded-xl shadow-toast
                     p-5 flex flex-col gap-3
                     data-[state=open]:animate-[toast-in_120ms_ease-out]"
          onEscapeKeyDown={() => dismiss(false)}
        >
          <Dialog.Title className="text-base font-semibold text-fg">
            {req?.title}
          </Dialog.Title>
          {req?.message && (
            <Dialog.Description className="text-sm text-fg-muted leading-relaxed">
              {req.message}
            </Dialog.Description>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => dismiss(false)}
              className="px-3 h-9 rounded-md text-sm text-fg-2 hover:bg-surface-2"
            >
              {req?.cancelLabel ?? 'Cancel'}
            </button>
            <button
              autoFocus
              onClick={() => dismiss(true)}
              className={cx(
                'px-3 h-9 rounded-md text-sm font-medium',
                req?.destructive
                  ? 'bg-danger text-white hover:brightness-110'
                  : 'bg-accent text-white hover:brightness-110',
              )}
            >
              {req?.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
