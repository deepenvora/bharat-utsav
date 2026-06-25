import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../src/data/india-cultural-calendar.json');

function loadEntries() {
  const raw = readFileSync(dataPath, 'utf8');
  return JSON.parse(raw);
}

function saveEntries(entries) {
  writeFileSync(dataPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function fetchImages(imageQuery) {
  const apiKey = process.env.VITE_PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_PEXELS_API_KEY is not set');
  }

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(imageQuery)}&per_page=10&orientation=landscape`,
    {
      headers: {
        Authorization: apiKey,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Pexels request failed with status ${response.status}`);
  }

  const data = await response.json();
  return (data.photos || []).slice(0, 10).map((photo) => ({
    id: photo.id,
    url: photo.src?.large2x,
    thumb: photo.src?.small,
    alt: photo.alt || 'Pexels image',
    photographer: photo.photographer,
  }));
}

async function main() {
  const entries = loadEntries();
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (Array.isArray(entry.images) && entry.images.length > 0) {
      skipped += 1;
      continue;
    }

    if (!entry.imageQuery) {
      skipped += 1;
      continue;
    }

    try {
      const images = await fetchImages(entry.imageQuery);
      entry.images = images;
      updated += 1;
      console.log(`✔ ${entry.title}`);
    } catch (error) {
      console.warn(`⚠ ${entry.title}: ${error.message}`);
      entry.images = [];
    }
  }

  saveEntries(entries);
  console.log(`Done. Updated ${updated} entries, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
