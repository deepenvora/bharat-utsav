import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { usePexels } from '../../hooks/usePexels';
import ImageMosaic from './ImageMosaic';
import ImageCarousel from './ImageCarousel';
import AccordionSection from './AccordionSection';
import RelatedFestivals from './RelatedFestivals';

export default function DetailModal({ event, events, onClose, onSelectEvent }) {
  const [images, setImages] = useState([]);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
  const scrollRef = useRef(null);
  const mobileHeroRef = useRef(null);
  const webHeroRef = useRef(null);
  const { fetchImages } = usePexels(event?.imageQuery);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!event) {
      return undefined;
    }
    let isActive = true;
    setImages([]);
    setScrolledPastHero(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }

    fetchImages().then((fetched) => {
      if (isActive) {
        setImages(fetched || []);
      }
    });

    return () => {
      isActive = false;
    };
  }, [event?.id, fetchImages]);

  useEffect(() => {
    if (!event) {
      return undefined;
    }
    const handleKeyDown = (keyEvent) => {
      if (keyEvent.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) {
    return null;
  }

  const meta = [event.type, event.state?.length ? event.state.join(', ') : null, event.month].filter(Boolean).join(' · ');

  const handleScroll = () => {
    const activeHero = mobileHeroRef.current?.offsetHeight ? mobileHeroRef.current : webHeroRef.current;
    if (!activeHero || !scrollRef.current) {
      return;
    }
    const heroBottom = activeHero.offsetTop + activeHero.offsetHeight;
    setScrolledPastHero(scrollRef.current.scrollTop > heroBottom - 80);
  };

  return (
    <motion.div
      initial={isMobile ? { y: '100%' } : { opacity: 0 }}
      animate={isMobile ? { y: 0 } : { opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col bg-white"
    >
      <motion.div
        initial={false}
        animate={{ opacity: scrolledPastHero ? 1 : 0, y: scrolledPastHero ? 0 : -16 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: scrolledPastHero ? 'auto' : 'none' }}
        className="absolute inset-x-0 top-0 z-10 hidden items-center justify-between border-b border-[var(--color-border)] bg-white/95 px-8 py-4 backdrop-blur md:flex"
      >
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{event.title}</h2>
        <button type="button" onClick={onClose} className="rounded-full border border-[var(--color-border)] p-2">
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
        </button>
      </motion.div>

      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        <div ref={mobileHeroRef} className="md:hidden">
          <ImageCarousel images={images} title={event.title} meta={meta} totalCount={images.length} onClose={onClose} />
        </div>

        <div ref={webHeroRef} className="hidden px-8 pt-8 md:block">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{event.title}</h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{meta}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full border border-[var(--color-border)] p-2">
              <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
            </button>
          </div>
          <ImageMosaic images={images} title={event.title} />
        </div>

        <div className="px-4 py-6 md:px-8">
          <div className="rounded-[16px] border border-[var(--color-border)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)]">AI Summary</p>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              AI-generated summary coming soon for {event.title}.
            </p>
          </div>

          <div className="mt-6">
            <AccordionSection title="About" defaultOpen>
              {event.aboutLong || event.whyCelebrated || 'Details coming soon.'}
            </AccordionSection>
            <AccordionSection title="Why is it Celebrated">
              {event.whyCelebratedLong || event.whyCelebrated || 'Details coming soon.'}
            </AccordionSection>
            <AccordionSection title="How is it Celebrated">
              {event.howCelebratedLong || event.howCelebrated || 'Details coming soon.'}
            </AccordionSection>
            <AccordionSection title="Traditions">
              {event.traditions?.length ? event.traditions.join(', ') : 'Details coming soon.'}
            </AccordionSection>
            <AccordionSection title="Food">
              {event.foods?.length ? event.foods.join(', ') : 'Details coming soon.'}
            </AccordionSection>
          </div>

          <RelatedFestivals current={event} events={events} onSelect={onSelectEvent} />
        </div>
      </div>
    </motion.div>
  );
}
