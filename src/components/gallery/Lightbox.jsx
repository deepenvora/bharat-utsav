import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';

export default function Lightbox({ images, title, onClose }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        setIndex((value) => Math.min(value + 1, images.length - 1));
      } else if (event.key === 'ArrowLeft') {
        setIndex((value) => Math.max(value - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [images.length, onClose]);

  if (images.length === 0) {
    return null;
  }

  const current = images[index];

  return (
    <div className="fixed inset-0 z-[80] flex bg-black/95" onClick={onClose}>
      <div className="relative flex flex-1 items-center justify-center p-8" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.8} />
        </button>
        <span className="absolute right-6 top-20 text-sm font-semibold text-white/80">
          {index + 1} / {images.length}
        </span>

        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex((value) => value - 1)}
            className="absolute left-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={1.8} />
          </button>
        ) : null}

        <img src={current.original || current.large2x} alt={current.alt || title} className="max-h-full max-w-full object-contain" />

        {index < images.length - 1 ? (
          <button
            type="button"
            onClick={() => setIndex((value) => value + 1)}
            className="absolute right-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={1.8} />
          </button>
        ) : null}
      </div>

      <div className="hidden w-28 shrink-0 flex-col gap-2 overflow-y-auto bg-black/40 p-3 md:flex" onClick={(event) => event.stopPropagation()}>
        {images.map((image, i) => (
          <button
            key={image.id || i}
            type="button"
            onClick={() => setIndex(i)}
            className={`aspect-square overflow-hidden rounded-md border-2 ${i === index ? 'border-[var(--color-brand)]' : 'border-transparent'}`}
          >
            <img src={image.thumb || image.large2x} alt={image.alt || title} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
