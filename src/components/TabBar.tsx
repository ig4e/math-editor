// Multi-sheet tab bar. Click to switch; double-click a tab to rename it;
// × removes (with confirm). The + at the end adds a fresh sheet.

import { useState, useRef, useEffect } from 'react';
import { useStore } from '../state/store';
import { cx } from '../utils/cx';
import { Icon } from './Icons';

export function TabBar() {
  const sheets      = useStore((s) => s.sheets);
  const sheetOrder  = useStore((s) => s.sheetOrder);
  const activeId    = useStore((s) => s.activeSheetId);
  const setActive   = useStore((s) => s.setActiveSheet);
  const renameSheet = useStore((s) => s.renameSheet);
  const addSheet    = useStore((s) => s.addSheet);
  const removeSheet = useStore((s) => s.removeSheet);

  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div
      role="tablist"
      className="fixed top-[44px] inset-x-0 z-[18] flex items-stretch gap-0.5
                 px-2 py-1 bg-app border-b border-border overflow-x-auto tabbar"
    >
      {sheetOrder.map((id) => {
        const sh = sheets[id];
        if (!sh) return null;
        const isActive = id === activeId;

        if (editingId === id) {
          return (
            <TabRenamer
              key={id}
              name={sh.name}
              onCommit={(n) => { renameSheet(id, n); setEditingId(null); }}
              onCancel={() => setEditingId(null)}
            />
          );
        }
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => setActive(id)}
            onDoubleClick={() => setEditingId(id)}
            title="Click to switch, double-click to rename"
            className={cx(
              'inline-flex items-center gap-2 h-[30px] pl-3 pr-2 max-w-[220px]',
              'rounded-t-lg whitespace-nowrap border transition-colors',
              isActive
                ? 'bg-surface border-border border-b-surface text-fg -mb-px'
                : 'border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg',
            )}
          >
            <span className="text-[13px] overflow-hidden text-ellipsis">{sh.name}</span>
            {sheetOrder.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                aria-label={`Close ${sh.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${sh.name}"?`)) removeSheet(id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center w-[18px] h-[18px]
                           rounded text-fg-faint hover:bg-border-soft hover:text-fg cursor-pointer"
              >
                <Icon name="close" className="!w-3 !h-3" />
              </span>
            )}
          </button>
        );
      })}
      <button
        onClick={addSheet}
        title="New sheet"
        aria-label="New sheet"
        className="inline-flex items-center px-2 h-[30px] rounded-t-lg
                   text-fg-muted hover:bg-surface-2 hover:text-fg"
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}

function TabRenamer(props: {
  name: string;
  onCommit: (n: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(props.name);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter')  props.onCommit(value);
        if (e.key === 'Escape') props.onCancel();
      }}
      onBlur={() => props.onCommit(value)}
      className="font-[inherit] text-[13px] w-[140px] h-[30px] px-2
                 rounded-md outline-none bg-surface text-fg
                 border border-accent-border"
    />
  );
}
