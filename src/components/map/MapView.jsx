import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import allEvents from '../../data';
import { usePexels } from '../../hooks/usePexels';

const TOPOJSON_URL = 'https://raw.githubusercontent.com/udit-001/india-maps-data/main/topojson/india.json';

const SELECTED_COLOR = { fill: '#F71079', stroke: '#C4005E' };
const FALLBACK_COLOR = { fill: '#FBEAF0', stroke: '#F4C0D1' };

const COLOR_GROUPS = [
  { fill: '#FAEEDA', stroke: '#FAC775', states: ['Rajasthan', 'Chhattisgarh', 'Manipur', 'Goa'] },
  { fill: '#E1F5EE', stroke: '#9FE1CB', states: ['Punjab', 'Madhya Pradesh', 'Kerala', 'Nagaland', 'Dadra and Nagar Haveli and Daman and Diu'] },
  { fill: '#EEEDFE', stroke: '#CECBF6', states: ['Himachal Pradesh', 'Odisha', 'Meghalaya', 'Lakshadweep'] },
  { fill: '#E6F1FB', stroke: '#B5D4F4', states: ['Gujarat', 'Karnataka', 'Assam', 'Uttarakhand'] },
  { fill: '#FAECE7', stroke: '#F5C4B3', states: ['Maharashtra', 'Andhra Pradesh', 'Mizoram', 'Jammu and Kashmir'] },
  { fill: '#EAF3DE', stroke: '#C0DD97', states: ['Uttar Pradesh', 'Tamil Nadu', 'Tripura', 'Arunachal Pradesh', 'Sikkim', 'Ladakh'] },
];

function normalize(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

// Known aliases from older/alternate topoJSON sources; the current TOPOJSON_URL
// already ships canonical names so these mostly go unused — kept for resilience
// if the source ever changes.
const MATCH_MAP = {
  'jammu & kashmir': 'jammu and kashmir',
  uttaranchal: 'uttarakhand',
  orissa: 'odisha',
  pondicherry: 'puducherry',
  'a & n islands': 'andaman and nicobar islands',
  'd & n haveli': 'dadra and nagar haveli and daman and diu',
  'daman & diu': 'dadra and nagar haveli and daman and diu',
};

function resolveStateKey(rawName) {
  const key = normalize(rawName);
  return MATCH_MAP[key] || key;
}

const ANDAMAN_NICOBAR_KEY = 'andaman and nicobar islands';

const STATE_COLORS = {};
COLOR_GROUPS.forEach(({ fill, stroke, states }) => {
  states.forEach((state) => {
    STATE_COLORS[normalize(state)] = { fill, stroke };
  });
});
delete STATE_COLORS[ANDAMAN_NICOBAR_KEY];

function getStateColor(stateKey) {
  return STATE_COLORS[stateKey] || FALLBACK_COLOR;
}

const CANONICAL_STATE_KEYS = new Set();
allEvents.forEach((event) => (event.state || []).forEach((s) => CANONICAL_STATE_KEYS.add(normalize(s))));

function getEventsForState(events, stateKey) {
  return events.filter((event) => (event.state || []).some((rawState) => resolveStateKey(rawState) === stateKey));
}

// Same grouping/labeling as CalendarView's search results — duplicated here
// (not exported there) since this batch of work is scoped to MapView.jsx only.
const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDay(event) {
  const day = event.date ? parseInt(event.date.split('-')[2], 10) : NaN;
  return Number.isNaN(day) ? null : day;
}

function groupByMonth(eventList) {
  const grouped = {};
  eventList.forEach((event) => {
    if (!event.month) return;
    grouped[event.month] = grouped[event.month] || [];
    grouped[event.month].push(event);
  });

  Object.keys(grouped).forEach((month) => {
    grouped[month] = [...grouped[month]].sort((a, b) => {
      const dayA = getDay(a);
      const dayB = getDay(b);
      if (dayA === null && dayB === null) return 0;
      if (dayA === null) return 1;
      if (dayB === null) return -1;
      return dayA - dayB;
    });
  });

  return grouped;
}

function formatDateLabel(event) {
  if (event.date) {
    const parsed = new Date(`${event.date}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  return event.month || '';
}

// Series parents (e.g. Diwali) cluster with their children as a contiguous
// block instead of the children appearing standalone at their own date
// positions. A child only nests if its parent is also present in this same
// filtered list — if the parent got filtered out for some reason, the child
// falls back to rendering standalone rather than disappearing.
function groupWithSeriesChildren(eventList) {
  const listIds = new Set(eventList.map((event) => event.id));
  const groups = [];
  eventList.forEach((event) => {
    if (event.parent && listIds.has(event.parent)) {
      return; // rendered nested under its parent below
    }
    if (event.isSeriesParent) {
      const children = (event.seriesChildren || [])
        .filter((childId) => listIds.has(childId))
        .map((childId) => eventList.find((candidate) => candidate.id === childId))
        .filter(Boolean);
      groups.push({ event, children });
    } else {
      groups.push({ event, children: [] });
    }
  });
  return groups;
}

function MapEventRow({ event, indent = false }) {
  const navigate = useNavigate();
  const [images, setImages] = useState(event.images || []);
  const { fetchImages } = usePexels(event.imageQuery);

  useEffect(() => {
    let ignore = false;
    if (!event.imageQuery) {
      return undefined;
    }
    fetchImages().then((fetched) => {
      if (!ignore) {
        setImages(fetched?.length ? fetched : event.images || []);
      }
    });
    return () => {
      ignore = true;
    };
  }, [event.imageQuery, event.images, fetchImages]);

  const thumb = images?.[0]?.thumb || images?.[0]?.large2x;

  return (
    <button
      type="button"
      onClick={() => navigate(`/festival/${event.id}`)}
      className={`flex w-full items-center text-left ${indent ? 'gap-3 py-2' : 'gap-4 py-3'}`}
    >
      <div
        className={`shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)] ${
          indent ? 'h-11 w-11' : 'h-[60px] w-[60px]'
        }`}
      >
        {thumb ? <img src={thumb} alt={event.title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold text-[var(--color-text-primary)] ${indent ? 'text-sm' : 'text-base'}`}>{event.title}</p>
        <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
          {event.type} · {event.month}
        </p>
      </div>
    </button>
  );
}

function MapEventGroup({ event, children }) {
  return (
    <div>
      <MapEventRow event={event} />
      {children.length > 0 ? (
        <div className="ml-6 border-l-2 border-[var(--color-border)] pl-4">
          {children.map((child) => (
            <MapEventRow key={child.id} event={child} indent />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SheetEventRow({ event, onOpenDetail, indent = false }) {
  const [images, setImages] = useState(event.images || []);
  const { fetchImages } = usePexels(event.imageQuery);

  useEffect(() => {
    let ignore = false;
    if (!event.imageQuery) {
      return undefined;
    }
    fetchImages().then((fetched) => {
      if (!ignore) {
        setImages(fetched?.length ? fetched : event.images || []);
      }
    });
    return () => {
      ignore = true;
    };
  }, [event.imageQuery, event.images, fetchImages]);

  const thumb = images?.[0]?.thumb || images?.[0]?.large2x;

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(event)}
      className={`flex w-full items-center text-left ${indent ? 'gap-2.5 py-2' : 'gap-3 py-3'}`}
    >
      <div className={`shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)] ${indent ? 'h-10 w-10' : 'h-12 w-12'}`}>
        {thumb ? <img src={thumb} alt={event.title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate font-bold text-[var(--color-text-primary)] ${indent ? 'text-xs' : 'text-sm'}`}>{event.title}</p>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{event.month}</p>
      </div>
    </button>
  );
}

// Search is a flat shortcut to the detail page, not a map interaction — no
// series clustering here (that's a browse-list concept), just the same flat
// month-grouped list style as CalendarView's search results.
function SearchResultRow({ event, isMobile, onOpenDetail }) {
  const navigate = useNavigate();
  const [images, setImages] = useState(event.images || []);
  const { fetchImages } = usePexels(event.imageQuery, event.id);

  useEffect(() => {
    let ignore = false;
    if (!event.imageQuery) {
      return undefined;
    }
    fetchImages().then((fetched) => {
      if (!ignore) {
        setImages(fetched?.length ? fetched : event.images || []);
      }
    });
    return () => {
      ignore = true;
    };
  }, [event.imageQuery, event.images, fetchImages]);

  const thumb = images?.[0]?.thumb || images?.[0]?.large2x;

  const handleClick = () => {
    if (isMobile) {
      onOpenDetail(event);
    } else {
      navigate(`/festival/${event.id}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center gap-4 border-b border-[var(--color-border)] py-3 text-left last:border-b-0"
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)]">
        {thumb ? <img src={thumb} alt={event.title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-[var(--color-text-primary)]">{event.title}</p>
        <span className="mt-1 inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--color-border)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
          {event.type}
        </span>
      </div>
      <div className="shrink-0 text-sm text-[var(--color-text-secondary)]">{formatDateLabel(event)}</div>
    </button>
  );
}

function SearchResultsOverlay({ events, isMobile, onOpenDetail }) {
  const grouped = groupByMonth(events);
  const months = MONTH_ORDER.filter((month) => grouped[month]?.length);

  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-center text-sm text-[var(--color-text-secondary)]">No events match your search</p>
      </div>
    );
  }

  return (
    <div className={`h-full space-y-8 overflow-y-auto ${isMobile ? 'px-6 pt-6 pb-24' : ''}`}>
      {months.map((month) => (
        <section key={month}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{month}</h2>
            <span className="text-sm text-[var(--color-text-secondary)]">{grouped[month].length} events</span>
          </div>
          <div>
            {grouped[month].map((event) => (
              <SearchResultRow key={event.id} event={event} isMobile={isMobile} onOpenDetail={onOpenDetail} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function SheetEventGroup({ event, children, onOpenDetail }) {
  return (
    <div>
      <SheetEventRow event={event} onOpenDetail={onOpenDetail} />
      {children.length > 0 ? (
        <div className="ml-5 border-l-2 border-[var(--color-border)] pl-3">
          {children.map((child) => (
            <SheetEventRow key={child.id} event={child} onOpenDetail={onOpenDetail} indent />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// Shared bottom-sheet shell — used identically by the state-tap sheet and
// the "Full List" sheet, so both really are the same component, just fed
// different (title, groupedEvents) pairs. `expandable` opts a sheet into
// scroll-up-to-expand-to-full-screen (only the Full List sheet uses this —
// the state-tap sheet keeps its original fixed collapsed height).
function MapListSheet({ title, groupedEvents, onOpenDetail, onClose, expandable = false }) {
  const [expanded, setExpanded] = useState(false);
  const touchStartYRef = useRef(null);

  const handleWheel = (event) => {
    if (!expandable || expanded) return;
    if (event.deltaY > 0) {
      event.preventDefault();
      setExpanded(true);
    }
  };

  const handleTouchStart = (event) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (event) => {
    if (!expandable || expanded || touchStartYRef.current === null) return;
    const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
    if (touchStartYRef.current - currentY > 12) {
      setExpanded(true);
    }
  };

  return (
    <>
      <motion.div
        key="sheet-backdrop"
        className="fixed inset-0 z-[45] bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="sheet"
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.15)] transition-[top,height] duration-300 ease-out"
        style={expanded ? { top: 0, height: '100vh' } : { top: 'auto', maxHeight: '60vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex shrink-0 justify-center pt-3">
          <div className="h-1.5 w-10 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-3">
          <h2 className="min-w-0 truncate text-base font-bold text-[var(--color-text-primary)]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 rounded-full border border-[var(--color-border)] p-1.5">
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
          </button>
        </div>
        <div
          className="flex-1 divide-y divide-[var(--color-border)] overflow-y-auto px-5 pb-4 pt-2"
          style={{ maxHeight: expanded ? 'calc(100vh - 72px)' : 'calc(60vh - 72px)' }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {groupedEvents.map(({ event, children }) => (
            <SheetEventGroup key={event.id} event={event} children={children} onOpenDetail={onOpenDetail} />
          ))}
        </div>
      </motion.div>
    </>
  );
}

function IndiaMap({ topology, isMobile, countForState, selectedStateKey, onSelectState, onHover, onMove, onLeave }) {
  if (!topology) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-text-secondary)]">
        Loading map…
      </div>
    );
  }

  const scale = isMobile ? 920 : 820;

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ center: [82, 22], scale }}
      width={500}
      height={550}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Geographies geography={topology}>
        {({ geographies }) =>
          geographies
            .filter((geo) => resolveStateKey(geo.properties.st_nm) !== ANDAMAN_NICOBAR_KEY)
            .map((geo) => {
              const rawName = geo.properties.st_nm;
              const stateKey = resolveStateKey(rawName);
              const isSelected = selectedStateKey === stateKey;
              const palette = isSelected ? SELECTED_COLOR : getStateColor(stateKey);
              const count = countForState(stateKey);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={(event) => !isMobile && onHover(event, rawName, count)}
                  onMouseMove={(event) => !isMobile && onMove(event)}
                  onMouseLeave={() => !isMobile && onLeave()}
                  onClick={() => onSelectState(stateKey, rawName, count)}
                  style={{
                    default: { fill: palette.fill, stroke: palette.stroke, strokeWidth: 0.75, outline: 'none' },
                    hover: { fill: palette.fill, stroke: palette.stroke, strokeWidth: 1.25, outline: 'none', cursor: 'pointer' },
                    pressed: { fill: palette.fill, stroke: palette.stroke, outline: 'none' },
                  }}
                />
              );
            })
        }
      </Geographies>
    </ComposableMap>
  );
}

export default function MapView({ events, onOpenDetail, headerHeight, bottomBarHeight, search = '', onSheetVisibilityChange }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [topology, setTopology] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fullListOpen, setFullListOpen] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  const isSearching = search.trim().length > 0;

  // Any bottom sheet (state-tap or Full List) reaches far enough up the
  // screen to overlap the FAB's fixed bottom-right position — z-index alone
  // just lets the FAB float visually on top of it, so the parent needs to
  // unmount the FAB entirely while either sheet is open.
  const isAnySheetOpen = (sheetOpen && !!selectedState && !isSearching) || (fullListOpen && !isSearching);
  const onSheetVisibilityChangeRef = useRef(onSheetVisibilityChange);
  onSheetVisibilityChangeRef.current = onSheetVisibilityChange;

  useEffect(() => {
    onSheetVisibilityChangeRef.current?.(isAnySheetOpen);
  }, [isAnySheetOpen]);

  useEffect(() => {
    return () => onSheetVisibilityChangeRef.current?.(false);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let ignore = false;

    fetch(TOPOJSON_URL)
      .then((response) => response.json())
      .then((data) => {
        if (ignore) {
          return;
        }
        setTopology({ ...data, objects: { states: data.objects.states } });

        const matched = [];
        const unmatched = [];
        data.objects.states.geometries.forEach((geo) => {
          const rawName = geo.properties.st_nm;
          const key = resolveStateKey(rawName);
          (CANONICAL_STATE_KEYS.has(key) ? matched : unmatched).push(rawName);
        });
        console.log(`[MapView] matched ${matched.length}/${matched.length + unmatched.length} state names`, { matched, unmatched });
        if (unmatched.length) {
          console.warn('[MapView] unmatched state names:', unmatched);
        }
      })
      .catch((error) => console.error('[MapView] failed to load topology', error));

    return () => {
      ignore = true;
    };
  }, []);

  const countForState = (stateKey) => getEventsForState(events, stateKey).length;

  const selectedEvents = useMemo(() => {
    if (!selectedState) {
      return null;
    }
    return getEventsForState(events, selectedState.key);
  }, [events, selectedState]);

  const groupedSelectedEvents = useMemo(() => groupWithSeriesChildren(selectedEvents || []), [selectedEvents]);
  const groupedAllEvents = useMemo(() => groupWithSeriesChildren(events), [events]);

  const handleSelectState = (stateKey, rawName, count) => {
    if (isMobile) {
      if (count === 0) {
        return;
      }
      setSelectedState({ key: stateKey, name: rawName });
      setSheetOpen(true);
      return;
    }
    setSelectedState((current) => (current?.key === stateKey ? null : { key: stateKey, name: rawName }));
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setSelectedState(null);
  };

  const closeFullList = () => setFullListOpen(false);

  const mapProps = {
    topology,
    isMobile,
    countForState,
    selectedStateKey: selectedState?.key ?? null,
    onSelectState: handleSelectState,
    onHover: (event, name, count) => setTooltip({ x: event.clientX, y: event.clientY, name, count }),
    onMove: (event) => setTooltip((current) => (current ? { ...current, x: event.clientX, y: event.clientY } : current)),
    onLeave: () => setTooltip(null),
  };

  if (isMobile) {
    return (
      <motion.div key="map-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
        <div
          className="fixed inset-x-0 z-30 flex flex-col bg-white"
          style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px - ${bottomBarHeight}px)` }}
        >
          {isSearching ? (
            <SearchResultsOverlay events={events} isMobile onOpenDetail={onOpenDetail} />
          ) : (
            <>
              <div className="relative min-h-0 flex-1 px-4 pb-8 pt-6">
                <div className="flex h-full w-full items-center justify-center">
                  <IndiaMap {...mapProps} />
                </div>
                <button
                  type="button"
                  onClick={() => setFullListOpen(true)}
                  className="absolute right-4 top-3 text-xs font-bold text-[var(--color-brand)]"
                >
                  Full List
                </button>
              </div>
              <div className="flex shrink-0 items-center justify-center px-5 py-3">
                <p className="text-center text-xs text-[var(--color-text-secondary)]">Tap any state to explore</p>
              </div>
            </>
          )}
        </div>

        <AnimatePresence>
          {sheetOpen && selectedState && !isSearching ? (
            <MapListSheet
              key="state-sheet"
              title={`${selectedState.name} · ${countForState(selectedState.key)} ${countForState(selectedState.key) === 1 ? 'event' : 'events'}`}
              groupedEvents={groupedSelectedEvents}
              onOpenDetail={onOpenDetail}
              onClose={closeSheet}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {fullListOpen && !isSearching ? (
            <MapListSheet
              key="full-list-sheet"
              title={`All Festivals · ${events.length} ${events.length === 1 ? 'event' : 'events'}`}
              groupedEvents={groupedAllEvents}
              expandable
              onOpenDetail={onOpenDetail}
              onClose={closeFullList}
            />
          ) : null}
        </AnimatePresence>
      </motion.div>
    );
  }

  const selectedCount = selectedState ? countForState(selectedState.key) : null;

  return (
    <motion.div
      key="map-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6"
    >
      <div className="min-w-0">
        {isSearching ? (
          <SearchResultsOverlay events={events} isMobile={false} onOpenDetail={onOpenDetail} />
        ) : (
          <>
            {selectedState ? (
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="min-w-0 truncate text-base font-bold text-[var(--color-text-primary)]">
                  {selectedState.name} · {selectedCount} {selectedCount === 1 ? 'event' : 'events'}
                </h2>
                <button type="button" onClick={() => setSelectedState(null)} aria-label="Clear state filter" className="shrink-0 rounded-full border border-[var(--color-border)] p-1.5">
                  <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
                </button>
              </div>
            ) : null}

            {selectedState && selectedEvents.length === 0 ? (
              <p className="py-12 text-center text-sm text-[var(--color-text-secondary)]">No events found for {selectedState.name}</p>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {(selectedState ? groupedSelectedEvents : groupedAllEvents).map(({ event, children }) => (
                  <MapEventGroup key={event.id} event={event} children={children} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sticky flex flex-col" style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px)` }}>
        <p className="shrink-0 pb-2 text-center text-xs text-[var(--color-text-secondary)]">Tap any state to explore</p>
        <div className="min-h-0 flex-1">
          <IndiaMap {...mapProps} />
        </div>
      </div>

      {tooltip ? (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border-[0.5px] border-[var(--color-border)] bg-white px-[10px] py-[6px] text-xs text-[var(--color-text-primary)] shadow-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 12, transform: 'translateY(-100%)' }}
        >
          {tooltip.name} · {tooltip.count} {tooltip.count === 1 ? 'event' : 'events'}
        </div>
      ) : null}
    </motion.div>
  );
}
