# Bharat Utsav — dates pipeline handoff

Three files, drop into your repo:

- `content.json` → `src/data/content.json` (replaces the content half of `india-cultural-calendar.json`)
- `dates.json` → `src/data/dates.json` (all date logic lives here)
- `fetch-dates.js` → `scripts/fetch-dates.js`

## What's already done (no API needed)

- **70 fixed entries** — rules like `"01-26"`, derived straight from your
  original dataset's `date` field. Good to 2050 with zero API calls.
- **8 reclassified-fixed** (Uttarayan, Hornbill Festival, Sao Joao, Me-Dam-Me-Phi,
  Taj Mahotsav, Sangai Festival, Lokrang Festival, Khajuraho Dance Festival) —
  these were sitting in "Variable/undated" but actually recur on the same
  calendar date every year. Flagged `source: "estimated-needs-verification"`
  because I asserted the dates from general knowledge, not a primary source —
  spot-check these 8 before trusting them long-term.
- **33 seasonal entries** (Bucket C — tribal festivals, temple seasons, tourism
  events) — month-window only, no fake exact date. e.g. Theyyam → `{from: "12", to: "12"}`.
- **3 special cases**: Nanda Devi Raj Jat (`type: "periodic"`, 12-year interval —
  do NOT auto-generate yearly occurrences for this one), Bastar Dussehra
  (`type: "seasonal"`, 75-day span), Rann Utsav (`type: "seasonal"`, ~4-month window).
- **Diwali split into a series**: `diwali` (parent, `type: "series"`) +
  5 children (Dhanteras, Naraka Chaturdashi, Lakshmi Puja, Govardhan Puja,
  Bhai Dooj) each with their own `content.json` entry and `dates.json` alias
  set. Children are marked `needsEnrichment: true` — I wrote short factual
  descriptions from general knowledge, but they have **no `aboutLong`, no
  Pexels image pulled, no full traditions/foods list yet**. That's a separate
  enrichment pass (same wiki+Pexels pipeline you ran for the original 155),
  not done here — don't ship these pages as-is without running it.
- **55 variable entries** (43 Bucket A + 12 Bucket B) have alias lists ready
  but empty `occurrences: {}` — that's what the script fills in.

## What you run

```bash
cd "/path/to/bharat-utsav"
cp fetch-dates.js scripts/
# content.json and dates.json into src/data/
node scripts/fetch-dates.js
```

Needs `CALENDARIFIC_API_KEY` (or `VITE_CALENDARIFIC_API_KEY`) in your `.env` —
same key you already have. Script reads it directly, no new dependency.

It fetches India holidays for 2026–2050 (25 requests — free tier is 1000/day,
no rate-limit risk), matches against each variable entry's `aliases`, and
writes `occurrences` back into `dates.json` in place.

## What to review after it runs

The script prints a report:

- **Fully matched** — all 25 years resolved. Trust these for Bucket A ids.
- **Partially matched** — some years missing (Calendarific's forward
  projection for lunar festivals often thins out past ~2035–2040). Not
  broken, just incomplete — decide whether to backfill manually or leave gaps.
- **Unresolved** — no match at all. Either the alias needs a fix (edit
  `aliases` in `dates.json` and re-run) or the entry should move to `seasonal`.
- **Bucket B — review these** (~12 ids: Gangaur, Teej, Pandharpur Wari,
  Yaoshang, Bathukamma, Hareli, Karma Parab, Jagaddhatri Puja, Gugga Naumi,
  Masi Magam, Raja Parba, Shigmo). Matching worked, but I flagged these as
  uncertain aliases when I built the table — spot-check the matched date
  against what you know before trusting it.

**2050 accuracy note:** Calendarific returning a 2050 date doesn't mean it's
astronomically correct — some APIs use simplified forward-projection rules
for lunar festivals that drift over decades. Spot-check 2–3 far-out dates
(e.g. Diwali 2050, Holi 2050) against Drik Panchang once you have real output.
If they hold, trust the range. If they drift, we mark post-~2035 occurrences
as lower-confidence rather than presenting them as verified.

## Do not commit blind

Read the report, fix any Bucket-B aliases that look wrong, re-run if you
change `aliases`, then commit. `content.json` is untouched by this script —
only `dates.json` gets written.
