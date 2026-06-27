import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUp01Icon } from '@hugeicons/core-free-icons';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    if (!value.trim() || disabled) {
      return;
    }
    onSend(value);
    setValue('');
  };

  return (
    <div className="flex items-center gap-2 border-t border-[var(--color-border)] p-3">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleSend();
          }
        }}
        placeholder="Ask anything..."
        className="flex-1 rounded-[var(--radius-pill)] border border-[var(--color-border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)]"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-white disabled:opacity-40"
      >
        <HugeiconsIcon icon={ArrowUp01Icon} size={18} strokeWidth={2} />
      </button>
    </div>
  );
}
