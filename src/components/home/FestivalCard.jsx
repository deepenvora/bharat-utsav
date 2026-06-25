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

  const image = images?.[0]?.thumb || images?.[0]?.url || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80';

  return (
    <button type="button" onClick={() => onOpenDetail(event)} className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-bg)] text-left shadow-[var(--shadow-card)]">
      <div className="aspect-[4/3] overflow-hidden">
        <img src={image} alt={event.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">{event.month}</p>
        <h3 className="mt-1 text-lg font-semibold text-[var(--color-text-primary)]">{event.title}</h3>
      </div>
    </button>
  );
}
