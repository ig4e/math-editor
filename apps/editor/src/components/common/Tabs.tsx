// Radix Tabs, themed. Used for settings sections, panel sub-modes
// (e.g. ML Lab's mode picker).

import * as RT from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { cx } from '../../utils/cx';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface Props {
  value?: string;
  defaultValue?: string;
  onValueChange?(v: string): void;
  items: readonly TabItem[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Tabs({ value, defaultValue, onValueChange, items, orientation = 'horizontal', className }: Props) {
  const isVert = orientation === 'vertical';
  return (
    <RT.Root
      value={value}
      defaultValue={defaultValue ?? items[0]?.value}
      onValueChange={onValueChange}
      orientation={orientation}
      className={cx(isVert ? 'flex' : 'flex flex-col', 'h-full', className)}
    >
      <RT.List
        className={cx(
          isVert
            ? 'flex flex-col gap-0.5 p-2 border-r border-border w-44 shrink-0'
            // Horizontal: scroll the trigger row when it's too narrow
            // for all tab labels (e.g. inside Excalidraw's ~300 px
            // sidebar). `min-h-9` keeps the row aligned with the
            // border-b while allowing the buttons to shrink without
            // being squeezed into the next line.
            : 'flex items-center gap-0.5 px-2 min-h-9 border-b border-border overflow-x-auto scrollbar-thin',
        )}
      >
        {items.map((it) => (
          <RT.Trigger
            key={it.value}
            value={it.value}
            className={cx(
              'inline-flex items-center gap-2 text-sm rounded-md whitespace-nowrap',
              isVert ? 'h-8 px-2.5 justify-start' : 'h-7 px-2.5 shrink-0',
              'text-fg-2 hover:bg-surface-2',
              'data-[state=active]:bg-accent-bg data-[state=active]:text-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-app',
            )}
          >
            {it.icon}
            {it.label}
          </RT.Trigger>
        ))}
      </RT.List>
      <div className="flex-1 overflow-auto">
        {items.map((it) => (
          <RT.Content key={it.value} value={it.value} className="h-full">
            {it.content}
          </RT.Content>
        ))}
      </div>
    </RT.Root>
  );
}
