import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import events from '../../data/india-cultural-calendar.json';
import { usePexels } from '../../hooks/usePexels';

export default function GalleryScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = events.find((item) => item.id === id);
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const { fetchImages } = usePexels(event?.imageQuery);

  useEffect(() => {
    if (!event) {
      return undefined;
    }
    let isActive = true;
    fetchImages().then((fetched) => {
      if (isActive) {
        setImages(fetched || []);
      }
    });
    return () => {
      isActive = false;
    };
  }, [event?.id, fetchImages]);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -50 && index < images.length - 1) {
      setIndex((value) => value + 1);
    } else if (info.offset.x > 50 && index > 0) {
      setIndex((value) => value - 1);
    }
  };

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <button type="button" onClick={() => navigate('/')} className="text-sm font-semibold">
          Back to home
        </button>
      </div>
    );
  }

  const current = images[index];

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 py-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={1.8} />
        </button>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          {images.length ? `${index + 1} / ${images.length}` : '0 / 0'}
        </span>
        <span className="w-9" />
      </div>

      <motion.div
        className="flex-1"
        drag={images.length > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-full items-center justify-center px-4">
          {current ? (
            <img
              src={current.original || current.large2x}
              alt={current.alt || event.title}
              className="max-h-full max-w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="h-full w-full bg-white/5" />
          )}
        </div>
      </motion.div>

      {current?.alt ? <p className="px-4 pb-3 text-center text-sm text-white/70">{current.alt}</p> : null}

      <div className="flex gap-2 overflow-x-auto px-4 pb-6">
        {images.map((image, i) => (
          <button
            key={image.id || i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 ${i === index ? 'border-[var(--color-brand)]' : 'border-transparent'}`}
          >
            <img src={image.thumb || image.large2x} alt={image.alt || event.title} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
