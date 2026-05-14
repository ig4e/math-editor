// BlockEmbed — the HTML overlay content for a math / text-block scene
// element. Mounted by Excalidraw's `renderBlockContent` callback (see
// packages/excalidraw/components/App.tsx -> renderBlocks).
//
// Excalidraw owns the frame (rounded rect, border, background, opacity,
// selection box, drag handles, resize handles, delete/duplicate). The
// canvas renderer in renderElement.ts draws the frame from the
// element's `strokeColor` / `backgroundColor` / `strokeWidth` /
// roundness / opacity — so the props panel on the right just works.
//
// THIS overlay only adds the editable surface (math-field /
// contenteditable). It must NOT cover the canvas-drawn frame: the
// outer wrappers are transparent (no own bg / rounding), and only the
// inner editable elements opt into `pointer-events: auto` so the user
// types by clicking directly on them. Clicks on the empty area
// around the math/text fall through to the canvas — Excalidraw owns
// drag, resize, select, and the SelectionToolbar buttons that sit
// over the block.
//
// Content color: `strokeColor` is Excalidraw's "ink" colour for
// textual elements (TextElement uses it for text fill) — we follow
// the same convention so the props panel's stroke colour controls
// the math/text ink. Falls back to `currentColor` (theme fg) when
// the element has the placeholder `transparent` value.

import { memo, useCallback, useEffect, useRef } from 'react';
import type { MathfieldElement } from 'mathlive';
import type {
  ExcalidrawMathElement,
  ExcalidrawTextBlockElement,
} from '@excalidraw/excalidraw/element/types';
import { useStore } from '../../state/store';
import { updateBlockElement } from './blockElements';

interface Props {
  element: ExcalidrawMathElement | ExcalidrawTextBlockElement;
}

/** Pick a usable CSS colour for the editable surface. Falls back to
 *  the theme's foreground (`currentColor`) for the placeholder
 *  'transparent' that Excalidraw uses to mean "no explicit colour". */
function inkColor(strokeColor: string | undefined): string {
  if (!strokeColor || strokeColor === 'transparent') return 'currentColor';
  return strokeColor;
}

function BlockEmbedImpl({ element }: Props) {
  const ink = inkColor(element.strokeColor);
  return (
    <div
      className="js-block-embed h-full w-full flex flex-col overflow-hidden"
      // Transparent — the canvas frame underneath is the visible
      // surface. Inherit text colour from the element's strokeColor
      // so the props panel can re-tint math/text content.
      style={{ background: 'transparent', color: ink }}
    >
      <div className="flex-1 min-h-0 overflow-auto">
        {element.type === 'math' ? (
          <MathBody element={element} />
        ) : (
          <TextBody element={element} />
        )}
      </div>
      {element.showNote && element.note && (
        <div
          // The note row gets pointer-events: auto so the user can
          // select / copy its text; visually it's a thin border row
          // at the bottom, painted in a muted shade of the ink colour.
          className="border-t border-border-soft px-2 py-1 text-[11px] italic pointer-events-auto"
          style={{ opacity: 0.7 }}
        >
          {element.note}
        </div>
      )}
    </div>
  );
}

// ----- math body ----------------------------------------------------

function MathBody({ element }: { element: ExcalidrawMathElement }) {
  const mfRef = useRef<MathfieldElement | null>(null);
  const setActive = useStore((s) => s.setActiveMathBlockId);

  useEffect(() => {
    const mf = mfRef.current;
    if (mf && mf.value !== element.latex) {
      mf.value = element.latex;
    }
  }, [element.latex]);

  const onInput = useCallback(() => {
    const mf = mfRef.current;
    if (!mf) return;
    if (mf.value !== element.latex) {
      updateBlockElement(element.blockId, { latex: mf.value });
    }
  }, [element.blockId, element.latex]);

  return (
    <div className="px-2 py-1 h-full" style={{ fontSize: element.fontSize }}>
      {/* The <math-field> is the click target: it opts back into
          pointer events so clicking ON the math content focuses it
          for editing. The block's empty padding stays pointer-events:
          none (inherited from the container) so the canvas can catch
          drags from there. */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <math-field
        ref={mfRef as any}
        onInput={onInput}
        onFocus={() => setActive(element.blockId)}
        onBlur={() => setActive(null)}
        className="block w-full pointer-events-auto"
      >
        {element.latex}
      </math-field>
    </div>
  );
}

// ----- text body ----------------------------------------------------

function TextBody({ element }: { element: ExcalidrawTextBlockElement }) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = editorRef.current;
    if (el && el.textContent !== element.text) {
      el.textContent = element.text;
    }
  }, [element.text]);

  const onInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const next = el.textContent ?? '';
    if (next !== element.text) {
      updateBlockElement(element.blockId, { text: next });
    }
  }, [element.blockId, element.text]);

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={onInput}
      data-placeholder="Text…"
      // pointer-events: auto so clicking the text body focuses it.
      // The empty surround stays pointer-events: none for drag.
      className="px-2 py-1 outline-none whitespace-pre-wrap min-h-[24px] h-full pointer-events-auto"
      style={{ fontSize: element.fontSize }}
    >
      {element.text}
    </div>
  );
}

export const BlockEmbed = memo(BlockEmbedImpl);
