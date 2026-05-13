// Curriculum picker. Sets prefsSlice.curriculum which the Reference
// panel and AI system prompt both consume.

import { useStore } from '../../state/store';
import { Field, Card, Select, Input } from '../../components/common';
import type { Curriculum } from '../../state/types';

const ITEMS: { value: Curriculum; label: string; description: string }[] = [
  { value: 'none', label: 'No curriculum', description: 'Generic math notation' },
  { value: 'ap-calc-ab', label: 'AP Calculus AB', description: 'US Advanced Placement, Calc AB' },
  { value: 'ap-calc-bc', label: 'AP Calculus BC', description: 'US Advanced Placement, Calc BC' },
  { value: 'ib-math-sl', label: 'IB Math SL', description: 'IB Standard Level' },
  { value: 'ib-math-hl', label: 'IB Math HL', description: 'IB Higher Level (Analysis & Approaches)' },
  { value: 'a-level-further', label: 'A-Level Further Maths', description: 'UK A-Level Further Mathematics' },
  { value: 'us-common-core-hs', label: 'US Common Core HS', description: 'High school Common Core' },
  { value: 'gre', label: 'GRE Math', description: 'GRE quantitative section' },
  { value: 'custom', label: 'Custom', description: 'Free-form name' },
];

export function CurriculumSection() {
  const curriculum = useStore((s) => s.curriculum);
  const setCurriculum = useStore((s) => s.setCurriculum);
  const custom = useStore((s) => s.curriculumCustom);

  return (
    <div className="flex flex-col gap-4 max-w-xl">
      <Card title="Curriculum">
        <p className="text-sm text-fg-2 mb-3">
          Tells the AI which notation to prefer, filters the Reference panel
          to formulas you'd see at this level, and (P15+) tunes the practice
          generator.
        </p>
        <Field label="Track" inline>
          {() => (
            <Select
              value={curriculum}
              onValueChange={(v) => setCurriculum(v as Curriculum, custom)}
              items={ITEMS.map((i) => ({ value: i.value, label: i.label, description: i.description }))}
              ariaLabel="Curriculum"
            />
          )}
        </Field>
        {curriculum === 'custom' && (
          <div className="mt-2">
            <Field label="Custom name" inline>
              {() => (
                <Input
                  value={custom}
                  onChange={(e) => setCurriculum('custom', e.currentTarget.value)}
                  placeholder="e.g. Olympiad prep, JEE Advanced"
                />
              )}
            </Field>
          </div>
        )}
      </Card>
      <Card title="What it changes" tone="accent">
        <ul className="text-sm text-fg-2 leading-relaxed list-disc list-inside">
          <li><strong>Reference panel</strong> filters formulas to those tagged for this track.</li>
          <li><strong>AI chat</strong> appends the curriculum to its system prompt so notation matches.</li>
          <li><strong>Practice generator</strong> (P15) targets problems at this level.</li>
        </ul>
      </Card>
    </div>
  );
}
