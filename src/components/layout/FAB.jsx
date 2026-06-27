import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, SparklesIcon } from '@hugeicons/core-free-icons';

export default function FAB({ isOpen = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-24 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#7C3AED] text-white shadow-[0_10px_24px_rgba(247,16,121,0.35)] md:bottom-8 md:right-8"
      aria-label={isOpen ? 'Close chat' : 'Ask about festivals'}
    >
      <HugeiconsIcon icon={isOpen ? Cancel01Icon : SparklesIcon} size={22} strokeWidth={1.8} />
    </button>
  );
}
