import FestivalCard from '../home/FestivalCard';

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getRelatedEvents(current, events) {
  const others = events.filter((event) => event.id !== current.id);
  const byType = others.filter((event) => event.type === current.type);
  const byMonth = others.filter((event) => event.month === current.month);

  const primary = current.type === 'Festival' ? byMonth : byType;
  const secondary = current.type === 'Festival' ? byType : byMonth;

  const shuffledPrimary = shuffle(primary);
  const poolIds = new Set(shuffledPrimary.map((event) => event.id));
  const fill = [];
  if (shuffledPrimary.length < 4) {
    shuffle(secondary).forEach((event) => {
      if (!poolIds.has(event.id)) {
        fill.push(event);
        poolIds.add(event.id);
      }
    });
  }

  return [...shuffledPrimary, ...fill].slice(0, 4);
}

export default function RelatedFestivals({ current, events, onSelect }) {
  const related = getRelatedEvents(current, events);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <h3 className="mb-4 text-lg font-bold text-[var(--color-text-primary)]">Related Festivals</h3>
      <div className="grid grid-cols-2 gap-4 md:flex md:gap-4 md:overflow-x-auto md:pb-2">
        {related.map((event) => (
          <div key={event.id} className="md:w-[260px] md:shrink-0">
            <FestivalCard event={event} onOpenDetail={onSelect} />
          </div>
        ))}
      </div>
    </section>
  );
}
