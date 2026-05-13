// Generic dialog wrapper around Radix. Use this for non-confirm dialogs;
// for the imperative confirm flow, keep using <ConfirmDialog> + askConfirm.

import * as RD from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Icon } from '../Icons';
import { cx } from '../../utils/cx';

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Footer slot — usually a row of Buttons. */
  footer?: ReactNode;
  /** Tailwind width class — defaults to 480 px. */
  widthClass?: string;
}

export function Dialog({ open, onOpenChange, title, description, children, footer, widthClass = 'w-[min(480px,calc(100vw-32px))]' }: Props) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]
                     data-[state=open]:animate-[toast-in_120ms_ease-out]"
        />
        <RD.Content
          className={cx(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201]',
            widthClass,
            'bg-surface border border-border rounded-xl shadow-toast',
            'flex flex-col max-h-[80vh]',
            'data-[state=open]:animate-[toast-in_120ms_ease-out]',
          )}
        >
          <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border-soft">
            <RD.Title className="text-base font-semibold text-fg">{title}</RD.Title>
            <RD.Close
              aria-label="Close dialog"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <Icon name="close" />
            </RD.Close>
          </header>
          {description && (
            <RD.Description className="px-5 pt-3 text-sm text-fg-muted leading-relaxed">
              {description}
            </RD.Description>
          )}
          <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="flex justify-end gap-2 px-5 py-3 border-t border-border-soft">
              {footer}
            </footer>
          )}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
