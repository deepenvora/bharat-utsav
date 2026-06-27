import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import events from '../../data/india-cultural-calendar.json';
import { usePexels } from '../../hooks/usePexels';
import ImageMosaic from './ImageMosaic';
import AccordionSection from './AccordionSection';
import RelatedFestivals from './RelatedFestivals';
import Lightbox from '../gallery/Lightbox';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = events.find((item) => item.id === id);
  const [images, setImages] = useState([]);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const heroRef = useRef(null);
  const { fetchImages } = usePexels(event?.imageQuery);

  useEffect(() => {
    if (!event) {
      return undefined;
    }
    let isActive = true;
    setImages([]);
    setScrolledPastHero(false);
    setLightboxOpen(false);
    window.scrollTo(0, 0);

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
      if (keyEvent.key === 'Escape' && !lightboxOpen) {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [event, navigate, lightboxOpen]);

  useEffect(() => {
    if (!event) {
      return undefined;
    }
    const handleScroll = () => {
      if (!heroRef.current) {
        return;
      }
      const heroBottom = heroRef.current.offsetTop + heroRef.current.offsetHeight;
      setScrolledPastHero(window.scrollY > heroBottom - 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [event]);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <button type="button" onClick={() => navigate('/')} className="text-sm font-semibold text-[var(--color-text-primary)]">
          Back to home
        </button>
      </div>
    );
  }

  const isFestival = event.type === 'Festival';
  const meta = [event.type, event.state?.length ? event.state.join(', ') : null, event.month].filter(Boolean).join(' · ');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-white">
      <motion.div
        initial={false}
        animate={{ opacity: scrolledPastHero ? 1 : 0, y: scrolledPastHero ? 0 : -16 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: scrolledPastHero ? 'auto' : 'none' }}
        className="fixed inset-x-0 top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-white/95 px-8 py-4 backdrop-blur"
      >
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{event.title}</h2>
        <button type="button" onClick={() => navigate(-1)} className="rounded-full border border-[var(--color-border)] p-2">
          <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
        </button>
      </motion.div>

      <div ref={heroRef} className="mx-auto max-w-[1140px] px-8 pt-8">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{event.title}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{meta}</p>
          </div>
          <button type="button" onClick={() => navigate(-1)} className="rounded-full border border-[var(--color-border)] p-2">
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>
        <ImageMosaic
          images={images}
          title={event.title}
          onViewAll={() => {
            setLightboxIndex(0);
            setLightboxOpen(true);
          }}
          onImageClick={(index) => {
            setLightboxIndex(index);
            setLightboxOpen(true);
          }}
        />
      </div>

      <div className="mx-auto max-w-[1140px] px-8 py-6">
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
          {isFestival ? (
            <>
              <AccordionSection title="Traditions">
                {event.traditions?.length ? event.traditions.join(', ') : 'Details coming soon.'}
              </AccordionSection>
              <AccordionSection title="Food">
                {event.foods?.length ? event.foods.join(', ') : 'Details coming soon.'}
              </AccordionSection>
            </>
          ) : null}
        </div>

        <RelatedFestivals current={event} events={events} onSelect={(relatedEvent) => navigate(`/festival/${relatedEvent.id}`)} />
      </div>

      {lightboxOpen ? (
        <Lightbox images={images} title={event.title} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
      ) : null}
    </motion.div>
  );
}
