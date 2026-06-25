import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, FilterIcon } from '@hugeicons/core-free-icons';

const filterSections = [
  { key: 'type', label: 'Type' },
  { key: 'month', label: 'Month' },
  { key: 'religion', label: 'Tradition' },
  { key: 'state', label: 'State' },
];

export default function FiltersPanel({ open, onClose, filters, onToggle, availableOptions, onClear }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50"
      onClick={onClose}
    >
      <motion.aside
        initial={isMobile ? { y: '100%' } : { x: '100%' }}
        animate={isMobile ? { y: 0 } : { x: 0 }}
        exit={isMobile ? { y: '100%' } : { x: '100%' }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className={
          isMobile
            ? 'fixed inset-0 flex h-full w-full flex-col bg-white p-5'
            : 'ml-auto flex h-full w-full max-w-[420px] flex-col bg-white p-5 shadow-2xl'
        }
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Filters</p>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Refine your picks</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-[var(--color-border)] p-2">
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto">
          {filterSections.map((section) => {
            const values = availableOptions[section.key] || [];
            const selected = filters[section.key] || [];
            return (
              <section key={section.key}>
                <div className="mb-3 flex items-center gap-2">
                  <HugeiconsIcon icon={FilterIcon} size={16} strokeWidth={1.8} className="text-[var(--color-brand)]" />
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">{section.label}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {values.map((value) => {
                    const active = selected.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onToggle(section.key, value)}
                        className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                          active
                            ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                            : 'border-[var(--color-border)] bg-white text-[var(--color-text-primary)]'
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
          <button type="button" className="text-sm font-semibold text-[var(--color-text-secondary)]" onClick={onClear}>
            Clear all
          </button>
          <button type="button" className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white" onClick={onClose}>
            Apply
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}
