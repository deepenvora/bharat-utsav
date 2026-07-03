#!/usr/bin/env node
/**
 * fetch-dates.js
 *
 * Fetches India holidays from Calendarific for YEAR_START..YEAR_END,
 * matches results against the `aliases` on every "variable" entry in
 * dates.json, and fills in `occurrences`. Does NOT touch "fixed",
 * "seasonal", or "periodic" entries — those are already resolved or
 * are intentionally left without exact dates.
 *
 * Usage:
 *   1. Put dates.json (from split_data.py) in the same directory,
 *      or set DATES_JSON_PATH below.
 *   2. Ensure CALENDARIFIC_API_KEY is in your .env (same key you use
 *      for the rest of the app).
 *   3. node fetch-dates.js
 *   4. Read the printed report. Bucket-B matches are flagged — review
 *      them before trusting the output. Unresolved ids need manual
 *      research (Drik Panchang or similar) or should move to `seasonal`.
 *   5. dates.json is overwritten in place. Commit only after reviewing
 *      the report.
 *
 * Rate limits: free Calendarific tier = 1000 req/day. This script makes
 * one request per year (YEAR_END - YEAR_START + 1 requests total), so
 * even the full 2026-2050 range (25 requests) is well within budget.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- config ---------------------------------------------------------------
const DATES_JSON_PATH = path.join(__dirname, "..", "src", "data", "dates.json");
const YEAR_START = 2026;
const YEAR_END = 2050;
const COUNTRY = "IN";

// --- load .env manually (no dependency on the `dotenv` package) -----------
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let val = m[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const API_KEY =
  process.env.CALENDARIFIC_API_KEY || process.env.VITE_CALENDARIFIC_API_KEY;

if (!API_KEY) {
  console.error(
    "No CALENDARIFIC_API_KEY (or VITE_CALENDARIFIC_API_KEY) found in .env. " +
      "Add it — same pattern as your Pexels key — then re-run."
  );
  process.exit(1);
}

// --- helpers ----------------------------------------------------------------
function normalize(s) {
  return s
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Two-way substring match after normalization. Conservative on purpose —
// false negatives (unresolved, needs manual review) are preferred over
// false positives (wrong date silently written).
function isMatch(alias, holidayName) {
  const a = normalize(alias);
  const h = normalize(holidayName);
  if (!a || !h) return false;
  return a === h || h.includes(a) || a.includes(h);
}

async function fetchYear(year) {
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${COUNTRY}&year=${year}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Calendarific request failed for ${year}: HTTP ${res.status}`);
  }
  const json = await res.json();
  if (json?.meta?.code !== 200) {
    throw new Error(`Calendarific error for ${year}: ${JSON.stringify(json.meta)}`);
  }
  return json.response.holidays || [];
}

// --- main -------------------------------------------------------------------
async function main() {
  const dates = JSON.parse(fs.readFileSync(DATES_JSON_PATH, "utf8"));

  const variableIds = Object.keys(dates).filter(
    (id) => dates[id].type === "variable"
  );

  console.log(`Fetching Calendarific ${COUNTRY} holidays for ${YEAR_START}-${YEAR_END}...`);
  console.log(`Matching against ${variableIds.length} variable entries.\n`);

  const yearData = {}; // year -> holidays[]
  for (let year = YEAR_START; year <= YEAR_END; year++) {
    try {
      yearData[year] = await fetchYear(year);
      process.stdout.write(`  ${year}: ${yearData[year].length} holidays fetched\r`);
    } catch (err) {
      console.error(`\n  ${year}: FAILED — ${err.message}`);
      yearData[year] = [];
    }
  }
  console.log("\n\nMatching...\n");

  const report = { matchedFull: [], matchedPartial: [], unresolved: [], reviewBucketB: [] };

  for (const id of variableIds) {
    const entry = dates[id];
    const aliases = entry.aliases || [];
    const occurrences = {};

    for (let year = YEAR_START; year <= YEAR_END; year++) {
      const holidays = yearData[year] || [];
      const matches = holidays.filter((h) =>
        aliases.some((alias) => isMatch(alias, h.name))
      );
      if (matches.length === 0) continue;

      // If multiple matches (e.g. multi-day sequential entries under the
      // same alias), take the min/max date as a span.
      const isoDates = matches.map((m) => m.date.iso).sort();
      occurrences[year] = {
        start: isoDates[0],
        end: isoDates[isoDates.length - 1],
        matchedName: matches[0].name,
      };
    }

    const yearsMatched = Object.keys(occurrences).length;
    const totalYears = YEAR_END - YEAR_START + 1;

    entry.occurrences = occurrences;

    if (yearsMatched === 0) {
      entry.source = "unresolved";
      report.unresolved.push({ id, aliases });
    } else if (yearsMatched < totalYears) {
      entry.source = entry.bucket === "B" ? "partial-needs-review" : "partial-fetch";
      report.matchedPartial.push({ id, yearsMatched, totalYears });
      if (entry.bucket === "B") report.reviewBucketB.push(id);
    } else {
      entry.source = entry.bucket === "B" ? "fetched-needs-review" : "fetched";
      report.matchedFull.push({ id, yearsMatched });
      if (entry.bucket === "B") report.reviewBucketB.push(id);
    }
  }

  fs.writeFileSync(DATES_JSON_PATH, JSON.stringify(dates, null, 2));

  console.log("=== REPORT ===\n");
  console.log(`Fully matched (all ${YEAR_END - YEAR_START + 1} years):`, report.matchedFull.length);
  console.log(`Partially matched:`, report.matchedPartial.length);
  report.matchedPartial.forEach((r) =>
    console.log(`   - ${r.id}: ${r.yearsMatched}/${r.totalYears} years`)
  );
  console.log(`\nUnresolved (no match found — needs manual research or move to seasonal):`,
    report.unresolved.length);
  report.unresolved.forEach((r) => console.log(`   - ${r.id} (tried: ${r.aliases.join(", ")})`));

  console.log(`\nBucket B — REVIEW THESE BEFORE COMMIT (alias was uncertain):`,
    report.reviewBucketB.length);
  report.reviewBucketB.forEach((id) => console.log(`   - ${id}`));

  console.log("\ndates.json updated. Review the above before committing.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
