// KaTeX-based math rendering for the Notes preview. Splits a text run
// into (text, math-inline, math-display) segments and renders each
// math segment via KaTeX's renderToString. Cached per LaTeX source so
// keystroke updates don't re-render every block.
//
// We deliberately don't render math via MathLive's convertLatexToMarkup
// here — KaTeX's output is purpose-built for static markup and is
// noticeably faster for long Notes panels.

import katex from 'katex';
import 'katex/dist/katex.min.css';

export type MathSeg = { kind: 'text'; text: string } | { kind: 'math'; latex: string; display: boolean };

/** Splits raw text by $$..$$ (display) and $..$ (inline) math
 *  delimiters. Backslash-escaped \$ is treated as literal. */
export function splitMath(input: string): MathSeg[] {
  const out: MathSeg[] = [];
  let i = 0;
  let buf = '';
  while (i < input.length) {
    const ch = input[i]!;
    if (ch === '\\' && (input[i + 1] === '$')) {
      buf += '$'; i += 2; continue;
    }
    if (ch === '$') {
      const display = input[i + 1] === '$';
      const open = display ? '$$' : '$';
      const start = i + open.length;
      const end = input.indexOf(open, start);
      if (end === -1) {
        buf += ch; i++; continue;
      }
      if (buf) { out.push({ kind: 'text', text: buf }); buf = ''; }
      out.push({ kind: 'math', latex: input.slice(start, end), display });
      i = end + open.length;
      continue;
    }
    buf += ch; i++;
  }
  if (buf) out.push({ kind: 'text', text: buf });
  return out;
}

const cache = new Map<string, string>();
const MAX_CACHE = 256;

/** Render a single LaTeX source to HTML. Errors fall through to a red
 *  inline span so the rest of the note keeps rendering. */
export function renderMath(latex: string, display: boolean): string {
  const key = (display ? 'D:' : 'I:') + latex;
  const hit = cache.get(key);
  if (hit) return hit;
  let html: string;
  try {
    html = katex.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      output: 'html',
      strict: 'ignore',
    });
  } catch (e) {
    html = `<span style="color:var(--color-danger)">${escapeHtml((e as Error).message)}</span>`;
  }
  if (cache.size > MAX_CACHE) {
    // Drop the oldest entry to keep the cache bounded.
    const first = cache.keys().next().value;
    if (first !== undefined) cache.delete(first);
  }
  cache.set(key, html);
  return html;
}

/** Walk a string, returning HTML with math segments rendered. Used
 *  inline-in-a-text-token by the Notes panel's marked walker. */
export function renderInlineMath(text: string): string {
  const segs = splitMath(text);
  return segs.map((s) =>
    s.kind === 'text' ? escapeHtml(s.text) : renderMath(s.latex, s.display)
  ).join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
