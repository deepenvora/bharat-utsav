import { useEffect, useRef } from 'react';

function renderWithBold(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : part
  );
}

function TypingIndicator() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-[12px_12px_12px_2px] border-[0.5px] border-[var(--color-border)] bg-white px-4 py-3">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-text-secondary)]"
          style={{ animationDelay: `${dot * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export default function ChatMessages({ messages, isTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col gap-2 p-4">
      {messages.map((message, index) => {
        if (message.role === 'error') {
          return (
            <p key={index} className="text-sm text-[var(--color-brand-dark)]">
              {message.content}
            </p>
          );
        }

        const isUser = message.role === 'user';
        return (
          <div
            key={index}
            className={
              isUser
                ? 'ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-[12px_12px_2px_12px] bg-[var(--color-brand)] px-4 py-3 text-sm text-white'
                : 'w-fit max-w-[85%] whitespace-pre-line rounded-[12px_12px_12px_2px] border-[0.5px] border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)]'
            }
          >
            {renderWithBold(message.content)}
          </div>
        );
      })}
      {isTyping ? <TypingIndicator /> : null}
      <div ref={bottomRef} />
    </div>
  );
}
