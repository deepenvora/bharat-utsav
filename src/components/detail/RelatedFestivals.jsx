import FestivalCard from '../home/FestivalCard';

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function RelatedFestivals({ current, events, onSelect }) {
  const related = shuffle(
    events.filter((event) => event.id !== current.id && (event.type === current.type || event.month === current.month)),
  ).slice(0, 8);

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
