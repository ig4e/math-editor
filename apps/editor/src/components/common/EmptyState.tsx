// First-paint of an empty panel — centered icon + title + short
// description + optional single CTA. Styled with Excalidraw's chrome
// variables so it reads as part of the native sidebar tab content.

import type { ReactNode } from 'react';
import { FilledButton, Island } from '@excalidraw/excalidraw';
import { Icon, type IconName } from '../Icons';

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

const wrapperStyle: React.CSSProperties = {
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  gap: 12,
  padding: '32px 24px',
  color: 'var(--text-primary-color)',
};

export function EmptyState({ icon, title, description, cta, secondary, className }: Props) {
  return (
    <div className={className} style={wrapperStyle}>
      {icon && (
        <Island padding={2}>
          <div
            style={{
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7,
            }}
          >
            <Icon name={icon} />
          </div>
        </Island>
      )}
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      {description && (
        <div
          style={{
            fontSize: 13,
            maxWidth: 360,
            lineHeight: 1.5,
            opacity: 0.7,
          }}
        >
          {description}
        </div>
      )}
      {(cta || secondary) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 4,
          }}
        >
          {cta && (
            <FilledButton
              variant="filled"
              color="primary"
              size="medium"
              label={cta.label}
              icon={cta.icon ? <Icon name={cta.icon} /> : undefined}
              onClick={cta.onClick}
            />
          )}
          {secondary && (
            <FilledButton
              variant="outlined"
              color="muted"
              size="medium"
              label={secondary.label}
              onClick={secondary.onClick}
            />
          )}
        </div>
      )}
    </div>
  );
}
