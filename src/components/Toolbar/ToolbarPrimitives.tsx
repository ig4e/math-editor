// Small reusable primitives shared by every toolbar group component.
// Keeps the visual rhythm consistent (32×30 buttons, identical hover/active
// states, etc.) without repeating utility soup at every call site.

import type { ReactNode, PointerEventHandler } from 'react';
import { cx } from '../../utils/cx';

export function ToolGroup({ children, ariaLabel }: { children: ReactNode; ariaLabel?: string }) {
  return (
    <div
      role={ariaLabel ? 'group' : undefined}
      aria-label={ariaLabel}
      className="flex items-center gap-0.5 px-1.5 py-0.5 border-r border-border-soft last:border-r-0 last:ml-auto"
    >
      {children}
    </div>
  );
}

interface ToolbarButtonProps {
  children: ReactNode;
  title?: string;
  ariaLabel?: string;
  ariaChecked?: boolean;
  role?: string;
  active?: boolean;
  accent?: boolean;
  onClick?: () => void;
  onPointerDown?: PointerEventHandler<HTMLButtonElement>;
  className?: string;
}

export function ToolbarButton({
  children, title, ariaLabel, ariaChecked, role,
  active, accent, onClick, onPointerDown, className,
}: ToolbarButtonProps) {
  return (
    <button
      title={title}
      aria-label={ariaLabel}
      aria-checked={ariaChecked}
      role={role}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={cx(
        'inline-flex items-center gap-1.5 h-[30px] px-2 rounded-md',
        'border border-transparent text-fg-2 transition',
        'hover:bg-surface-2 hover:text-fg',
        active && 'bg-accent-bg border-accent-border text-accent',
        accent && 'bg-accent border-accent text-white hover:brightness-110 hover:text-white',
        className,
      )}
    >
      {children}
    </button>
  );
}
