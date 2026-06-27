import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { useChat } from '../../hooks/useChat';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import StarterPills from './StarterPills';

export default function ChatPanel({ onClose }) {
  const { messages, isTyping, sendMessage } = useChat();

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: 400 }}
        animate={{ x: 0 }}
        exit={{ x: 400 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-y-0 right-0 z-50 flex w-[400px] flex-col border-l border-[var(--color-border)] bg-white shadow-[-8px_0_30px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-center justify-between p-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">Ask about festivals</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-[var(--color-border)] p-1.5">
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
          </button>
        </div>
        <div className="border-b border-[var(--color-border)]" />
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? <StarterPills onSelect={sendMessage} /> : <ChatMessages messages={messages} isTyping={isTyping} />}
        </div>
        <ChatInput onSend={sendMessage} disabled={isTyping} />
      </motion.div>
    </>
  );
}
