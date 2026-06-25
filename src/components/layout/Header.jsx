import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, FilterIcon, GridIcon, MapsIcon, MicIcon, SearchIcon } from '@hugeicons/core-free-icons';

const tabs = [
  { id: 'card', label: 'Card', icon: GridIcon },
  { id: 'calendar', label: 'Calendar', icon: Calendar01Icon },
  { id: 'map', label: 'Map', icon: MapsIcon },
];

export default function Header({ search, setSearch, onFocusSearch, showCompactHeader, activeTab, setActiveTab, onOpenFilters, filterCount }) {
  return (
    <motion.header
      initial={false}
      animate={{
        y: showCompactHeader ? 0 : -110,
        opacity: showCompactHeader ? 1 : 0,
      }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-x-0 top-0 z-40 border-b border-[var(--color-border)] bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-[1140px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center">
          <div className="text-lg font-black text-[var(--color-brand)]">Bharat Utsav</div>
        </div>
        <div className="flex w-[420px] max-w-full items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 shadow-sm">
          <HugeiconsIcon icon={SearchIcon} size={16} strokeWidth={1.8} className="text-[var(--color-text-secondary)]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onFocus={onFocusSearch}
            placeholder="Search"
            className="w-full border-none bg-transparent text-sm outline-none"
          />
          <HugeiconsIcon icon={MicIcon} size={16} strokeWidth={1.8} className="text-[var(--color-text-secondary)]" />
        </div>
        <div className="flex min-w-0 flex-1 justify-end gap-2 md:flex">
          <button className="relative hidden rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] md:inline-flex" type="button" onClick={onOpenFilters}>
            <span className="inline-flex items-center gap-2">
              <HugeiconsIcon icon={FilterIcon} size={16} strokeWidth={1.8} />
              Filters
            </span>
            {filterCount > 0 ? <span className="ml-2 rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[10px] font-bold text-white">{filterCount}</span> : null}
          </button>
          <div className="hidden items-center rounded-full border border-[var(--color-border)] bg-white p-1 md:flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    isActive ? 'bg-[var(--color-brand)] text-white' : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  <HugeiconsIcon icon={Icon} size={16} strokeWidth={1.8} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          <button className="rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)] md:hidden" type="button" onClick={onOpenFilters}>
            Filters
          </button>
        </div>
      </div>
    </motion.header>
  );
}
