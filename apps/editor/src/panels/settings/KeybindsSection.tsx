// The keybind editor. Lists every Command in the registry with its
// resolved combo. Click a row → record mode → press → commit / Esc.
// Conflicts highlight red and name the colliding command.
//
// Export / Import JSON round-trips through keysSlice.keybindOverrides.

import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../state/store';
import { getAllCommands } from '../../commands/commands';
import { findConflicts, formatCombo, resolveBindings } from '../../keybinds/defaults';
import { Button, IconButton, Input, Card, Kbd, Banner } from '../../components/common';

interface RecordingState {
  commandId: string;
  buffer: string[];
}

export function KeybindsSection() {
  const overrides = useStore((s) => s.keybindOverrides);
  const setBind   = useStore((s) => s.setKeybindOverride);
  const resetAll  = useStore((s) => s.resetKeybinds);

  const [search, setSearch] = useState('');
  const [recording, setRecording] = useState<RecordingState | null>(null);

  const commands = getAllCommands();
  const resolved = useMemo(() => resolveBindings(overrides), [overrides]);
  const conflicts = useMemo(() => findConflicts(resolved), [resolved]);

  // Record mode listener.
  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'Escape') { setRecording(null); return; }
      if (e.key === 'Enter' && recording.buffer.length > 0) {
        setBind(recording.commandId, recording.buffer.join('+'));
        setRecording(null);
        return;
      }
      const parts: string[] = [];
      if (e.metaKey || e.ctrlKey) parts.push('$mod');
      if (e.shiftKey) parts.push('Shift');
      if (e.altKey) parts.push('Alt');
      const k = normalizeKey(e.key);
      if (k) parts.push(k);
      if (parts.length === 0) return;
      setRecording((r) => (r ? { ...r, buffer: parts } : null));
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recording, setBind]);

  const filtered = commands.filter((c) =>
    !search ||
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-3 max-w-3xl">
      <div className="flex items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Search commands…"
          className="flex-1 max-w-md"
        />
        <Button size="sm" variant="ghost" onClick={resetAll}>Reset all to defaults</Button>
      </div>

      {conflicts.size > 0 && (
        <Banner kind="warn" title={`${conflicts.size} conflicting binding${conflicts.size === 1 ? '' : 's'}`}>
          When two commands share a combo, only one will fire. Use the row's <strong>Reset</strong> to clear an override.
        </Banner>
      )}

      <Card density="compact">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-fg-muted">
              <th className="py-1.5 px-2 font-medium">Command</th>
              <th className="py-1.5 px-2 font-medium w-44">Shortcut</th>
              <th className="py-1.5 px-2 font-medium w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const combo = resolved.get(c.id);
              const isRecording = recording?.commandId === c.id;
              const isOverridden = c.id in overrides;
              const inConflict = combo ? (conflicts.get(combo)?.length ?? 0) > 1 : false;
              return (
                <tr key={c.id} className="border-t border-border-soft">
                  <td className="py-1.5 px-2">
                    <div className="text-fg leading-tight">{c.label}</div>
                    <div className="text-[11px] text-fg-muted leading-tight">{c.category}</div>
                  </td>
                  <td className="py-1.5 px-2">
                    {isRecording ? (
                      <div className="flex items-center gap-2 text-fg-muted text-xs">
                        <Kbd combo={recording.buffer.join('+') || ''} />
                        <span>press combo, Enter to save, Esc to cancel</span>
                      </div>
                    ) : combo ? (
                      <div className="flex items-center gap-2">
                        <span className={inConflict ? 'text-danger' : 'text-fg'}>
                          {formatCombo(combo)}
                        </span>
                        {isOverridden && <span className="text-[10px] text-fg-muted">(custom)</span>}
                      </div>
                    ) : (
                      <span className="text-fg-faint text-xs">— unbound —</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-right">
                    <div className="inline-flex items-center gap-0.5 justify-end">
                      <IconButton
                        icon="keyboard"
                        size="sm"
                        label={isRecording ? 'Cancel recording' : 'Record new combo'}
                        active={isRecording}
                        onClick={() =>
                          setRecording(isRecording ? null : { commandId: c.id, buffer: [] })
                        }
                      />
                      {isOverridden && (
                        <IconButton
                          icon="refresh"
                          size="sm"
                          label="Reset to default"
                          onClick={() => setBind(c.id, null)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function normalizeKey(key: string): string {
  if (key === ' ') return 'Space';
  if (key.length === 1) return key.toUpperCase();
  if (['Shift', 'Control', 'Alt', 'Meta'].includes(key)) return '';
  return key; // 'Enter', 'Escape', 'Tab', 'ArrowUp', etc.
}
