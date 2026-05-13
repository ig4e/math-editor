// In-panel banner — info / warn / error / success. Used INSTEAD of a
// toast for panel-local conditions (a panel-local error is a banner;
// a transient app-level event is a toast).

import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icons';
import { cx } from '../../utils/cx';

export type BannerKind = 'info' | 'warn' | 'error' | 'success';

interface Props {
  kind: BannerKind;
  title?: ReactNode;
  children?: ReactNode;
  /** Trailing actions — typically a Button or two. */
  actions?: ReactNode;
  /** Dismissible — shows a close button that calls onDismiss. */
  onDismiss?(): void;
  className?: string;
}

const KIND_ICON: Record<BannerKind, IconName> = {
  info: 'info',
  warn: 'warn',
  error: 'warn',
  success: 'check',
};

const KIND_CLASS: Record<BannerKind, string> = {
  info:    'bg-accent-bg border-accent-border text-accent',
  warn:    'bg-warning/10 border-warning/30 text-warning',
  error:   'bg-danger/10 border-danger/30 text-danger',
  success: 'bg-success/10 border-success/30 text-success',
};

export function Banner({ kind, title, children, actions, onDismiss, className }: Props) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex items-start gap-2 px-3 py-2.5 rounded-md border text-sm',
        KIND_CLASS[kind],
        className,
      )}
    >
      <Icon name={KIND_ICON[kind]} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {title && <div className="font-medium leading-tight">{title}</div>}
        {children && <div className={cx('text-fg-2 leading-relaxed', title && 'mt-0.5')}>{children}</div>}
      </div>
      {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="w-6 h-6 inline-flex items-center justify-center rounded-md text-current hover:bg-black/5"
        >
          <Icon name="close" className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
