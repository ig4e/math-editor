// The header strip every panel renders at top. Title text on the left
// (with optional left-slot for an icon or breadcrumb), right-side
// action slot for IconButtons. Sizes match the flexlayout tab strip.
//
// Also exports the matching PanelRibbon (sub-toolbar) and PanelStatus
// (footer strip) so a panel's three-slot shell is one import.

import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icons';
import { cx } from '../../utils/cx';

interface HeaderProps {
  title: ReactNode;
  icon?: IconName;
  /** Optional breadcrumb above the title. */
  crumb?: ReactNode;
  /** Right-slot — typically a row of IconButton. */
  actions?: ReactNode;
  className?: string;
}

export function PanelHeader({ title, icon, crumb, actions, className }: HeaderProps) {
  return (
    <header
      className={cx(
        'flex items-center justify-between gap-2 h-10 px-3 shrink-0',
        'border-b border-border-soft bg-surface',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon && <Icon name={icon} className="text-fg-muted shrink-0" />}
        <div className="min-w-0">
          {crumb && (
            <div className="text-[10px] uppercase tracking-wide text-fg-muted leading-none truncate">
              {crumb}
            </div>
          )}
          <div className="text-sm font-semibold text-fg truncate">{title}</div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-0.5 shrink-0">{actions}</div>}
    </header>
  );
}

interface RibbonProps {
  children: ReactNode;
  className?: string;
}

export function PanelRibbon({ children, className }: RibbonProps) {
  return (
    <div
      className={cx(
        'flex items-center gap-1 px-2 h-9 shrink-0',
        'border-b border-border-soft bg-surface',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelStatus({ children, className }: RibbonProps) {
  return (
    <div
      className={cx(
        'flex items-center gap-2 px-3 h-7 shrink-0',
        'border-t border-border-soft bg-surface-2 text-xs text-fg-muted',
        className,
      )}
    >
      {children}
    </div>
  );
}
