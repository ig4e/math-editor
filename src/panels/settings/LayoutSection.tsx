// Layout settings — preset picker + save / reset. Phase 1 ships with
// no built-in presets beyond "Default"; users can save custom ones.

import { useState } from 'react';
import { useStore } from '../../state/store';
import { Button, Card, Field, Input } from '../../components/common';
import { askConfirm } from '../../components/ConfirmDialog';

export function LayoutSection() {
  const presets = useStore((s) => s.presets);
  const active  = useStore((s) => s.activePresetId);
  const save    = useStore((s) => s.savePreset);
  const apply   = useStore((s) => s.applyPreset);
  const remove  = useStore((s) => s.deletePreset);
  const reset   = useStore((s) => s.resetLayout);

  const [draftName, setDraftName] = useState('');

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <Card title="Save current layout">
        <Field label="Preset name" inline>
          {(id) => (
            <div className="flex items-center gap-2 flex-1">
              <Input
                id={id}
                value={draftName}
                onChange={(e) => setDraftName(e.currentTarget.value)}
                placeholder="My layout"
                className="flex-1"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={!draftName.trim()}
                onClick={() => {
                  save(draftName.trim());
                  setDraftName('');
                }}
              >
                Save
              </Button>
            </div>
          )}
        </Field>
      </Card>

      <Card title="Saved presets">
        {Object.keys(presets).length === 0 ? (
          <div className="text-sm text-fg-muted">None yet — save the current layout above.</div>
        ) : (
          <ul className="flex flex-col gap-1">
            {Object.keys(presets).map((name) => (
              <li key={name} className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-surface-2">
                <span className="text-sm text-fg flex-1">{name}</span>
                {active === name && <span className="text-[10px] text-accent">active</span>}
                <Button size="sm" variant="ghost" onClick={() => apply(name)}>Apply</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (await askConfirm({ title: `Delete preset "${name}"?`, destructive: true })) {
                      remove(name);
                    }
                  }}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Reset" tone="warn">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-fg-2">Discard all panel positions and return to the default layout.</div>
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              if (await askConfirm({ title: 'Reset workspace layout?', destructive: true })) {
                reset();
              }
            }}
          >
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
