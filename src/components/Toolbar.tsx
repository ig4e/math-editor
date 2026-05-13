import { useStore } from '../state/store';
import { Icon } from './Icons';
import type { ColorName, Tool } from '../state/types';

// xcolor names — what MathLive understands inside \textcolor / \colorbox
const COLORS: { name: ColorName; hex: string; label: string }[] = [
  { name: 'black',  hex: '#111111', label: 'Black'  },
  { name: 'red',    hex: '#e11d48', label: 'Red'    },
  { name: 'blue',   hex: '#2563eb', label: 'Blue'   },
  { name: 'green',  hex: '#16a34a', label: 'Green'  },
  { name: 'orange', hex: '#ca8a04', label: 'Orange' },
  { name: 'purple', hex: '#9333ea', label: 'Purple' },
];

interface ToolbarProps {
  onAddMath: () => void;
  onAddText: () => void;
  onHighlight: () => void;
  onColorPicked: (name: ColorName) => void;
  onSolve: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onSave: () => void;
  onOpen: () => void;
  onPNG: () => void;
  onClear: () => void;
  onHelp: () => void;
}

export function Toolbar(p: ToolbarProps) {
  const tool          = useStore((s) => s.tool);
  const setTool       = useStore((s) => s.setTool);
  const colorName     = useStore((s) => s.colorName);
  const theme         = useStore((s) => s.theme);
  const setTheme      = useStore((s) => s.setTheme);
  const zoom          = useStore((s) => s.sheets[s.activeSheetId]?.view.zoom ?? 1);
  const selectedIds   = useStore((s) => s.selectedIds);
  const blocks        = useStore((s) => s.sheets[s.activeSheetId]?.blocks ?? []);

  const selectedMathCount = selectedIds.filter((id) =>
    blocks.find((b) => b.id === id && b.type === 'math'),
  ).length;
  const solveLabel = selectedMathCount >= 2
    ? `Solve system (${selectedMathCount})`
    : 'Solve';

  // Prevent toolbar buttons from stealing focus from the active math-field —
  // we need the field's selection intact for color/highlight/evaluate.
  const keepFocus = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) e.preventDefault();
  };

  return (
    <header className="toolbar" onPointerDown={keepFocus}>
      <div className="group">
        <button onClick={p.onAddMath} title="Add equation (E)">
          <Icon name="fx" /><span>Math</span>
        </button>
        <button onClick={p.onAddText} title="Add text (T)">
          <Icon name="text" /><span>Text</span>
        </button>
      </div>

      <div className="group" role="radiogroup" aria-label="Tool">
        <ToolBtn current={tool} value="move"   onClick={setTool} icon="cursor" title="Move / select (V)" />
        <ToolBtn current={tool} value="pen"    onClick={setTool} icon="pen"    title="Pen (P)" />
        <ToolBtn current={tool} value="eraser" onClick={setTool} icon="eraser" title="Eraser (X)" />
      </div>

      <div className="group">
        <button
          onClick={p.onSolve}
          title="Evaluate / solve (Ctrl+Enter in a math field)"
          className={selectedMathCount >= 2 ? 'btn-accent' : ''}
        >
          <Icon name="eval" /><span>{solveLabel}</span>
        </button>
      </div>

      <div className="group palette" aria-label="Color">
        {COLORS.map((c) => (
          <button
            key={c.name}
            className={`swatch ${colorName === c.name ? 'active' : ''}`}
            style={{ ['--c' as string]: c.hex }}
            onClick={() => p.onColorPicked(c.name)}
            title={c.label}
            aria-label={c.label}
          />
        ))}
        <button onClick={p.onHighlight} title="Highlight selection">
          <Icon name="highlight" />
        </button>
      </div>

      <div className="group">
        <button onClick={p.onZoomOut} title="Zoom out (−)"><Icon name="zoom-out" /></button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <button onClick={p.onZoomIn} title="Zoom in (+)"><Icon name="zoom-in" /></button>
        <button onClick={p.onResetView} title="Reset view (0)"><Icon name="home" /></button>
      </div>

      <div className="group">
        <button onClick={p.onSave}  title="Download workspace"><Icon name="download" /></button>
        <button onClick={p.onOpen}  title="Open .mathsheet file"><Icon name="folder" /></button>
        <button onClick={p.onPNG}   title="Export current sheet as PNG"><Icon name="image" /></button>
        <button onClick={p.onClear} title="Clear sheet"><Icon name="trash" /></button>
      </div>

      <div className="group">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          title={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-label="Toggle theme"
        >
          <Icon name={theme === 'light' ? 'moon' : 'sun'} />
        </button>
        <button onClick={p.onHelp} title="Shortcuts (?)" aria-label="Help">
          <Icon name="help" />
        </button>
      </div>
    </header>
  );
}

function ToolBtn(props: {
  current: Tool;
  value: Tool;
  onClick: (t: Tool) => void;
  icon: 'cursor' | 'pen' | 'eraser';
  title: string;
}) {
  return (
    <button
      role="radio"
      aria-checked={props.current === props.value}
      className={`tool ${props.current === props.value ? 'active' : ''}`}
      onClick={() => props.onClick(props.value)}
      title={props.title}
    >
      <Icon name={props.icon} />
    </button>
  );
}
