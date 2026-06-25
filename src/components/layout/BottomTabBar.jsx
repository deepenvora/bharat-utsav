import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar01Icon, Grid02Icon, MapsIcon } from '@hugeicons/core-free-icons';

const tabs = [
  { id: 'card', label: 'Card', icon: Grid02Icon },
  { id: 'calendar', label: 'Calendar', icon: Calendar01Icon },
  { id: 'map', label: 'Map', icon: MapsIcon },
];

export default function BottomTabBar({ activeTab, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-white/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-full border border-[var(--color-border)] bg-[var(--color-card-bg)] p-1 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-[var(--color-brand)] text-white' : 'text-[var(--color-text-secondary)]'
              }`}
            >
              <HugeiconsIcon icon={Icon} size={16} strokeWidth={1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
