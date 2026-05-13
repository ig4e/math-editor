// Block header row: ref label / type indicator, plus note / duplicate /
// delete buttons. The whole row is the drag handle.

import { useCallback } from 'react';
import type { Block } from '../../state/types';
import { useStore } from '../../state/store';
import { Icon } from '../Icons';
import { useBlockDrag } from '../../hooks/useBlockDrag';

interface Props {
  block: Block;
  refNumber: number | null;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

export function BlockHeader({ block, refNumber, viewportRef }: Props) {
  const dragHandlers = useBlockDrag(block.id, viewportRef);
  const setShowNote    = useStore((s) => s.setShowNote);
  const duplicateBlock = useStore((s) => s.duplicateBlock);
  const deleteBlock    = useStore((s) => s.deleteBlock);
  const toast          = useStore((s) => s.toast);

  const onCopyRef = useCallback(() => {
    if (refNumber == null) return;
    navigator.clipboard?.writeText(`(${refNumber})`);
    toast(`Copied reference (${refNumber})`, 'success');
  }, [refNumber, toast]);

  return (
    <div
      className="js-block-head flex items-center gap-1 px-1.5 py-1
                 border-b border-border-soft cursor-grab active:cursor-grabbing
                 select-none touch-none text-xs text-fg-faint"
      {...dragHandlers}
    >
      {block.type === 'math' && refNumber != null ? (
        <button
          onClick={onCopyRef}
          title="Click to copy reference"
          className="font-semibold text-fg-2 bg-surface-2 hover:bg-border-soft
                     hover:text-fg px-2 py-0.5 rounded-full
                     tabular-nums text-xs cursor-copy"
        >
          ({refNumber})
        </button>
      ) : (
        <span className="inline-flex items-center px-1 cursor-default" aria-label="text block">
          <Icon name="text" className="!w-3 !h-3" />
        </span>
      )}

      <span className="flex-1" />

      <HeaderBtn title="Toggle note"  onClick={() => setShowNote(block.id, !block.showNote)} icon="note" />
      <HeaderBtn title="Duplicate"    onClick={() => duplicateBlock(block.id)}                icon="copy" />
      <HeaderBtn title="Delete"       onClick={() => deleteBlock(block.id)}                    icon="close" />
    </div>
  );
}

function HeaderBtn(props: {
  title: string;
  icon: 'note' | 'copy' | 'close';
  onClick: () => void;
}) {
  return (
    <button
      title={props.title}
      onClick={(e) => { e.stopPropagation(); props.onClick(); }}
      className="inline-flex items-center justify-center w-[22px] h-[22px]
                 rounded text-fg-faint hover:bg-border-soft hover:text-fg"
    >
      <Icon name={props.icon} className="!w-[13px] !h-[13px]" />
    </button>
  );
}
