// BlockEmbed — the HTML overlay content for a math / text-block scene
// element. Mounted by Excalidraw's `renderBlockContent` callback (see
// packages/excalidraw/components/App.tsx -> renderBlocks). Excalidraw
// owns the frame (rounded rect, border, background), selection box,
// drag handles, resize handles, and delete/duplicate keyboard
// shortcuts. This component just renders the editable surface —
// math-field for math blocks, contenteditable for text blocks —
// inside the element's bounds.
//
// Pointer events on the overlay are gated on selection by the parent
// (App.tsx renderBlocks), so when the element isn't selected clicks
// pass through to the canvas (Excalidraw owns drag/select). When
// selected, this overlay swallows input so the user can type.

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

function BlockEmbedImpl({ element }: Props) {
  return (
    <div className="js-block-embed h-full w-full flex flex-col rounded-md overflow-hidden bg-surface text-fg">
      <div className="flex-1 min-h-0 overflow-auto">
        {element.type === 'math' ? (
          <MathBody element={element} />
        ) : (
          <TextBody element={element} />
        )}
      </div>
      {element.showNote && element.note && (
        <div className="border-t border-border-soft px-2 py-1 text-[11px] italic text-fg-muted">
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
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <math-field
        ref={mfRef as any}
        onInput={onInput}
        onFocus={() => setActive(element.blockId)}
        onBlur={() => setActive(null)}
        className="block w-full"
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
      className="px-2 py-1 outline-none text-fg whitespace-pre-wrap min-h-[24px] h-full"
      style={{ fontSize: element.fontSize }}
    >
      {element.text}
    </div>
  );
}

export const BlockEmbed = memo(BlockEmbedImpl);
