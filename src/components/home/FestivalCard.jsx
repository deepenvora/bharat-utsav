import { useEffect, useState } from 'react';
import { usePexels } from '../../hooks/usePexels';

export default function FestivalCard({ event, onOpenDetail }) {
  const [images, setImages] = useState(event.images || []);
  const { fetchImages } = usePexels(event.imageQuery);

  useEffect(() => {
    let ignore = false;

    const loadImages = async () => {
      if (!event.imageQuery) {
        return;
      }

      const fetched = await fetchImages();
      if (!ignore) {
        setImages(fetched?.length ? fetched : event.images || []);
      }
    };

    loadImages();
    return () => {
      ignore = true;
    };
  }, [event.imageQuery, event.images, fetchImages]);

  const image = images?.[0]?.large2x;

  return (
    <button type="button" onClick={() => onOpenDetail(event)} className="group flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-bg)] text-left shadow-[var(--shadow-card)]">
      <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--color-border)]">
        {image ? (
          <img src={image} alt={event.title} className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">{event.month}</p>
        <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-[var(--color-text-primary)]">{event.title}</h3>
      </div>
    </button>
  );
}
