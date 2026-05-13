// Single chat-thread message. Markdown rendering deferred to P17 — for
// now we render plaintext with paragraph breaks, tool-call cards
// alongside, and a Copy action.

import { useStore } from '../../state/store';
import { Button, Card } from '../../components/common';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';
import type { ChatUIMessage } from './types';

interface Props {
  message: ChatUIMessage;
  streaming: boolean;
}

export function ChatMessageView({ message, streaming }: Props) {
  const toast = useStore((s) => s.toast);
  const isUser = message.role === 'user';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      toast('Copied', 'success');
    } catch {
      toast('Copy failed', 'error');
    }
  };

  return (
    <div className={cx('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div className="flex items-center gap-1 text-[10px] text-fg-muted">
        <Icon name={isUser ? 'cursor' : 'sparkles'} className="w-3 h-3" />
        <span>{isUser ? 'You' : 'Assistant'}{streaming ? ' · streaming…' : ''}</span>
      </div>
      <div
        className={cx(
          'max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap',
          isUser ? 'bg-accent text-white' : 'bg-surface border border-border-soft text-fg',
        )}
      >
        {message.text || <span className="text-fg-muted">…</span>}
      </div>

      {message.toolCalls && message.toolCalls.length > 0 && (
        <div className="flex flex-col gap-1 max-w-[80%]">
          {message.toolCalls.map((tc: { toolName: string; args: unknown }, i: number) => (
            <Card key={i} tone="accent" density="compact">
              <div className="flex items-center gap-1 text-xs">
                <Icon name="wand" /> <span className="font-mono">{tc.toolName}</span>
              </div>
              <pre className="text-[10px] text-fg-muted whitespace-pre-wrap break-all mt-1">
                {JSON.stringify(tc.args, null, 2)}
              </pre>
            </Card>
          ))}
        </div>
      )}

      {!isUser && message.text && !streaming && (
        <Button size="sm" variant="ghost" onClick={() => void copy()}>
          <Icon name="copy" /> Copy
        </Button>
      )}
    </div>
  );
}
