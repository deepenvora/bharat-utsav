import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import { getEventsForYear } from '../../data';
import { usePexels } from '../../hooks/usePexels';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAY_LABELS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MARKER_INFO_COPY =
  "Some festivals — like moon-based or regional ones — don't fall on the same date every year. We count them here too, even without an exact day, so you don't miss them.";

// Standard month-grid: leading/trailing cells carry real adjacent-month day
// numbers (mobile shows them grayed; desktop just doesn't render them).
function buildMonthGrid(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const startWeekday = new Date(year, month - 1, 1).getDay();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: daysInPrevMonth - startWeekday + 1 + i, inCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inCurrentMonth: true });
  }
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ day: trailing, inCurrentMonth: false });
    trailing++;
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function formatDateLabel(resolved, fallbackMonth) {
  if (resolved && resolved.start) {
    const parsed = new Date(`${resolved.start}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }
  return fallbackMonth || '';
}

function useLazyThumb(event) {
  const [images, setImages] = useState(event.images || []);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const { fetchImages } = usePexels(event.imageQuery, event.id);

  useEffect(() => {
    if (!ref.current || isVisible) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setIsVisible(true);
      },
      { rootMargin: '200px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    let ignore = false;
    if (!event.imageQuery || !isVisible) return undefined;
    fetchImages().then((fetched) => {
      if (!ignore) setImages(fetched?.length ? fetched : event.images || []);
    });
    return () => {
      ignore = true;
    };
  }, [event.imageQuery, event.images, fetchImages, isVisible]);

  const thumb = images?.[0]?.thumb || images?.[0]?.large2x;
  return { ref, thumb };
}

// Desktop sidebar card — thumbnail, pink-caps month label, title, plain-text type.
function DesktopEventCard({ event, monthLabel, onClick }) {
  const { ref, thumb } = useLazyThumb(event);
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3 text-left"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)]">
        {thumb ? <img src={thumb} alt={event.title} className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-[var(--color-border)]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-brand)]">{monthLabel}</p>
        <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">{event.title}</p>
        <p className="truncate text-xs text-[var(--color-text-secondary)]">{event.type}</p>
      </div>
    </button>
  );
}

// Mobile agenda card — thumbnail, title, pink pill type badge, date (or month) on the right.
function MobileEventCard({ event, resolved, onClick }) {
  const { ref, thumb } = useLazyThumb(event);
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3 text-left shadow-sm"
    >
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-border)]">
        {thumb ? <img src={thumb} alt={event.title} className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-[var(--color-border)]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-[var(--color-text-primary)]">{event.title}</p>
        <span className="mt-1 inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--color-brand)]/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-brand)]">
          {event.type}
        </span>
      </div>
      <div className="shrink-0 text-sm text-[var(--color-text-secondary)]">{formatDateLabel(resolved, event.month)}</div>
    </button>
  );
}

function MonthNavHeader({ monthLabel, onPrev, onNext, size = 'lg' }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className={size === 'lg' ? 'text-xl font-bold text-[var(--color-text-primary)]' : 'text-lg font-bold text-[var(--color-text-primary)]'}>
        {monthLabel}
      </h2>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={onPrev} aria-label="Previous month" className="rounded-full border border-[var(--color-border)] p-1.5">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={1.8} />
        </button>
        <button type="button" onClick={onNext} aria-label="Next month" className="rounded-full border border-[var(--color-border)] p-1.5">
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

// Hover works via CSS group-hover (desktop mouse); the onClick toggle covers
// mobile, where there's no hover at all. Both paths independently show/hide
// the same panel, so it works either way without device detection.
function InfoTooltip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="What are month markers?"
        className="flex h-4 w-4 items-center justify-center text-[var(--color-text-secondary)]"
      >
        <HugeiconsIcon icon={InformationCircleIcon} size={15} strokeWidth={1.8} />
      </button>
      <span
        className={`absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-3 text-xs leading-snug text-[var(--color-text-secondary)] shadow-lg group-hover:block ${
          open ? 'block' : 'hidden'
        }`}
      >
        {text}
      </span>
    </span>
  );
}

// The "+N more" popover is rendered via a portal into document.body and
// positioned with `fixed` (viewport coordinates from getBoundingClientRect),
// rather than as an absolutely-positioned descendant — every day cell has
// `overflow-hidden` (to clip the day content itself), which would otherwise
// clip the popover trying to escape it. A small close-delay lets the mouse
// travel from the trigger into the popover without it disappearing first.
function DesktopMonthGrid({ weeks, datedByDay, monthName, onEventClick }) {
  const [hoveredMore, setHoveredMore] = useState(null); // { day, events, rect } | null
  const closeTimeoutRef = useRef(null);

  const handleMoreEnter = (day, dayEvents, rect) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setHoveredMore({ day, events: dayEvents, rect });
  };
  const scheduleClose = () => {
    closeTimeoutRef.current = setTimeout(() => setHoveredMore(null), 150);
  };
  const cancelClose = () => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  return (
    <>
    <div
      className="flex-1 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]"
      style={{ display: 'grid', gridTemplateRows: `auto repeat(${weeks.length}, 1fr)` }}
    >
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-border)_35%,white)]">
        {WEEKDAY_LABELS_FULL.map((label) => (
          <div key={label} className="py-2 text-center text-sm font-medium text-[var(--color-text-secondary)]">
            {label}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell, ci) => {
            const dayEvents = cell.inCurrentMonth ? datedByDay[cell.day] || [] : [];
            const hasEvent = dayEvents.length > 0;
            const overflowCount = dayEvents.length - 2;
            return (
              <div
                key={ci}
                className={`overflow-hidden border-r border-b border-[var(--color-border)] p-1.5 last:border-r-0 ${wi === weeks.length - 1 ? 'border-b-0' : ''}`}
              >
                {cell.inCurrentMonth ? (
                  <>
                    <span className={`text-sm ${hasEvent ? 'font-bold text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'}`}>
                      {cell.day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          title={event.title}
                          onClick={() => onEventClick(event)}
                          className="block w-full truncate rounded bg-[var(--color-brand)]/10 px-1.5 py-0.5 text-left text-[11px] font-medium text-[var(--color-brand)]"
                        >
                          {event.title}
                        </button>
                      ))}
                      {overflowCount > 0 ? (
                        <button
                          type="button"
                          onMouseEnter={(e) => handleMoreEnter(cell.day, dayEvents, e.currentTarget.getBoundingClientRect())}
                          onMouseLeave={scheduleClose}
                          className="block w-full text-left text-[10px] text-[var(--color-text-secondary)]"
                        >
                          +{overflowCount} more
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
    {hoveredMore
      ? createPortal(
          <div
            className="fixed z-50 w-56 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-2 shadow-lg"
            style={{ left: hoveredMore.rect.left, top: hoveredMore.rect.bottom + 4 }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <span className="mb-1 block px-1 text-[11px] font-bold text-[var(--color-text-secondary)]">
              {monthName} {hoveredMore.day}
            </span>
            {hoveredMore.events.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => onEventClick(event)}
                className="block w-full truncate rounded px-1 py-1 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-brand)]/10"
              >
                {event.title}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null}
    </>
  );
}

function MobileMiniCalendar({ weeks, datedByDay }) {
  return (
    <div>
      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS_SHORT.map((label, i) => (
          <div key={i} className="py-2 text-center text-xs font-medium text-[var(--color-text-secondary)]">
            {label}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell, ci) => {
            const dayCount = cell.inCurrentMonth ? (datedByDay[cell.day] || []).length : 0;
            return (
              <div key={ci} className="flex flex-col items-center gap-1 py-2">
                <span className={`text-sm ${cell.inCurrentMonth ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-border)]'}`}>
                  {cell.day}
                </span>
                <span className="flex h-3 items-center gap-0.5">
                  {dayCount > 1 ? (
                    <span className="text-[9px] font-bold leading-none text-[var(--color-brand)]">{dayCount}</span>
                  ) : null}
                  {dayCount > 0 ? <span className="h-1 w-1 rounded-full bg-[var(--color-brand)]" /> : null}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function CalendarView({ events, onOpenDetail, headerHeight = 0 }) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const goPrev = () => {
    setViewDate(({ year, month }) => (month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }));
  };
  const goNext = () => {
    setViewDate(({ year, month }) => (month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }));
  };

  const yearEvents = useMemo(() => getEventsForYear(viewDate.year), [viewDate.year]);
  const resolvedById = useMemo(() => Object.fromEntries(yearEvents.map((e) => [e.id, e])), [yearEvents]);

  const monthName = MONTH_NAMES[viewDate.month - 1];

  const { dated, markers } = useMemo(() => {
    const datedList = [];
    const markerList = [];

    events.forEach((event) => {
      const resolved = resolvedById[event.id];
      if (resolved && (resolved.role === 'event' || resolved.role === 'span') && resolved.start) {
        const startYear = Number(resolved.start.slice(0, 4));
        const startMonth = Number(resolved.start.slice(5, 7));
        if (startYear === viewDate.year && startMonth === viewDate.month) {
          // Use the RESOLVED month for display, not content.json's static
          // .month field — some entries (e.g. Diwali's children) carry a
          // stale approximate label that can differ from their real date.
          datedList.push({ event, resolved, monthLabel: MONTH_NAMES[startMonth - 1] });
        }
        return;
      }
      if (event.month === monthName) {
        markerList.push({ event, resolved: resolved || null, monthLabel: event.month });
      }
    });

    datedList.sort((a, b) => a.resolved.start.localeCompare(b.resolved.start));
    markerList.sort((a, b) => a.event.title.localeCompare(b.event.title));
    return { dated: datedList, markers: markerList };
  }, [events, resolvedById, viewDate, monthName]);

  const combined = [...dated, ...markers];

  const datedByDay = useMemo(() => {
    const map = {};
    dated.forEach(({ event, resolved }) => {
      const day = Number(resolved.start.slice(8, 10));
      map[day] = map[day] || [];
      map[day].push(event);
    });
    return map;
  }, [dated]);

  const weeks = useMemo(() => buildMonthGrid(viewDate.year, viewDate.month), [viewDate]);

  const handleOpenEvent = (event) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      navigate(`/festival/${event.id}`);
    } else {
      onOpenDetail(event);
    }
  };

  if (isMobile) {
    return (
      <motion.div key="calendar-view-mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="pb-24">
        <MonthNavHeader monthLabel={`${monthName} ${viewDate.year}`} onPrev={goPrev} onNext={goNext} size="lg" />
        <div className="mt-3">
          <MobileMiniCalendar weeks={weeks} datedByDay={datedByDay} />
        </div>

        <h3 className="mb-3 mt-6 flex items-center gap-1.5 text-base font-bold text-[var(--color-text-primary)]">
          Events on {monthName.slice(0, 3)} ({combined.length})
          <InfoTooltip text={MARKER_INFO_COPY} />
        </h3>

        {combined.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-text-secondary)]">No events match your filters</p>
        ) : (
          <div className="space-y-3">
            {combined.map(({ event, resolved }) => (
              <MobileEventCard key={event.id} event={event} resolved={resolved} onClick={() => handleOpenEvent(event)} />
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div key="calendar-view-web" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="grid grid-cols-[280px_1fr] gap-8">
      <div className="overflow-y-auto pb-8 pr-1" style={{ height: `calc(100vh - ${headerHeight}px)` }}>
        <h2 className="flex items-center gap-1.5 text-lg font-bold text-[var(--color-text-primary)]">
          Events this month
          <InfoTooltip text={MARKER_INFO_COPY} />
        </h2>
        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{combined.length} events found</p>
        {combined.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-text-secondary)]">No events match your filters</p>
        ) : (
          <div className="space-y-3">
            {combined.map(({ event, monthLabel }) => (
              <DesktopEventCard key={event.id} event={event} monthLabel={monthLabel} onClick={() => handleOpenEvent(event)} />
            ))}
          </div>
        )}
      </div>

      <div className="sticky flex flex-col pb-8" style={{ top: headerHeight, height: `calc(100vh - ${headerHeight}px)` }}>
        <div className="mb-4 shrink-0">
          <MonthNavHeader monthLabel={`${monthName} ${viewDate.year}`} onPrev={goPrev} onNext={goNext} size="lg" />
        </div>
        <DesktopMonthGrid weeks={weeks} datedByDay={datedByDay} monthName={monthName} onEventClick={handleOpenEvent} />
      </div>
    </motion.div>
  );
}
