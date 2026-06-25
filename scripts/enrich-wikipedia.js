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

async function fetchWikipediaSummary(title) {
  const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  if (!response.ok) {
    throw new Error(`Wikipedia request failed with status ${response.status}`);
  }
  const data = await response.json();
  return data.extract || '';
}

async function main() {
  const entries = loadEntries();
  let updated = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (entry.aboutLong) {
      skipped += 1;
      continue;
    }

    const title = entry.title;
    if (!title) {
      skipped += 1;
      continue;
    }

    try {
      const summary = await fetchWikipediaSummary(title);
      entry.aboutLong = summary || entry.whyCelebrated || '';
      updated += 1;
      console.log(`✔ ${entry.title}`);
    } catch (error) {
      console.warn(`⚠ ${entry.title}: ${error.message}`);
      entry.aboutLong = entry.whyCelebrated || '';
    }
  }

  saveEntries(entries);
  console.log(`Done. Updated ${updated} entries, skipped ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
