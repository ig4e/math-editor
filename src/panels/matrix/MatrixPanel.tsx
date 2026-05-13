// Matrix panel — editable spreadsheet + buttons for det, inverse,
// transpose, rank, RREF, eigenvalues, LU, QR. "Drop into sheet"
// inserts the result LaTeX as a math block on the active canvas.

import { useCallback, useState } from 'react';
import { useStore } from '../../state/store';
import {
  PanelHeader, PanelStatus, Button, Card, IconButton, Banner,
} from '../../components/common';
import { Icon } from '../../components/Icons';
import { ReadOnlyMathField } from '../solver/ReadOnlyMathField';
import {
  opDet, opInverse, opTranspose, opRank, opRREF, opEigenvalues, opLU, opQR,
  type MatrixData, type OpResult,
} from './ops';
import { cx } from '../../utils/cx';

type OpId = 'det' | 'inv' | 'transpose' | 'rank' | 'rref' | 'eig' | 'lu' | 'qr';

const initial: MatrixData = [[1, 2, 3], [4, 5, 6], [7, 8, 10]];

export default function MatrixPanel() {
  const [data, setData] = useState<MatrixData>(initial);
  const [result, setResult] = useState<{ id: OpId; r: OpResult } | null>(null);
  const toast = useStore((s) => s.toast);
  const addMathBlock = useStore((s) => s.addMathBlock);

  const sourceLatex = `\\begin{pmatrix} ${
    data.map((r) => r.map((c) => Number.isInteger(c) ? String(c) : c.toFixed(3)).join(' & ')).join(' \\\\ ')
  } \\end{pmatrix}`;

  const set = useCallback((i: number, j: number, v: string) => {
    const n = parseFloat(v);
    setData((cur) => cur.map((row, ri) => ri === i
      ? row.map((c, cj) => cj === j ? (Number.isFinite(n) ? n : 0) : c)
      : row));
  }, []);

  const addRow = () => setData((cur) => [...cur, new Array(cur[0]?.length ?? 1).fill(0)]);
  const addCol = () => setData((cur) => cur.map((row) => [...row, 0]));
  const removeRow = () => setData((cur) => cur.length > 1 ? cur.slice(0, -1) : cur);
  const removeCol = () => setData((cur) => (cur[0]?.length ?? 0) > 1 ? cur.map((row) => row.slice(0, -1)) : cur);

  const run = (id: OpId) => {
    setResult({ id, r: OPS[id].run(data) });
  };

  const pin = () => {
    if (!result?.r.ok || !result.r.latex) return;
    addMathBlock({ x: 220, y: 220, latex: result.r.latex });
    toast('Result dropped onto canvas', 'success');
  };

  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader
        title="Matrix"
        icon="matrix"
        actions={
          <>
            <IconButton icon="plus" size="sm" label="Add row" onClick={addRow} />
            <IconButton icon="close" size="sm" label="Remove row" onClick={removeRow} />
            <IconButton icon="chevron-right" size="sm" label="Add column" onClick={addCol} />
            <IconButton icon="chevron-left" size="sm" label="Remove column" onClick={removeCol} />
          </>
        }
      />
      <div className="flex items-center gap-1 px-2 h-9 border-b border-border-soft bg-surface-2 overflow-x-auto shrink-0">
        {(Object.keys(OPS) as OpId[]).map((id) => (
          <Button
            key={id}
            size="sm"
            variant={result?.id === id ? 'primary' : 'secondary'}
            onClick={() => run(id)}
          >
            {OPS[id].label}
          </Button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3 flex flex-col gap-3">
        <Card title={`Source (${data.length}×${data[0]?.length ?? 0})`}>
          <div className="overflow-auto">
            <table className="border-collapse">
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} className="p-0.5">
                        <input
                          type="number"
                          value={cell}
                          onChange={(e) => set(i, j, e.currentTarget.value)}
                          className={cx(
                            'w-16 h-7 px-1.5 text-center text-sm font-mono rounded',
                            'bg-surface text-fg border border-border',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2">
            <ReadOnlyMathField latex={sourceLatex} />
          </div>
        </Card>

        {result && (
          result.r.ok && result.r.latex ? (
            <Card
              title={`Result — ${OPS[result.id].label}`}
              tone="accent"
              titleActions={
                <Button size="sm" variant="ghost" onClick={pin}>
                  <Icon name="plus" /> Drop into sheet
                </Button>
              }
            >
              <ReadOnlyMathField latex={result.r.latex} />
              {result.r.steps && result.r.steps.length > 1 && (
                <details className="mt-2">
                  <summary className="text-xs text-fg-muted cursor-pointer">
                    {result.r.steps.length} steps
                  </summary>
                  <ol className="mt-1 flex flex-col gap-1.5">
                    {result.r.steps.map((s, i) => (
                      <li key={i} className="text-xs">
                        {s.description && (
                          <div className="text-fg-muted">{s.description}</div>
                        )}
                        <ReadOnlyMathField latex={s.latex} />
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </Card>
          ) : (
            <Banner kind="error" title="Op failed">{result.r.error}</Banner>
          )
        )}
      </div>
      <PanelStatus>
        <span>{data.length} × {data[0]?.length ?? 0}</span>
        {result?.r.ok && <span>· last op: {OPS[result.id].label}</span>}
      </PanelStatus>
    </div>
  );
}

const OPS: Record<OpId, { label: string; run: (d: MatrixData) => OpResult }> = {
  det:       { label: 'det',     run: opDet },
  inv:       { label: 'inverse', run: opInverse },
  transpose: { label: 'A^T',     run: opTranspose },
  rank:      { label: 'rank',    run: opRank },
  rref:      { label: 'RREF',    run: opRREF },
  eig:       { label: 'eigvals', run: opEigenvalues },
  lu:        { label: 'LU',      run: opLU },
  qr:        { label: 'QR',      run: opQR },
};
