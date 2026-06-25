import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

export default function DetailModal({ event, onClose }) {
  if (!event) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-[560px] rounded-[24px] bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Detail</p>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{event.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[var(--color-border)] p-2">
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">{event.type} • {event.month}</p>
        <div className="mt-6 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-text-secondary)]">
          Full detail experience will be built in the next batch. This stub confirms the card opens correctly.
        </div>
      </motion.div>
    </motion.div>
  );
}
