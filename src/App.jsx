import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import events from './data';
import CardGrid from './components/home/CardGrid';
import CalendarView from './components/calendar/CalendarView';
import MapView from './components/map/MapView';
import Header from './components/layout/Header';
import BottomTabBar from './components/layout/BottomTabBar';
import FAB from './components/layout/FAB';
import FiltersPanel from './components/filters/FiltersPanel';
import DetailModal from './components/detail/DetailModal';
import DetailPage from './components/detail/DetailPage';
import GalleryScreen from './components/gallery/GalleryScreen';
import ChatPanel from './components/chat/ChatPanel';
import ChatOverlay from './components/chat/ChatOverlay';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('view') || 'card';
  const search = searchParams.get('q') || '';
  const selectedFilters = useMemo(
    () => Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.getAll(key)])),
    [searchParams],
  );
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const [chatMode, setChatMode] = useState(null); // null | 'panel' | 'overlay'
  const [mapSheetOpen, setMapSheetOpen] = useState(false);

  const handleToggleChat = () => {
    if (chatMode) {
      setChatMode(null);
      return;
    }
    setChatMode(window.innerWidth < 768 ? 'overlay' : 'panel');
  };

  const setActiveTab = (tab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'card') {
      next.delete('view');
    } else {
      next.set('view', tab);
    }
    setSearchParams(next);
  };

  const setSearch = (value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) {
          next.set('q', value);
        } else {
          next.delete('q');
        }
        return next;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    const headerEl = document.querySelector('[data-app-header]');
    const tabBarEl = document.querySelector('[data-app-bottom-tab-bar]');

    const update = () => {
      setHeaderHeight(headerEl?.getBoundingClientRect().height || 0);
      setBottomBarHeight(tabBarEl?.getBoundingClientRect().height || 0);
    };

    update();
    const observer = new ResizeObserver(update);
    if (headerEl) observer.observe(headerEl);
    if (tabBarEl) observer.observe(tabBarEl);
    return () => observer.disconnect();
  }, [activeTab]);

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
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const current = next.getAll(key);
        next.delete(key);
        const updated = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
        updated.forEach((item) => next.append(key, item));
        return next;
      },
      { replace: true },
    );
  };

  const clearFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        FILTER_KEYS.forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
  };

  const filterCount = FILTER_KEYS.reduce((count, key) => count + (selectedFilters[key]?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8fb_0%,#ffffff_30%,#fffafc_100%)] text-[var(--color-text-primary)]">
      <Header
        search={search}
        setSearch={setSearch}
        onFocusSearch={() => {}}
        showCompactHeader
        onOpenFilters={() => setShowFilters(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filterCount={filterCount}
      />
      <main className="mx-auto max-w-[1140px] px-6 pb-24" style={{ paddingTop: headerHeight + 24 }}>
        {activeTab === 'calendar' ? (
          <CalendarView events={filteredEvents} onOpenDetail={setSelectedEvent} headerHeight={headerHeight} />
        ) : activeTab === 'map' ? (
          <MapView
            events={filteredEvents}
            onOpenDetail={setSelectedEvent}
            headerHeight={headerHeight}
            bottomBarHeight={bottomBarHeight}
            search={search}
            onSheetVisibilityChange={setMapSheetOpen}
          />
        ) : (
          <motion.div
            key="card-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <CardGrid events={filteredEvents} onOpenDetail={setSelectedEvent} />
          </motion.div>
        )}
      </main>
      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
      {!chatMode && !mapSheetOpen ? <FAB onClick={handleToggleChat} /> : null}
      {chatMode === 'panel' ? <ChatPanel onClose={() => setChatMode(null)} /> : null}
      {chatMode === 'overlay' ? <ChatOverlay onClose={() => setChatMode(null)} /> : null}
      <FiltersPanel
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={selectedFilters}
        onToggle={toggleFilterValue}
        availableOptions={availableOptions}
        onClear={clearFilters}
      />
      <DetailModal
        event={selectedEvent}
        events={events}
        onClose={() => setSelectedEvent(null)}
        onSelectEvent={setSelectedEvent}
      />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/festival/:id" element={<DetailPage />} />
      <Route path="/gallery/:id" element={<GalleryScreen />} />
    </Routes>
  );
}
