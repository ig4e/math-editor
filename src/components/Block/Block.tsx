// Block — the floating card on the whiteboard. Owns positioning + selection
// + the resize handle, and composes BlockHeader, MathBlock|TextBlock, and
// (optionally) BlockNote.

import { useCallback } from 'react';
import type { Block as BlockData } from '../../state/types';
import { useStore } from '../../state/store';
import { useActiveSheet } from '../../state/selectors';
import { cx } from '../../utils/cx';
import { Icon } from '../Icons';
import { MathBlock } from '../MathBlock';
import { TextBlock } from '../TextBlock';
import { BlockHeader } from './BlockHeader';
import { BlockNote } from './BlockNote';
import { useBlockResize } from '../../hooks/useBlockResize';

interface BlockProps {
  block: BlockData;
  selected: boolean;
  refNumber: number | null;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onEvaluateRequest: () => void;
}

export function Block({
  block, selected, refNumber, viewportRef, onEvaluateRequest,
}: BlockProps) {
  const view = useActiveSheet().view;
  const tool = useStore((s) => s.tool);
  const updateBlock     = useStore((s) => s.updateBlock);
  const setSelection    = useStore((s) => s.setSelection);
  const toggleSelected  = useStore((s) => s.toggleSelected);
  const setActiveMathId = useStore((s) => s.setActiveMathBlockId);
  const linkPending     = useStore((s) => s.linkPendingFrom);
  const setLinkPending  = useStore((s) => s.setLinkPendingFrom);
  const addLink         = useStore((s) => s.addLink);
  const toast           = useStore((s) => s.toast);

  // Position & font-size in screen pixels. Zoom is baked in here, NOT via
  // a CSS scale — that's the whole point of the crisp-zoom architecture.
  const left = block.x * view.zoom;
  const top = block.y * view.zoom;
  const fontSize = block.fontSize * view.zoom;

  const resizeHandlers = useBlockResize(block.id);

  // Click on the body — behavior depends on the active tool:
  //   move : single-click selects, modifier-click extends selection
  //   link : first click sets source, second click creates the link
  const onBodyDown = useCallback((e: React.PointerEvent) => {
    if (tool === 'link') {
      e.preventDefault();
      e.stopPropagation();
      if (!linkPending) {
        setLinkPending(block.id);
        toast('Pick another block to link', 'info');
      } else if (linkPending === block.id) {
        setLinkPending(null);
      } else {
        addLink(linkPending, block.id);
        setLinkPending(null);
        toast('Linked', 'success');
      }
      return;
    }
    if (tool !== 'move') return;
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggleSelected(block.id);
      e.preventDefault();
    } else if (!selected) {
      setSelection([block.id]);
    }
  }, [tool, block.id, selected, toggleSelected, setSelection,
      linkPending, setLinkPending, addLink, toast]);

  return (
    <div
      data-id={block.id}
      style={{ left, top }}
      onPointerDown={onBodyDown}
      className={cx(
        'js-block absolute flex flex-col min-w-[180px] bg-surface',
        'border rounded-[10px] shadow-card transition',
        selected
          ? 'border-selected ring-[3px] ring-selected-glow'
          : 'border-border',
        // Hover reveals the resize handle (see below)
        'group',
      )}
    >
      <BlockHeader block={block} refNumber={refNumber} viewportRef={viewportRef} />

      <div className="px-3 py-2">
        {block.type === 'math' ? (
          <MathBlock
            block={block}
            fontSizePx={fontSize}
            onChange={(latex) => updateBlock(block.id, { latex })}
            onFocus={() => setActiveMathId(block.id)}
            onBlur={() => setActiveMathId(null)}
            onEvaluateRequest={onEvaluateRequest}
          />
        ) : (
          <TextBlock
            block={block}
            fontSizePx={fontSize}
            onChange={(text) => updateBlock(block.id, { text })}
          />
        )}
      </div>

      {block.showNote && (
        <BlockNote
          text={block.note}
          fontSize={Math.max(11, fontSize * 0.6)}
          autoFocus={block.note === ''}
          onChange={(note) => updateBlock(block.id, { note })}
        />
      )}

      {/* Resize handle — visible on hover or when selected. data-export-ignore
          hides it from PNG export. */}
      <div
        data-export-ignore="true"
        title="Drag to resize"
        aria-label="Resize"
        className={cx(
          'absolute right-0.5 bottom-0.5 w-[18px] h-[18px]',
          'flex items-center justify-center rounded',
          'text-fg-faint cursor-nwse-resize',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-border-soft hover:text-fg',
          selected && 'opacity-100',
        )}
        {...resizeHandlers}
      >
        <Icon name="resize" className="!w-3 !h-3" />
      </div>
    </div>
  );
}
