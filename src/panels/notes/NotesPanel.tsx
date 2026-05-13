// Markdown notes per sheet. Edit pane on the left, rendered preview on
// the right. The preview walks `marked`'s lexer output so we can swap
// in a real React tree for ```python``` fenced blocks — those render
// with a Run button that bridges to the Pyodide kernel via
// PyodideCodeBlock.

import { useEffect, useMemo, useState } from 'react';
import { marked, type Tokens } from 'marked';
import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import { PanelHeader, PanelStatus, IconButton } from '../../components/common';
import { cx } from '../../utils/cx';
import { PyodideCodeBlock } from './PyodideCodeBlock';

export default function NotesPanel() {
  const sheet = useActiveSheet();
  const setNotes = useStore((s) => s.setSheetNotes);
  const [draft, setDraft] = useState(sheet?.notes ?? '');
  const [mode, setMode] = useState<'split' | 'edit' | 'preview'>('split');

  // Sync draft when the sheet flips.
  useEffect(() => { setDraft(sheet?.notes ?? ''); }, [sheet?.id]);

  // Debounced write-back so per-keystroke immer churn is bounded.
  useEffect(() => {
    if (!sheet) return;
    const id = sheet.id;
    const handle = window.setTimeout(() => {
      if (draft !== sheet.notes) setNotes(id, draft);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [draft, sheet, setNotes]);

  // Walk the lexer output. Contiguous non-python runs render as one
  // dangerouslySetInnerHTML block (keeps semantics identical to the
  // pre-walker version for the 99% case); ```python``` blocks become
  // a <PyodideCodeBlock> React subtree.
  const rendered = useMemo(() => {
    try {
      const tokens = marked.lexer(draft);
      const parts: { kind: 'html' | 'python'; payload: string }[] = [];
      let buf: Tokens.Generic[] = [];
      const flush = () => {
        if (buf.length === 0) return;
        const html = marked.parser(buf as never) as string;
        parts.push({ kind: 'html', payload: html });
        buf = [];
      };
      for (const t of tokens) {
        if (t.type === 'code' && (t as Tokens.Code).lang === 'python') {
          flush();
          parts.push({ kind: 'python', payload: (t as Tokens.Code).text });
        } else {
          buf.push(t as Tokens.Generic);
        }
      }
      flush();
      return parts;
    } catch (e) {
      return [{ kind: 'html' as const, payload: `<pre style="color:#dc2626">${(e as Error).message}</pre>` }];
    }
  }, [draft]);

  return (
    <div className="flex flex-col h-full bg-surface">
      <PanelHeader
        title="Notes"
        icon="note"
        actions={
          <>
            <IconButton icon="text" size="sm" label="Edit only" active={mode === 'edit'} onClick={() => setMode('edit')} />
            <IconButton icon="layout" size="sm" label="Split view" active={mode === 'split'} onClick={() => setMode('split')} />
            <IconButton icon="book" size="sm" label="Preview only" active={mode === 'preview'} onClick={() => setMode('preview')} />
          </>
        }
      />
      <div className="flex-1 flex overflow-hidden">
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.currentTarget.value)}
            placeholder={`# Notes for this sheet\nUse **markdown** — \`code\`, lists, headings, etc.\n\n\`\`\`python\nprint(1 + 1)\n\`\`\``}
            className={cx(
              'flex-1 p-3 outline-none resize-none bg-surface-2 font-mono text-[13px] text-fg',
              'placeholder:text-fg-faint',
              mode === 'split' && 'border-r border-border-soft',
            )}
          />
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div
            className={cx(
              'flex-1 p-3 overflow-auto max-w-none text-fg',
              '[&_pre]:bg-surface-2 [&_pre]:p-2 [&_pre]:rounded',
              '[&_code]:font-mono [&_code]:text-[12px]',
              '[&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm',
              '[&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold',
              '[&_h1]:mt-3 [&_h2]:mt-3 [&_h3]:mt-2',
              '[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
              '[&_a]:text-accent [&_a]:underline',
            )}
          >
            {rendered.map((p, i) =>
              p.kind === 'python'
                ? <PyodideCodeBlock key={i} code={p.payload} />
                : <div key={i} dangerouslySetInnerHTML={{ __html: p.payload }} />,
            )}
          </div>
        )}
      </div>
      <PanelStatus>
        <span>{draft.length} chars</span>
        <span>· {draft.split(/\s+/).filter(Boolean).length} words</span>
      </PanelStatus>
    </div>
  );
}
