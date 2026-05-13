// Reference panel — searchable formula sheet + constants. Each row has
// "Copy LaTeX" and "Insert as block" actions. Curriculum filter reads
// from prefsSlice.curriculum (P16 wires the rest).

import { useMemo, useState } from 'react';
import { useStore } from '../../state/store';
import {
  PanelHeader, PanelStatus, Input, Card, Button, Select,
} from '../../components/common';
import { Icon } from '../../components/Icons';
import { ReadOnlyMathField } from '../solver/ReadOnlyMathField';
import { FORMULAS, uniqueCategories, type Formula, type CurriculumTag } from './formulas';

export default function ReferencePanel() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const toast = useStore((s) => s.toast);
  const addMathBlock = useStore((s) => s.addMathBlock);
  const curriculum = useStore((s) => s.curriculum);

  const categories = uniqueCategories();
  const tag = mapCurriculumTag(curriculum);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FORMULAS.filter((f) => {
      if (category !== 'all' && f.category !== category) return false;
      if (tag && !f.curricula.includes(tag) && !f.curricula.includes('all')) return false;
      if (q && !`${f.label} ${f.category} ${f.latex}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, category, tag]);

  const copy = async (latex: string) => {
    try {
      await navigator.clipboard.writeText(latex);
      toast('LaTeX copied', 'success');
    } catch {
      toast('Copy failed', 'error');
    }
  };

  const insert = (f: Formula) => {
    addMathBlock({ x: 200, y: 200, latex: f.latex });
    toast(`Inserted: ${f.label}`, 'success');
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader title="Reference" icon="book" />
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border-soft bg-surface-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Search formulas…"
          className="flex-1"
        />
        <Select
          value={category}
          onValueChange={setCategory}
          items={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
          ariaLabel="Category"
          className="min-w-[140px]"
        />
      </div>
      <div className="flex-1 overflow-auto p-3 flex flex-col gap-2">
        {items.length === 0 ? (
          <div className="text-sm text-fg-muted text-center py-8">
            No matches. Try clearing the search or category filter.
          </div>
        ) : (
          items.map((f) => (
            <Card
              key={f.id}
              density="compact"
              title={f.label}
              titleActions={
                <>
                  <Button size="sm" variant="ghost" onClick={() => void copy(f.latex)}>
                    <Icon name="copy" /> LaTeX
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => insert(f)}>
                    <Icon name="plus" /> Insert
                  </Button>
                </>
              }
            >
              <ReadOnlyMathField latex={f.latex} />
              {f.description && (
                <div className="text-xs text-fg-muted mt-1">{f.description}</div>
              )}
              <div className="text-[10px] text-fg-faint mt-1">{f.category}</div>
            </Card>
          ))
        )}
      </div>
      <PanelStatus>
        <span>{items.length} of {FORMULAS.length} formulas</span>
        {curriculum !== 'none' && <span>· curriculum: <span className="text-fg">{curriculum}</span></span>}
      </PanelStatus>
    </div>
  );
}

function mapCurriculumTag(c: string): CurriculumTag | null {
  if (c.startsWith('ap-calc')) return 'ap-calc';
  if (c.startsWith('ib-')) return 'ib';
  if (c === 'a-level-further') return 'a-level';
  if (c === 'us-common-core-hs') return 'cc-hs';
  if (c === 'gre') return 'gre';
  return null;
}
