// Bottom composer: textarea + send button. Cmd+Enter sends; plain Enter
// inserts a newline (consistent with most chat UIs). Drops to disabled
// while a stream is running.

import { useCallback, useState } from 'react';
import { Button } from '../../components/common';
import { Icon } from '../../components/Icons';
import { cx } from '../../utils/cx';

interface Props {
  onSend(text: string): void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: Props) {
  const [text, setText] = useState('');

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  }, [text, onSend]);

  return (
    <div className="flex items-end gap-2">
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask anything math-y. ⌘↵ to send."
        disabled={disabled}
        className={cx(
          'flex-1 resize-none min-h-[40px] max-h-[160px]',
          'px-2.5 py-2 text-sm rounded-md',
          'bg-surface text-fg border border-border placeholder:text-fg-faint',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-app',
          'disabled:opacity-60',
        )}
      />
      <Button variant="primary" onClick={submit} disabled={disabled || !text.trim()}>
        <Icon name="play" /> Send
      </Button>
    </div>
  );
}
