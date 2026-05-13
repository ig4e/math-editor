// Dialog picker for math-diagram templates. The umbrella command
// canvas.insertTemplate opens it; on pick, we convert the skeleton to
// real Excalidraw elements and drop them onto the canvas.
//
// Templates are grouped by category. No thumbnails for now; the name +
// description carries the picker. Power users can also invoke the
// per-template commands canvas.template.<id> directly from cmdk.

import { useMemo, useState } from 'react';
import { convertToExcalidrawElements } from '@excalidraw/excalidraw';
import { Dialog, Card } from '../../components/common';
import { TEMPLATES, type TemplateCategory, type TemplateDef } from './templates';
import { injectShapes, getExcalidrawAPI } from './inject';
import { useStore } from '../../state/store';

const CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'numeracy', label: 'Numeracy' },
  { id: 'geometry', label: 'Geometry' },
  { id: 'sets', label: 'Sets' },
  { id: 'logic', label: 'Logic' },
  { id: 'ml', label: 'ML' },
];

let opener: ((open: boolean) => void) | null = null;
export function openTemplatePicker(): void { opener?.(true); }
export function closeTemplatePicker(): void { opener?.(false); }

export function TemplatePicker() {
  const [open, setOpen] = useState(false);
  opener = setOpen;
  const toast = useStore((s) => s.toast);

  const grouped = useMemo(() => {
    const map = new Map<TemplateCategory, TemplateDef[]>();
    for (const cat of CATEGORIES) map.set(cat.id, []);
    for (const t of TEMPLATES) map.get(t.category)!.push(t);
    return map;
  }, []);

  const onPick = (t: TemplateDef) => {
    const api = getExcalidrawAPI();
    if (!api) { toast('Canvas not ready', 'warn'); return; }
    const state = api.getAppState();
    const ox = (-state.scrollX + state.width / 2) / state.zoom.value - 100;
    const oy = (-state.scrollY + state.height / 2) / state.zoom.value - 80;
    const skeleton = t.build({ x: ox, y: oy });
    const elements = convertToExcalidrawElements(skeleton);
    injectShapes(elements as never);
    setOpen(false);
    toast(`Inserted ${t.name}`, 'success');
  };

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Insert template"
      description="Drops a pre-built diagram onto the canvas as one undo step."
      widthClass="w-[min(640px,calc(100vw-32px))]"
    >
      <div className="flex flex-col gap-4">
        {CATEGORIES.map((cat) => {
          const items = grouped.get(cat.id) ?? [];
          if (items.length === 0) return null;
          return (
            <section key={cat.id} className="flex flex-col gap-2">
              <h3 className="text-xs uppercase tracking-wide text-fg-muted font-semibold">{cat.label}</h3>
              <div className="grid grid-cols-2 gap-2">
                {items.map((t) => (
                  <TemplateRow key={t.id} template={t} onPick={onPick} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Dialog>
  );
}

function TemplateRow({ template, onPick }: { template: TemplateDef; onPick(t: TemplateDef): void }) {
  return (
    <Card
      className="cursor-pointer hover:border-accent-border hover:bg-accent-bg/30 transition-colors"
      onClick={() => onPick(template)}
      title={undefined}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-fg">{template.name}</span>
        <span className="text-xs text-fg-muted leading-snug">{template.description}</span>
      </div>
    </Card>
  );
}
