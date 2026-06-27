import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { useChat } from '../../hooks/useChat';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import StarterPills from './StarterPills';

export default function ChatOverlay({ onClose }) {
  const { messages, isTyping, sendMessage } = useChat();

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-50 flex flex-col bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-center pt-3">
        <div className="h-1.5 w-10 rounded-full bg-[var(--color-border)]" />
      </div>
      <div className="flex items-center justify-between px-4 pb-3 pt-2">
        <h2 className="text-base font-bold text-[var(--color-text-primary)]">Ask anything</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full border border-[var(--color-border)] p-1.5">
          <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} />
        </button>
      </div>
      {messages.length === 0 ? <StarterPills onSelect={sendMessage} /> : null}
      <div className="flex-1 overflow-y-auto">
        {messages.length > 0 ? <ChatMessages messages={messages} isTyping={isTyping} /> : null}
      </div>
      <ChatInput onSend={sendMessage} disabled={isTyping} />
    </motion.div>
  );
}
