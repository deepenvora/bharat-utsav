import { useMemo } from 'react';

const MAX_CONCURRENT_REQUESTS = 15;

// In-memory only (no localStorage, per project rule) — persists for the SPA
// session, resets on a hard reload. Keyed by cacheId when provided (e.g. a
// festival's stable id), else by the imageQuery string itself.
const memoryCache = new Map();

let activeRequestCount = 0;
const requestQueue = [];

function runThrottled(task) {
  return new Promise((resolve, reject) => {
    const run = () => {
      activeRequestCount += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          activeRequestCount -= 1;
          const next = requestQueue.shift();
          if (next) {
            next();
          }
        });
    };

    if (activeRequestCount < MAX_CONCURRENT_REQUESTS) {
      run();
    } else {
      requestQueue.push(run);
    }
  });
}

export function usePexels(imageQuery, cacheId) {
  return useMemo(() => {
    if (!imageQuery) {
      return { fetchImages: async () => [] };
    }

    const key = cacheId || imageQuery.trim();

    return {
      fetchImages: async () => {
        if (memoryCache.has(key)) {
          return memoryCache.get(key);
        }

        const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
        if (!apiKey) {
          return [];
        }

        try {
          const response = await runThrottled(() =>
            fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(imageQuery.trim())}&per_page=10`, {
              headers: { Authorization: apiKey },
            }),
          );

          if (!response.ok) {
            return [];
          }

          const data = await response.json();
          const images = (data.photos || []).slice(0, 10).map((photo) => ({
            id: photo.id,
            url: photo.src?.large2x,
            large2x: photo.src?.large2x,
            original: photo.src?.original,
            thumb: photo.src?.small,
            alt: photo.alt || 'Pexels image',
            photographer: photo.photographer,
          }));

          const normalized = images.length >= 3 ? images : images.slice(0, 1);
          memoryCache.set(key, normalized);
          return normalized;
        } catch {
          return [];
        }
      },
    };
  }, [imageQuery, cacheId]);
}
