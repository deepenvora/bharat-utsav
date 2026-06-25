import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MicIcon, SearchIcon } from '@hugeicons/core-free-icons';
import { usePexels } from '../../hooks/usePexels';

const heroQuery = 'diwali rangoli holi india festival colorful';
const fallbackHeroImage = 'https://images.pexels.com/photos/1583339/pexels-photo-1583339.jpeg';

export default function HeroSection({ search, setSearch, onFocusSearch, sentinelRef, onOpenFilters }) {
  const [heroImage, setHeroImage] = useState(fallbackHeroImage);
  const { fetchImages } = usePexels(heroQuery);

  useEffect(() => {
    let isActive = true;

    const loadHeroImage = async () => {
      const images = await fetchImages();
      if (isActive && images[0]?.large2x) {
        setHeroImage(images[0].large2x);
      }
    };

    loadHeroImage();
    return () => {
      isActive = false;
    };
  }, [fetchImages]);

  return (
    <section className="relative h-[440px] overflow-hidden bg-[#120b09] md:h-[560px]">
      <img
        src={heroImage}
        alt="Colorful Indian festival celebration"
        onError={() => setHeroImage(fallbackHeroImage)}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
      <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-6 md:px-8 md:pb-0 lg:px-10">
        <div className="mx-auto flex max-w-[1140px] flex-col gap-4">
          <div className="max-w-3xl">
            <h1 className="text-[clamp(3rem,6vw,5.75rem)] font-black leading-[0.95] text-white">Bharat Utsav</h1>
            <p className="mt-3 text-[1.125rem] font-medium leading-6 text-white/90">
              Festivals, holidays & traditions across India
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-3 rounded-full border border-[var(--color-border)] bg-white px-4 py-3 shadow-lg">
              <HugeiconsIcon icon={SearchIcon} size={18} strokeWidth={1.8} className="text-[var(--color-text-secondary)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onFocus={onFocusSearch}
                placeholder="Search festivals"
                className="w-full border-none bg-transparent text-sm text-[var(--color-text-primary)] outline-none"
              />
              <HugeiconsIcon icon={MicIcon} size={18} strokeWidth={1.8} className="text-[var(--color-text-secondary)]" />
            </div>
            <button className="flex h-12 w-[92px] shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-sm" type="button" onClick={onOpenFilters}>
              Filters
            </button>
          </div>
        </div>
      </div>
      <div ref={sentinelRef} className="absolute bottom-0 left-0 h-px w-full" />
    </section>
  );
}
