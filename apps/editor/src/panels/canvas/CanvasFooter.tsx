// Status strip rendered into the footer-left cluster — sits directly
// beside Excalidraw's zoom and undo/redo Islands so it lines up
// vertically as part of the same bottom row instead of floating in the
// page center. Uses Excalidraw's Island + Stack primitives so the
// chrome matches the native pills exactly.

import { FooterLeft, Island, Stack } from '@excalidraw/excalidraw';
import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import { Kbd } from '../../components/common/Kbd';
import { CollabStatus } from '../../collab/CollabStatus';

export function CanvasFooter() {
  const sheet = useActiveSheet();
  const provider = useStore((s) => s.defaultProvider);

  const blockCount = sheet?.blocks.length ?? 0;

  return (
    <FooterLeft>
      <Stack.Row gap={2} align="center">
        <Island padding={1}>
          <div
            className="status-strip"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              height: 'var(--lg-button-size)',
              padding: '0 0.625rem',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              color: 'var(--text-primary-color)',
            }}
          >
            <span>{blockCount} block{blockCount === 1 ? '' : 's'}</span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span>
              AI:{' '}
              <span style={{ color: 'var(--color-primary)' }}>
                {provider ?? 'none'}
              </span>
            </span>
            <span style={{ opacity: 0.35 }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Kbd combo="$mod+K" /> commands
            </span>
          </div>
        </Island>
        <CollabStatus />
      </Stack.Row>
    </FooterLeft>
  );
}
