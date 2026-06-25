import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, SearchIcon } from '@hugeicons/core-free-icons';
import ViewControlsBar from './ViewControlsBar';

export default function Header({
  search,
  setSearch,
  onFocusSearch,
  showCompactHeader,
  onOpenFilters,
  activeTab,
  setActiveTab,
  filterCount,
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        y: showCompactHeader ? 0 : -240,
        opacity: showCompactHeader ? 1 : 0,
      }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-40 bg-white"
    >
      <div className="border-b border-[var(--color-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1140px] flex-col gap-2 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-3 lg:px-8">
          <div className="text-lg font-black text-[var(--color-brand)] md:min-w-0 md:flex-1">Bharat Utsav</div>

          <div className="flex items-center gap-2 md:w-[420px] md:shrink-0">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 shadow-sm">
              <HugeiconsIcon icon={SearchIcon} size={16} strokeWidth={1.8} className="text-[var(--color-text-secondary)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={onFocusSearch}
                placeholder="Search"
                className="w-full border-none bg-transparent text-sm outline-none"
              />
              {search ? (
                <button type="button" onClick={() => setSearch('')} aria-label="Clear search">
                  <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.8} className="text-[var(--color-text-secondary)]" />
                </button>
              ) : null}
            </div>
            <button className="shrink-0 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] md:hidden" type="button" onClick={onOpenFilters}>
              Filters
            </button>
          </div>

          <div className="hidden md:block md:min-w-0 md:flex-1" aria-hidden="true" />
        </div>
      </div>

      <ViewControlsBar activeTab={activeTab} setActiveTab={setActiveTab} onOpenFilters={onOpenFilters} filterCount={filterCount} />
    </motion.div>
  );
}
