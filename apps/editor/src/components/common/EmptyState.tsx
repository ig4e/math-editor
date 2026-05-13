// First-paint of an empty panel. Renders a centered icon + title +
// short description + optional single CTA. Used by every panel before
// it has data — Phase 1 stub panels are nothing but EmptyStates.

import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icons';
import { Button } from './Button';
import { cx } from '../../utils/cx';

interface Props {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  /** Single primary call to action. */
  cta?: { label: string; onClick(): void; icon?: IconName };
  /** Optional secondary action. */
  secondary?: { label: string; onClick(): void };
  className?: string;
}

export function EmptyState({ icon, title, description, cta, secondary, className }: Props) {
  return (
    <div className={cx(
      'h-full w-full flex flex-col items-center justify-center text-center gap-3',
      'px-6 py-8 text-fg-muted',
      className,
    )}>
      {icon && (
        <div className="w-12 h-12 rounded-full bg-surface-2 inline-flex items-center justify-center">
          <Icon name={icon} className="w-6 h-6 text-fg-faint" />
        </div>
      )}
      <div className="text-sm font-semibold text-fg">{title}</div>
      {description && <div className="text-sm max-w-md text-fg-muted leading-relaxed">{description}</div>}
      {(cta || secondary) && (
        <div className="flex items-center gap-2 mt-1">
          {cta && (
            <Button
              variant="primary"
              size="md"
              onClick={cta.onClick}
              leadingIcon={cta.icon && <Icon name={cta.icon} />}
            >
              {cta.label}
            </Button>
          )}
          {secondary && (
            <Button variant="ghost" size="md" onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
