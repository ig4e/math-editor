import { useState, useRef, useEffect } from 'react';
import { useStore } from '../state/store';
import { Icon } from './Icons';

export function TabBar() {
  const sheets       = useStore((s) => s.sheets);
  const sheetOrder   = useStore((s) => s.sheetOrder);
  const activeId     = useStore((s) => s.activeSheetId);
  const setActive    = useStore((s) => s.setActiveSheet);
  const renameSheet  = useStore((s) => s.renameSheet);
  const addSheet     = useStore((s) => s.addSheet);
  const removeSheet  = useStore((s) => s.removeSheet);

  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="tabbar" role="tablist">
      {sheetOrder.map((id) => {
        const s = sheets[id];
        if (!s) return null;
        const isActive = id === activeId;
        return editingId === id ? (
          <TabRenamer
            key={id}
            name={s.name}
            onCommit={(name) => { renameSheet(id, name); setEditingId(null); }}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            className={`tab ${isActive ? 'tab--active' : ''}`}
            onClick={() => setActive(id)}
            onDoubleClick={() => setEditingId(id)}
            title="Click to switch, double-click to rename"
          >
            <span className="tab-name">{s.name}</span>
            {sheetOrder.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                className="tab-x"
                aria-label={`Close ${s.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${s.name}"?`)) removeSheet(id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Icon name="close" />
              </span>
            )}
          </button>
        );
      })}
      <button
        className="tab tab--add"
        onClick={addSheet}
        title="New sheet"
        aria-label="New sheet"
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}

function TabRenamer(props: {
  name: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  const [value, setValue] = useState(props.name);
  return (
    <input
      ref={ref}
      className="tab tab--editing"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') props.onCommit(value);
        else if (e.key === 'Escape') props.onCancel();
      }}
      onBlur={() => props.onCommit(value)}
    />
  );
}
