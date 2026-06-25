import { useState } from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

export default function ImageCarousel({ images, title, meta, totalCount, onClose }) {
  const slides = images.slice(0, 3);
  const [index, setIndex] = useState(0);

  const handleDragEnd = (_, info) => {
    if (info.offset.x < -50 && index < slides.length - 1) {
      setIndex((value) => value + 1);
    } else if (info.offset.x > 50 && index > 0) {
      setIndex((value) => value - 1);
    }
  };

  return (
    <div className="relative h-[380px] w-full overflow-hidden bg-[var(--color-border)]">
      <motion.div
        className="flex h-full w-full"
        drag={slides.length > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        animate={{ x: `-${index * 100}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {slides.length > 0 ? (
          slides.map((image, i) => (
            <div key={image.id || i} className="h-full w-full shrink-0">
              <img src={image.large2x || image.original} alt={image.alt || title} className="h-full w-full object-cover object-center" draggable={false} />
            </div>
          ))
        ) : (
          <div className="h-full w-full shrink-0 bg-[var(--color-border)]" />
        )}
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--color-text-primary)] shadow"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
      </button>

      <div className="absolute inset-x-4 bottom-16 text-white">
        <h2 className="text-2xl font-bold leading-tight">{title}</h2>
        <p className="mt-1 text-sm text-white/85">{meta}</p>
      </div>

      <div className="absolute inset-x-4 bottom-5 flex items-center justify-between">
        {slides.length > 1 ? (
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        ) : (
          <span />
        )}
        {totalCount > 0 ? (
          <button type="button" className="rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            View all {totalCount} photos
          </button>
        ) : null}
      </div>
    </div>
  );
}
