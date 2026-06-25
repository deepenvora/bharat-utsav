import { useEffect, useMemo, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import events from './data/india-cultural-calendar.json';
import HeroSection from './components/home/HeroSection';
import CardGrid from './components/home/CardGrid';
import Header from './components/layout/Header';
import BottomTabBar from './components/layout/BottomTabBar';
import FAB from './components/layout/FAB';
import FiltersPanel from './components/filters/FiltersPanel';
import DetailModal from './components/detail/DetailModal';

const FILTER_KEYS = ['type', 'month', 'religion', 'state'];

function getAvailableOptions(items) {
  const options = { type: [], month: [], religion: [], state: [] };
  items.forEach((event) => {
    if (event.type) options.type.push(event.type);
    if (event.month) options.month.push(event.month);
    if (event.religion) options.religion.push(event.religion);
    if (Array.isArray(event.state)) {
      event.state.forEach((state) => options.state.push(state));
    }
  });
  return Object.fromEntries(Object.entries(options).map(([key, values]) => [key, [...new Set(values)].sort()]));
}

function HomePage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('card');
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({ type: [], month: [], religion: [], state: [] });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const heroSentinelRef = useRef(null);

  useEffect(() => {
    const node = heroSentinelRef.current;
    if (!node) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowCompactHeader(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const availableOptions = useMemo(() => getAvailableOptions(events), []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const haystack = `${event.title} ${event.keywords?.join(' ') || ''}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);

      const matchesFilters = FILTER_KEYS.every((key) => {
        const selectedValues = selectedFilters[key];
        if (!selectedValues || selectedValues.length === 0) {
          return true;
        }
        if (key === 'type') {
          return selectedValues.includes(event.type);
        }
        if (key === 'month') {
          return selectedValues.includes(event.month);
        }
        if (key === 'religion') {
          return selectedValues.includes(event.religion);
        }
        if (key === 'state') {
          return (event.state || []).some((state) => selectedValues.includes(state));
        }
        return true;
      });

      return matchesSearch && matchesFilters;
    });
  }, [search, selectedFilters]);

  const toggleFilterValue = (key, value) => {
    setSelectedFilters((current) => {
      const selected = current[key] || [];
      return {
        ...current,
        [key]: selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({ type: [], month: [], religion: [], state: [] });
  };

  const filterCount = FILTER_KEYS.reduce((count, key) => count + (selectedFilters[key]?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8fb_0%,#ffffff_30%,#fffafc_100%)] text-[var(--color-text-primary)]">
      <HeroSection
        search={search}
        setSearch={setSearch}
        onFocusSearch={() => {}}
        sentinelRef={heroSentinelRef}
        onOpenFilters={() => setShowFilters(true)}
      />
      <Header
        search={search}
        setSearch={setSearch}
        onFocusSearch={() => {}}
        showCompactHeader={showCompactHeader}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFilters={() => setShowFilters(true)}
        filterCount={filterCount}
      />
      <main className="mx-auto max-w-[1140px] px-4 pb-24 pt-0 sm:px-6 lg:px-8">
        <CardGrid events={filteredEvents} onOpenDetail={setSelectedEvent} />
      </main>
      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
      <FAB />
      <FiltersPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={selectedFilters}
        onToggle={toggleFilterValue}
        availableOptions={availableOptions}
        onClear={clearFilters}
      />
      <DetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}

function GalleryPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-4xl rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-8 shadow-[var(--shadow-card)]">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">Gallery</p>
        <h1 className="text-3xl font-bold">Placeholder route</h1>
        <p className="mt-3 text-base text-[var(--color-text-secondary)]">
          The gallery route is prepared for the upcoming mobile gallery implementation.
        </p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/gallery/:id" element={<GalleryPage />} />
    </Routes>
  );
}
