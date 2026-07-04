#!/usr/bin/env node
/**
 * audit-dates.js — READ-ONLY. Writes nothing. Run in your repo root.
 *
 * Answers, for the ENTIRE dataset in one pass:
 *   1. Which entries resolve to a real date, which fall back to a month,
 *      and why (seasonal-by-design vs. a variable that failed to match).
 *   2. For every variable entry that came back empty or partial, what did
 *      Calendarific ACTUALLY call that holiday? — so we can fix all the
 *      alias misses in a single batch instead of one id at a time.
 *
 * Usage:  node scripts/audit-dates.js
 * Needs CALENDARIFIC_API_KEY (or VITE_...) in .env — same key as fetch-dates.
 * If no key/network, Part 1 still runs; Part 2 (alias suggestions) is skipped.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "src", "data");

// --- .env loader (no dependency) ------------------------------------------
(function loadEnv() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
})();
const API_KEY = process.env.CALENDARIFIC_API_KEY || process.env.VITE_CALENDARIFIC_API_KEY;

const content = JSON.parse(fs.readFileSync(path.join(DATA, "content.json"), "utf8"));
const dates = JSON.parse(fs.readFileSync(path.join(DATA, "dates.json"), "utf8"));
const byId = Object.fromEntries(content.map((c) => [c.id, c]));

const TOTAL_YEARS = 25; // 2026..2050

// --- Part 1: categorize every entry ---------------------------------------
const cat = {
  fixed: [], variableFull: [], variablePartial: [], variableEmpty: [],
  seasonalAnchor: [], seasonalNoMatch: [], series: [], periodic: [], other: [],
};

for (const id of Object.keys(dates)) {
  const rec = dates[id];
  const occCount = rec.occurrences ? Object.keys(rec.occurrences).length : 0;
  if (rec.type === "fixed") cat.fixed.push(id);
  else if (rec.type === "series") cat.series.push(id);
  else if (rec.type === "periodic") cat.periodic.push(id);
  else if (rec.type === "variable") {
    if (occCount === 0) cat.variableEmpty.push(id);
    else if (occCount < TOTAL_YEARS) cat.variablePartial.push({ id, occCount });
    else cat.variableFull.push(id);
  } else if (rec.type === "seasonal") {
    if (occCount > 0) cat.seasonalAnchor.push(id);
    else cat.seasonalNoMatch.push(id);
  } else cat.other.push(id);
}

console.log("========== PART 1: DATE HEALTH (all 160 entries) ==========\n");
console.log(`fixed (rule-based, good to 2050):        ${cat.fixed.length}`);
console.log(`variable — full 25/25 years:             ${cat.variableFull.length}`);
console.log(`variable — PARTIAL (has date, gaps):     ${cat.variablePartial.length}`);
console.log(`variable — EMPTY (0 occ = shows month):  ${cat.variableEmpty.length}   <-- the bug class`);
console.log(`seasonal — with 2026 anchor:             ${cat.seasonalAnchor.length}`);
console.log(`seasonal — no match (by design):         ${cat.seasonalNoMatch.length}`);
console.log(`series parent:                           ${cat.series.length}`);
console.log(`periodic:                                ${cat.periodic.length}`);

if (cat.variablePartial.length) {
  console.log("\n--- PARTIAL variables (resolve now, but thin in far years) ---");
  cat.variablePartial
    .sort((a, b) => a.occCount - b.occCount)
    .forEach((x) => console.log(`   ${x.id.padEnd(34)} ${x.occCount}/25 years`));
}

if (cat.variableEmpty.length) {
  console.log("\n--- EMPTY variables (these are what show a month, not a date) ---");
  cat.variableEmpty.forEach((id) =>
    console.log(`   ${id.padEnd(34)} aliases tried: ${(dates[id].aliases || []).join(", ")}`)
  );
} else {
  console.log("\nNo empty variables — every variable entry resolved. Nothing to alias-fix.");
}

// --- Part 2: what does Calendarific actually call the unresolved ones? -----
function normalize(s) {
  return String(s).toLowerCase().replace(/[()]/g, " ").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}
const STOPWORDS = new Set([
  "puja", "festival", "day", "hindu", "india", "indian", "national",
  "new", "year", "start", "end", "of", "the", "and",
]);
function tokens(s) {
  return new Set(normalize(s).split(" ").filter((t) => t && !STOPWORDS.has(t)));
}
function score(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const sa = na.replace(/ /g, ""), sb = nb.replace(/ /g, "");
  if (sa === sb) return 0.95;

  // Windowed containment: compare `a` against sliding 1-2 word windows of
  // `b` (and vice versa), not the whole string. This lets a short precise
  // name ("Chhath") match inside a long descriptive one ("Chhat Puja
  // (Pratihar Sashthi/Surya Sashthi)") without a generic short word like
  // "rama" being able to hide inside an unrelated long string — because
  // the window itself must be a comparably-sized chunk, not a full-length
  // ratio against the whole string.
  const shortStr = sa.length <= sb.length ? sa : sb;
  const longWords = (sa.length <= sb.length ? nb : na).split(" ").filter(Boolean);
  if (shortStr.length >= 4) {
    for (let w = 1; w <= 2; w++) {
      for (let i = 0; i + w <= longWords.length; i++) {
        const window = longWords.slice(i, i + w).join("");
        const shorter = Math.min(shortStr.length, window.length);
        const longer = Math.max(shortStr.length, window.length);
        if (shorter / longer >= 0.7 && (window.includes(shortStr) || shortStr.includes(window))) {
          return 0.75;
        }
      }
    }
  }

  const ta = tokens(a), tb = tokens(b);
  if (ta.size === 0 || tb.size === 0) return 0; // pure-stopword seeds can't match
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  return inter >= 2 ? inter / union : 0; // require 2+ meaningful shared words
}

async function part2() {
  const targets = [...cat.variableEmpty, ...cat.variablePartial.map((x) => x.id)];
  if (!targets.length) { console.log("\nPart 2 skipped — nothing unresolved."); return; }
  if (!API_KEY) {
    console.log("\n========== PART 2 SKIPPED — no API key in .env ==========");
    console.log("Add CALENDARIFIC_API_KEY and re-run to get alias suggestions.");
    return;
  }

  // one fetch, representative near-term year with best coverage
  const YEAR = 2027;
  console.log(`\n========== PART 2: ALIAS SUGGESTIONS (from real ${YEAR} data) ==========`);
  let holidays = [];
  try {
    const res = await fetch(`https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=IN&year=${YEAR}`);
    const json = await res.json();
    holidays = (json?.response?.holidays || []).map((h) => h.name);
  } catch (e) {
    console.log("Fetch failed:", e.message);
    return;
  }
  console.log(`(${holidays.length} holiday names pulled for ${YEAR})\n`);

  for (const id of targets) {
    const meta = byId[id] || {};
    const seeds = [...(dates[id].aliases || []), meta.title].filter(Boolean);
    const ranked = holidays
      .map((name) => ({ name, s: Math.max(...seeds.map((seed) => score(seed, name))) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3)
      .filter((c) => c.s > 0.25);

    console.log(`${id}`);
    console.log(`   title: ${meta.title}`);
    if (ranked.length) {
      ranked.forEach((c) => console.log(`   candidate: "${c.name}"  (score ${c.s.toFixed(2)})`));
    } else {
      console.log(`   NO candidate > 0.25 — likely genuinely absent -> reclassify to seasonal`);
    }
    console.log("");
  }
  console.log("Suggested-alias review: high score = add that exact name as an alias and re-run");
  console.log("fetch-dates.js. No candidate = move to seasonal. Nothing was modified.");
}

part2();
