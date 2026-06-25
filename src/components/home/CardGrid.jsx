import FestivalCard from './FestivalCard';

function groupEvents(events) {
  return events.reduce((acc, event) => {
    const type = event.type?.trim() || 'Other';
    const group = acc[type] || [];
    group.push(event);
    acc[type] = group;
    return acc;
  }, {});
}

export default function CardGrid({ events, onOpenDetail }) {
  const grouped = groupEvents(events);
  const groupCount = Object.keys(grouped).length;

  console.log(`[CardGrid] groups found: ${groupCount}`);

  return (
    <div className="space-y-8 pb-24">
      {Object.entries(grouped).map(([type, items]) => (
        <section key={type}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{type}</h2>
            <span className="text-sm text-[var(--color-text-secondary)]">{items.length} events</span>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {items.map((event) => (
              <FestivalCard key={event.id} event={event} onOpenDetail={onOpenDetail} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
