import { useMemo } from 'react';

const CACHE_PATH = '/src/cache/pexels-cache.json';

async function readCache() {
  try {
    const response = await fetch(CACHE_PATH);
    if (!response.ok) {
      return {};
    }
    return await response.json();
  } catch {
    return {};
  }
}

async function writeCache(cache) {
  try {
    const response = await fetch(CACHE_PATH, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cache, null, 2),
    });
    if (!response.ok) {
      console.warn('Unable to persist Pexels cache');
    }
  } catch {
    console.warn('Unable to persist Pexels cache');
  }
}

export function usePexels(imageQuery) {
  return useMemo(() => {
    if (!imageQuery) {
      return { fetchImages: async () => [] };
    }

    return {
      fetchImages: async () => {
        const cache = await readCache();
        const key = imageQuery.trim();
        const cached = cache[key];
        if (cached) {
          return cached;
        }

        const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
        if (!apiKey) {
          return [];
        }

        try {
          const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(key)}&per_page=10`, {
            headers: { Authorization: apiKey },
          });
          const data = await response.json();
          const images = (data.photos || []).slice(0, 10).map((photo) => ({
            id: photo.id,
            url: photo.src?.large2x,
            thumb: photo.src?.small,
            alt: photo.alt || 'Pexels image',
            photographer: photo.photographer,
          }));

          const normalized = images.length >= 3 ? images : images.slice(0, 1);
          const nextCache = { ...cache, [key]: normalized };
          await writeCache(nextCache);
          return normalized;
        } catch {
          return [];
        }
      },
    };
  }, [imageQuery]);
}
