// Themed wrapper around @radix-ui/react-tooltip. Use as:
//   <Tooltip label="Delete (Del)" shortcut="Del">
//     <button>…</button>
//   </Tooltip>

import * as RT from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

interface Props {
  label: ReactNode;
  /** Optional shortcut chip on the right of the tooltip. */
  shortcut?: string;
  /** Where the tooltip floats relative to the trigger. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Open delay in ms (Radix default is 700ms). */
  delayDuration?: number;
  /** Disable without removing the wrapper — handy in conditional menus. */
  disabled?: boolean;
  children: ReactNode;
}

export function Tooltip({
  label, shortcut, side = 'bottom', delayDuration = 350, disabled, children,
}: Props) {
  if (disabled) return <>{children}</>;
  return (
    <RT.Root delayDuration={delayDuration}>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-[300] inline-flex items-center gap-2 px-2 py-1
                     rounded-md text-xs font-medium
                     bg-fg text-surface
                     shadow-toast
                     data-[state=delayed-open]:animate-[toast-in_120ms_ease-out]
                     data-[state=instant-open]:animate-[toast-in_120ms_ease-out]"
        >
          <span>{label}</span>
          {shortcut && (
            <kbd className="px-1 py-0.5 rounded text-[10px] bg-fg-muted/30 text-surface
                            font-mono tracking-tight">
              {shortcut}
            </kbd>
          )}
          <RT.Arrow className="fill-fg" />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  );
}

/** Mount once at App root so `<Tooltip>` instances can register with Radix. */
export const TooltipProvider = RT.Provider;
