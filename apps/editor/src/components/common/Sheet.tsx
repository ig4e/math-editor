// Side-sheet (drawer) — Radix Dialog anchored to right or left edge.
// Used by Settings (right) and the AI side panel in tight layouts.

import * as RD from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { Icon } from '../Icons';
import { cx } from '../../utils/cx';

interface Props {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  side?: 'left' | 'right';
  children: ReactNode;
  widthClass?: string;
}

export function Sheet({ open, onOpenChange, title, side = 'right', children, widthClass = 'w-[min(480px,90vw)]' }: Props) {
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]" />
        <RD.Content
          className={cx(
            'fixed top-0 bottom-0 z-[201] flex flex-col bg-surface shadow-toast',
            'border-border',
            side === 'right'
              ? 'right-0 border-l data-[state=open]:animate-[slide-in-right_180ms_ease-out]'
              : 'left-0 border-r data-[state=open]:animate-[slide-in-left_180ms_ease-out]',
            widthClass,
          )}
        >
          <header className="flex items-center justify-between gap-3 px-4 h-12 border-b border-border-soft shrink-0">
            <RD.Title className="text-sm font-semibold text-fg">{title}</RD.Title>
            <RD.Close
              aria-label="Close panel"
              className="w-7 h-7 inline-flex items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
            >
              <Icon name="close" />
            </RD.Close>
          </header>
          <div className="flex-1 overflow-auto">{children}</div>
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}
