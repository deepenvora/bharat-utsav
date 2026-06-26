import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePexels } from '../../hooks/usePexels';

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDay(event) {
  const day = event.date ? parseInt(event.date.split('-')[2], 10) : NaN;
  return Number.isNaN(day) ? null : day;
}

function groupByMonth(events) {
  const grouped = {};
  events.forEach((event) => {
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

function CalendarEventRow({ event, onOpenDetail }) {
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

  const handleClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      navigate(`/festival/${event.id}`);
    } else {
      onOpenDetail(event);
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

export default function CalendarView({ events, onOpenDetail }) {
  const grouped = groupByMonth(events);
  const months = MONTH_ORDER.filter((month) => grouped[month]?.length);

  if (events.length === 0) {
    return (
      <motion.div
        key="calendar-empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex min-h-[300px] items-center justify-center"
      >
        <p className="text-center text-[var(--color-text-secondary)]">No events match your filters</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="calendar-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-8 pb-24"
    >
      {months.map((month) => (
        <section key={month}>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{month}</h2>
            <span className="text-sm text-[var(--color-text-secondary)]">{grouped[month].length} events</span>
          </div>
          <div>
            {grouped[month].map((event) => (
              <CalendarEventRow key={event.id} event={event} onOpenDetail={onOpenDetail} />
            ))}
          </div>
        </section>
      ))}
    </motion.div>
  );
}
