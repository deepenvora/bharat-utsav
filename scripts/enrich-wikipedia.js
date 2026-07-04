import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../src/data/content.json');

const DELAY_MS = 1200;
const SAVE_EVERY = 10;

function loadEntries() {
  const raw = readFileSync(dataPath, 'utf8');
  return JSON.parse(raw);
}

function saveEntries(entries) {
  writeFileSync(dataPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchSummaryByTitle(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.extract || null;
}

async function searchWikipedia(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' india')}&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
  const data = await res.json();
  const results = data?.query?.search;
  if (!results || results.length === 0) return null;
  return results[0].title;
}

async function main() {
  const entries = loadEntries();

  let countEnriched = 0;
  let countSkipped  = 0;
  let countNotFound = 0;
  let countErrors   = 0;
  let sinceLastSave = 0;

  for (const entry of entries) {
    // Already enriched — skip
    if (entry.aboutLong) {
      console.log(`~ ${entry.title} — already enriched, skipped`);
      countSkipped++;
      continue;
    }

    await delay(DELAY_MS);

    try {
      // 1. Direct title lookup
      let summary = await fetchSummaryByTitle(entry.title);

      // 2. Search fallback on 404
      if (summary === null) {
        await delay(DELAY_MS);
        const foundTitle = await searchWikipedia(entry.title);

        if (foundTitle) {
          await delay(DELAY_MS);
          summary = await fetchSummaryByTitle(foundTitle);
        }
      }

      if (summary) {
        const wordCount = summary.trim().split(/\s+/).length;
        entry.aboutLong = summary;
        console.log(`✓ ${entry.title} — added ${wordCount} words`);
        countEnriched++;
      } else {
        entry.aboutLong = '';
        console.log(`△ ${entry.title} — not found on Wikipedia`);
        countNotFound++;
      }
    } catch (err) {
      entry.aboutLong = '';
      console.log(`✗ ${entry.title} — error: ${err.message}`);
      countErrors++;
    }

    sinceLastSave++;
    if (sinceLastSave >= SAVE_EVERY) {
      saveEntries(entries);
      sinceLastSave = 0;
    }
  }

  // Final save for any remainder
  saveEntries(entries);

  console.log('');
  console.log(`Total: ${entries.length} | Enriched: ${countEnriched} | Skipped: ${countSkipped} | Not found: ${countNotFound} | Errors: ${countErrors}`);
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
