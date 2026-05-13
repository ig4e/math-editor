// Cmd+K palette. Built on cmdk — same component family Linear, Vercel,
// and Raycast use. Lists every registered command, grouped by category,
// with fuzzy search and recently-used floated to top.
//
// Open/close state is held locally; binding to `$mod+K` is wired through
// a window-level keydown listener (not the keybind runtime, because the
// runtime resolves AFTER all panels register — and we want the palette
// to be openable even if the registry is half-built).

import { Command as Cmdk } from 'cmdk';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { getAllCommands, type Command } from './commands';
import { useCommand } from './useCommand';
import { Icon, type IconName } from '../components/Icons';
import { formatCombo } from '../keybinds/defaults';
import { useStore } from '../state/store';
import { cx } from '../utils/cx';

const RECENTS_KEY = 'math-notebook:cmdk-recent';
const RECENT_LIMIT = 8;

function loadRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function bumpRecent(id: string): void {
  const cur = loadRecents().filter((x) => x !== id);
  const next = [id, ...cur].slice(0, RECENT_LIMIT);
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { runCommand, buildContext } = useCommand();
  const overrides = useStore((s) => s.keybindOverrides);

  // Cmd+K toggles open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ctx = useMemo(buildContext, [buildContext, open]);

  const commands = useMemo(() => {
    const all = getAllCommands();
    return all.filter((c) => !c.when || c.when(ctx));
  }, [ctx, open]);

  const recents = useMemo(() => loadRecents(), [open]);

  const run = useCallback(
    (cmd: Command) => {
      bumpRecent(cmd.id);
      setOpen(false);
      void runCommand(cmd.id);
    },
    [runCommand],
  );

  const grouped = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    for (const c of commands) {
      const cat = c.category;
      (groups[cat] = groups[cat] ?? []).push(c);
    }
    return groups;
  }, [commands]);

  const recentCmds = useMemo(
    () => recents.map((id) => commands.find((c) => c.id === id)).filter((c): c is Command => !!c),
    [recents, commands],
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-[18%] -translate-x-1/2 z-[401]
                     w-[min(640px,calc(100vw-32px))] max-h-[60vh]
                     bg-surface border border-border rounded-xl shadow-toast
                     overflow-hidden flex flex-col"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <Cmdk
            value={undefined}
            shouldFilter
            label="Command palette"
            className="flex flex-col h-full"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border-soft">
              <Icon name="search" className="text-fg-muted" />
              <Cmdk.Input
                value={search}
                onValueChange={setSearch}
                autoFocus
                placeholder="Search commands…"
                className="flex-1 bg-transparent outline-none text-sm text-fg placeholder:text-fg-faint"
              />
              <kbd className="text-[10px] font-mono text-fg-faint border border-border-soft rounded px-1 py-0.5">
                Esc
              </kbd>
            </div>
            <Cmdk.List className="flex-1 overflow-auto p-1">
              <Cmdk.Empty className="px-3 py-6 text-sm text-fg-muted text-center">
                No commands match.
              </Cmdk.Empty>

              {recentCmds.length > 0 && !search && (
                <Cmdk.Group heading="Recent" className="cmdk-group">
                  {recentCmds.map((c) => (
                    <Row key={`recent:${c.id}`} cmd={c} overrides={overrides} onRun={() => run(c)} />
                  ))}
                </Cmdk.Group>
              )}

              {(Object.keys(grouped) as Array<keyof typeof grouped>).map((cat) => (
                <Cmdk.Group key={cat} heading={cat} className="cmdk-group">
                  {grouped[cat]!.map((c) => (
                    <Row key={c.id} cmd={c} overrides={overrides} onRun={() => run(c)} />
                  ))}
                </Cmdk.Group>
              ))}
            </Cmdk.List>
          </Cmdk>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface RowProps {
  cmd: Command;
  overrides: Record<string, string>;
  onRun(): void;
}

function Row({ cmd, overrides, onRun }: RowProps) {
  const combo = overrides[cmd.id] ?? cmd.defaultShortcut;
  return (
    <Cmdk.Item
      value={`${cmd.label} ${cmd.id} ${cmd.category}`}
      onSelect={onRun}
      className={cx(
        'flex items-center gap-2 px-3 h-9 rounded-md text-sm cursor-pointer',
        'aria-selected:bg-accent-bg aria-selected:text-accent',
        'data-[selected=true]:bg-accent-bg data-[selected=true]:text-accent',
      )}
    >
      {cmd.icon && <Icon name={cmd.icon as IconName} className="text-fg-muted" />}
      <span className="flex-1 text-fg">{cmd.label}</span>
      {combo && (
        <kbd className="text-[10px] font-mono text-fg-muted border border-border-soft rounded px-1.5 py-0.5">
          {formatCombo(combo)}
        </kbd>
      )}
    </Cmdk.Item>
  );
}
