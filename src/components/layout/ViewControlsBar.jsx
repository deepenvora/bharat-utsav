import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, FilterIcon, Grid02Icon, MapsIcon } from '@hugeicons/core-free-icons';

const tabs = [
  { id: 'card', label: 'Card', icon: Grid02Icon },
  { id: 'calendar', label: 'Calendar', icon: Calendar01Icon },
  { id: 'map', label: 'Map', icon: MapsIcon },
];

export default function ViewControlsBar({ activeTab, setActiveTab, onOpenFilters, filterCount }) {
  return (
    <div className="hidden bg-white pt-4 pb-6 md:block">
      <div className="mx-auto flex max-w-[1140px] items-center justify-between px-6">
        <button className="relative inline-flex rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-text-primary)]" type="button" onClick={onOpenFilters}>
          <span className="inline-flex items-center gap-2">
            <HugeiconsIcon icon={FilterIcon} size={16} strokeWidth={1.8} />
            Filters
          </span>
          {filterCount > 0 ? <span className="ml-2 rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[10px] font-bold text-white">{filterCount}</span> : null}
        </button>
        <div className="flex items-center rounded-full border border-[var(--color-border)] bg-white p-1">
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
      </div>
    </div>
  );
}
