// The Settings panel. Tabs across the top: Appearance / Keybinds /
// Layout / API Keys / Curriculum / Storage / Privacy. Phase 1 wires
// up Appearance + Keybinds + Layout; the others are stubs filled in
// by later phases (P6 for keys, P16 for curriculum).
//
// We use horizontal tabs rather than the vertical variant because the
// panel mounts inside Excalidraw's right sidebar, which is ~300–440 px
// wide. A vertical 176 px tab rail leaves only a sliver for content.

import { PanelHeader, Tabs, EmptyState } from '../../components/common';
import type { TabItem } from '../../components/common';
import { AppearanceSection } from './AppearanceSection';
import { KeybindsSection } from './KeybindsSection';
import { LayoutSection } from './LayoutSection';
import { APIKeysSection } from './APIKeysSection';
import { CurriculumSection } from './CurriculumSection';

const ITEMS: readonly TabItem[] = [
  {
    value: 'appearance',
    label: 'Appearance',
    content: <Section title="Appearance"><AppearanceSection /></Section>,
  },
  {
    value: 'keybinds',
    label: 'Keybinds',
    content: <Section title="Keyboard shortcuts"><KeybindsSection /></Section>,
  },
  {
    value: 'layout',
    label: 'Layout',
    content: <Section title="Layout"><LayoutSection /></Section>,
  },
  {
    value: 'api-keys',
    label: 'API keys',
    content: <Section title="API keys (BYOK)"><APIKeysSection /></Section>,
  },
  {
    value: 'curriculum',
    label: 'Curriculum',
    content: <Section title="Curriculum"><CurriculumSection /></Section>,
  },
  {
    value: 'storage',
    label: 'Storage',
    content: (
      <Section title="Storage">
        <EmptyState
          icon="folder"
          title="Coming in Phase 8"
          description="Workspace size, export/import workspace as zip, clear all sheets."
        />
      </Section>
    ),
  },
  {
    value: 'privacy',
    label: 'Privacy',
    content: (
      <Section title="Privacy">
        <EmptyState
          icon="info"
          title="Local-only by default"
          description="Sheets live in your browser's IndexedDB. AI keys, when added, are encrypted at rest with WebCrypto. Nothing leaves this device unless you initiate share-link or AI calls."
        />
      </Section>
    ),
  },
];

export default function SettingsPanel() {
  // Open the section indicated by the URL hash, if any
  // (e.g. `#keybinds` deep-link from the command palette).
  const initial =
    typeof window !== 'undefined' && window.location.hash === '#keybinds'
      ? 'keybinds'
      : 'appearance';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        color: 'var(--text-primary-color)',
      }}
    >
      <PanelHeader title="Settings" icon="settings" />
      <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        <Tabs items={ITEMS} defaultValue={initial} orientation="horizontal" />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: 16,
        color: 'var(--text-primary-color)',
      }}
    >
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
          margin: '0 0 12px',
          color: 'var(--text-primary-color)',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
