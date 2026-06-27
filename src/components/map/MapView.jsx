import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import allEvents from '../../data/india-cultural-calendar.json';
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

function MapEventRow({ event }) {
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
    <button type="button" onClick={() => navigate(`/festival/${event.id}`)} className="flex w-full items-center gap-4 py-3 text-left">
      <div className="h-[60px] w-[60px] shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)]">
        {thumb ? <img src={thumb} alt={event.title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-[var(--color-text-primary)]">{event.title}</p>
        <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
          {event.type} · {event.month}
        </p>
      </div>
    </button>
  );
}

function SheetEventRow({ event, onOpenDetail }) {
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
    <button type="button" onClick={() => onOpenDetail(event)} className="flex w-full items-center gap-3 py-3 text-left">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)]">
        {thumb ? <img src={thumb} alt={event.title} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{event.title}</p>
        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{event.month}</p>
      </div>
    </button>
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

export default function MapView({ events, onOpenDetail, headerHeight, bottomBarHeight }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [topology, setTopology] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tooltip, setTooltip] = useState(null);

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
        <div className="fixed inset-x-0 z-30 bg-white" style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px - ${bottomBarHeight}px)` }}>
          <IndiaMap {...mapProps} />
        </div>

        <AnimatePresence>
          {sheetOpen && selectedState ? (
            <>
              <motion.div
                key="sheet-backdrop"
                className="fixed inset-0 z-[45] bg-black/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSheet}
              />
              <motion.div
                key="sheet"
                className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] rounded-t-2xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <div className="flex justify-center pt-3">
                  <div className="h-1.5 w-10 rounded-full bg-[var(--color-border)]" />
                </div>
                <div className="flex items-center justify-between gap-3 px-5 pt-3">
                  <h2 className="min-w-0 truncate text-base font-bold text-[var(--color-text-primary)]">
                    {selectedState.name} · {countForState(selectedState.key)} {countForState(selectedState.key) === 1 ? 'event' : 'events'}
                  </h2>
                  <button type="button" onClick={closeSheet} aria-label="Close" className="shrink-0 rounded-full border border-[var(--color-border)] p-1.5">
                    <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
                  </button>
                </div>
                <div className="max-h-[calc(60vh-72px)] divide-y divide-[var(--color-border)] overflow-y-auto px-5 pb-4 pt-2">
                  {selectedEvents?.map((event) => (
                    <SheetEventRow key={event.id} event={event} onOpenDetail={onOpenDetail} />
                  ))}
                </div>
              </motion.div>
            </>
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
            {(selectedState ? selectedEvents : events).map((event) => (
              <MapEventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      <div className="sticky" style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px)` }}>
        <IndiaMap {...mapProps} />
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
