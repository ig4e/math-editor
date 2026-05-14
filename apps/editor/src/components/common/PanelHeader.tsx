// Panel chrome — header / ribbon / status — styled to match the
// Excalidraw sidebar tab content (sidebar__header typography, sidebar
// border colors, lg-button-size heights). No Tailwind theme tokens are
// used here so every panel inherits the Excalidraw chrome by default;
// override at the call site only when a panel genuinely needs more.

import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icons';

interface HeaderProps {
  title: ReactNode;
  icon?: IconName;
  /** Optional breadcrumb above the title. */
  crumb?: ReactNode;
  /** Right-slot — typically a row of IconButton or ButtonIcon. */
  actions?: ReactNode;
  className?: string;
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '6px 0.75rem',
  minHeight: 'var(--lg-button-size)',
  flexShrink: 0,
  borderBottom: '1px solid var(--sidebar-border-color)',
  background: 'transparent',
};

export function PanelHeader({ title, icon, crumb, actions, className }: HeaderProps) {
  return (
    <header className={className} style={headerStyle} data-testid="panel-header">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
        }}
      >
        {icon && (
          <Icon
            name={icon}
            className="shrink-0"
            style={{ color: 'var(--icon-fill-color)', opacity: 0.85 }}
          />
        )}
        <div style={{ minWidth: 0 }}>
          {crumb && (
            <div
              style={{
                fontSize: 10,
                lineHeight: 1,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                opacity: 0.65,
                color: 'var(--text-primary-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {crumb}
            </div>
          )}
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary-color)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        </div>
      </div>
      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexShrink: 0,
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
}

interface RibbonProps {
  children: ReactNode;
  className?: string;
}

const ribbonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  minHeight: 36,
  flexShrink: 0,
  borderBottom: '1px solid var(--sidebar-border-color)',
  background: 'transparent',
};

export function PanelRibbon({ children, className }: RibbonProps) {
  return (
    <div className={className} style={ribbonStyle}>
      {children}
    </div>
  );
}

const statusStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 0.75rem',
  height: 28,
  flexShrink: 0,
  borderTop: '1px solid var(--sidebar-border-color)',
  fontSize: 12,
  color: 'var(--text-primary-color)',
  opacity: 0.7,
};

export function PanelStatus({ children, className }: RibbonProps) {
  return (
    <div className={className} style={statusStyle}>
      {children}
    </div>
  );
}
