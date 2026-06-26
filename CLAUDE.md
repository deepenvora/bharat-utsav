# Bharat Utsav — CLAUDE.md
> Read this at the start of every session. Keep it updated after every milestone commit.

---

## Project Identity

**What it is:** Web + mobile responsive app to explore Indian festivals, holidays, awareness days, and state foundation days. Cultural depth, real imagery, clean editorial feel.

**Brand:**
- Name: Bharat Utsav
- Tagline: Festivals, holidays & traditions across India
- Brand color: `#F71079` (hot pink)
- Font: Bricolage Grotesque (all weights via Google Fonts)
- Tone: Warm, cultural, editorial. Not touristy. Not government.

**Working style:**
- Plan → Show me → Execute. Never skip to execution.
- Batch related changes. Never commit half-done work.
- Explain in plain language before making changes.
- Self-verify (build + run + check) before showing results.
- Never decide unilaterally on design decisions — flag and ask.

---

## Stack

- **Framework:** Vite + React (JS, not TS)
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Icons:** Hugeicons (stroke-rounded)
- **Images:** Pexels API (key in `.env` as `VITE_PEXELS_API_KEY`, gitignored)
- **Data:** `src/data/india-cultural-calendar.json` (155 entries)
- **Deploy target:** Netlify (not yet deployed)
- **No localStorage.** Theme/state in React state only.
- **No dark mode.**
- **No TypeScript.**

---

## Design Tokens (CSS variables — never hardcode values)

```css
--color-brand: #F71079;
--color-brand-dark: #C4005E;
--color-text-primary: #1A1A1A;
--color-text-secondary: #6B6B6B;
--color-text-on-brand: #FFFFFF;
--color-bg: #FFFFFF;
--color-card-bg: #FFFFFF;
--color-border: #E5E5E5;
--font-display: 'Bricolage Grotesque', sans-serif;
--font-body: 'Bricolage Grotesque', sans-serif;
--radius-card: 12px;
--radius-pill: 999px;
--shadow-card: 0 2px 12px rgba(0,0,0,0.08);
--transition-default: 0.2s ease;
```

---

## Data Schema (155 entries in `india-cultural-calendar.json`)

```json
{
  "id": "string",
  "title": "string",
  "type": "Festival | State Foundation Day | Awareness Day | National Holiday | ...",
  "state": ["string"],
  "dateType": "fixed | floating",
  "date": "MM-DD or null",
  "month": "string (month name, for floating dates)",
  "whyCelebrated": "string",
  "howCelebrated": "string",
  "traditions": ["string"],
  "foods": ["string"],
  "keywords": ["string"],
  "religion": "string (shown in UI as 'Tradition')",
  "season": "string",
  "imageQuery": "string (used for Pexels API fetch)",
  "verificationStatus": "string"
}
```

**Image enrichment (to be added via script):**
- `images[]` — array of up to 10 Pexels photo objects: `{ url, thumb, alt, photographer }`
- Script: `scripts/enrich-images.js` — runs once, outputs enriched JSON, never re-fetches if already populated.

**Content enrichment (to be added via Wikipedia script):**
- `aboutLong` — 300–500 word string from Wikipedia extract
- `whyCelebratedLong`, `howCelebratedLong` — expanded versions
- Script: `scripts/enrich-wikipedia.js`

---

## Image Strategy

**Pexels API:**
- Endpoint: `GET https://api.pixabay.com/v1/search?query={imageQuery}+india+festival&per_page=10&orientation=landscape`
- Actually Pexels: `GET https://api.pexels.com/v1/search?query={imageQuery}&per_page=10`
- Auth header: `Authorization: VITE_PEXELS_API_KEY`
- Cache fetched results in `src/cache/pexels-cache.json` (gitignored, rebuilt locally)
- Fallback: if < 3 images returned, show 1 hero + grey placeholder tiles in mosaic

**Per entry:**
- Request 10 images
- Store as `images[]` array with `{ id, url: src.large2x, thumb: src.small, alt, photographer }`
- First image = primary hero everywhere
- Images 1–5 = mosaic on web detail
- All images = gallery screen on mobile + web lightbox

---

## Routing

```
/                    → Home (Browse view, default Card)
/gallery/:id         → Mobile fullscreen gallery screen
```

**Detail view:** Full-page modal overlay on both web and mobile — NOT a separate route. Opens on card tap/click. Closes with X or Escape.

---

## Screen-by-Screen Spec

### HOME — Mobile

**Default state (hero visible):**
- Full-bleed hero image (Pexels, static `imageQuery: "india festival celebration"`)
- Dark gradient overlay (bottom 60%)
- Over image: "Bharat Utsav" (white, Bricolage Grotesque, bold, large) + tagline (white, smaller)
- Search bar (white, rounded-pill, mic icon right) + Filters pill — both overlaid on hero bottom
- Below hero: section-grouped card grid (2-col)
- Section headers: type label (e.g. "Festivals", "State Foundation Day") — bold, dark

**Scroll-up state (hero collapsed, sticky header):**
- Sticky top bar: "Bharat Utsav" in `#F71079` (Bricolage Grotesque, bold) | Search bar | Filters pill
- Background: white, subtle bottom border
- Transition: smooth collapse with Framer Motion

**Bottom of screen (always sticky):**
- Tab bar: Card | Calendar | Map
- Active tab: `#F71079` icon + label
- Inactive: `#6B6B6B`

**FAB:** Bottom-right, `#F71079` gradient to purple, sparkle icon (AI placeholder, no action yet)

---

### HOME — Web

**Default state (hero visible):**
- Full-bleed hero image (same static query as mobile)
- Dark gradient overlay
- Over image: "Bharat Utsav" (white, Bricolage Grotesque, bold, display size) + tagline (white)
- Below headline: wide search bar (white, rounded-pill) — full width, centered below text

**Scroll-up state (hero collapsed, sticky header):**
- Sticky top bar: "Bharat Utsav" logo left | Search bar center (medium width) | (no extra controls)
- Filters pill: left of card grid (below sticky header)
- View toggle (Card | Calendar | Map): right of card grid row, active = filled `#F71079` pill
- Transition: smooth collapse with Framer Motion

**Card grid:** 4-col on desktop, 2-col on tablet

**FAB:** Bottom-right, same as mobile

---

### DETAIL — Mobile + Web (Full-page Modal)

**Trigger:** Tap/click any card → modal slides up (mobile) or fades in (web) over full viewport

**Hero zone:**
- Full-bleed image (first of `images[]`) with dark gradient overlay
- White overlay text: title (bold, large) + meta (type · state · month/date, smaller, muted white)
- Mini carousel: swipe left/right through first 3 images. Dot indicators below (3 dots max).
- "View all X photos" pill bottom-right of hero → navigates to Gallery screen

**Close:**
- X button top-right (always visible)
- Mobile: also back-swipe gesture
- Escape key on web

**Scroll-up behavior (within modal):**
- Hero collapses to sticky bar inside modal: title + subtext + X icon
- Content scrolls beneath

**Content sections (below hero, white bg):**
- AI Summary box (bordered card, labelled "AI Summary" — placeholder text for now, slot for future)
- Accordion sections: About | Why is it Celebrated | How is it Celebrated | Traditions | Food
  - About: expanded by default
  - Others: collapsed by default
  - Smooth Framer Motion expand/collapse
- "Related Festivals" section at bottom
  - Mobile: 2-col grid
  - Web: 4-col horizontal scroll row

---

### GALLERY SCREEN — Mobile

**Route:** `/gallery/:id`

**Layout:**
- Black background full screen
- Top: back arrow (←) left | counter pill center ("1 / 10") 
- Main: fullscreen image, vertically centered, object-fit contain
- Below image: caption text (Pexels alt text, white, small)
- Bottom: horizontal thumbnail filmstrip (scrollable, active thumb highlighted with pink border)
- Swipe left/right to navigate

**Navigation:** Back arrow → returns to detail modal (preserve modal state)

---

### WEB DETAIL — Mosaic + Lightbox

**Mosaic layout (replaces single hero):**
- Left: 1 large primary image (60% width)
- Right: 2×2 grid of images 2–5 (40% width)
- "View all X photos" pill top-right of mosaic → opens lightbox overlay

**Lightbox overlay:**
- Full viewport, dark semi-transparent bg
- Large image center
- Prev/Next arrow buttons
- Counter top-right ("2 / 10")
- Thumbnail filmstrip right side (vertical, scrollable)
- X to close
- Keyboard: ← → to navigate, Escape to close

---

### CALENDAR VIEW

- Reuses Browse shell (same sticky header, same bottom tab)
- Content: events grouped by month, vertical scroll
- Each month = section header + list of events (not card grid)
- Sort control hidden in Calendar view
- No hero image in calendar

---

### MAP VIEW

- Reuses Browse shell
- Content: India map with state-level pins (count of events per state)
- Tap pin → filter cards to that state
- Sort control hidden in Map view
- Placeholder implementation acceptable for V1

---

## Search & Filter

**Search:** Matches `title` + `keywords[]` only. Real-time, no submit button needed.

**Filters panel:**
- Mobile: full-page overlay
- Web: side-sheet
- Filter dimensions: Type | Month | Tradition (religion field) | State
- Multi-select: AND across dimensions, OR within
- Applied filters shown as dismissible pills below search bar

**Sort (Card view only, hidden in Calendar + Map):**
- Options: A–Z | Z–A | Month (Jan→Dec) | Month (Dec→Jan)
- Sort control sits beside Filters pill

---

## Component Architecture

```
src/
  components/
    layout/
      Header.jsx          # Responsive sticky header (hero + collapsed states)
      BottomTabBar.jsx    # Mobile only, Card/Calendar/Map
      FAB.jsx             # Floating action button
    home/
      HeroSection.jsx     # Full-bleed image + overlay text + search
      CardGrid.jsx        # Responsive grid, section-grouped
      FestivalCard.jsx    # Card component (image, title, month)
    detail/
      DetailModal.jsx     # Full-page modal wrapper
      ImageMosaic.jsx     # Web: 1-large + 2x2 grid
      ImageCarousel.jsx   # Mobile: swipeable hero with dots
      AccordionSection.jsx
      RelatedFestivals.jsx
    gallery/
      GalleryScreen.jsx   # Mobile fullscreen gallery + filmstrip
      Lightbox.jsx        # Web fullscreen lightbox overlay
    filters/
      FiltersPanel.jsx    # Side-sheet (web) / full-page (mobile)
      SortControl.jsx
      ActiveFilterPills.jsx
    calendar/
      CalendarView.jsx
    map/
      MapView.jsx
  hooks/
    usePexels.js          # Fetch + cache Pexels images
    useWikipedia.js       # Fetch Wikipedia content
    useSearch.js
    useFilters.js
  data/
    india-cultural-calendar.json
  cache/
    pexels-cache.json     # gitignored
  scripts/
    enrich-images.js      # One-time: adds images[] to each entry
    enrich-wikipedia.js   # One-time: adds long-form content to each entry
```

---

## Breakpoints

- Mobile: < 768px
- Tablet: 768px–1024px (2-col grid, simplified header)
- Desktop: > 1024px (4-col grid, full nav)

---

## Enrichment Scripts (run once locally, output into JSON)

### `scripts/enrich-images.js`
- Reads `india-cultural-calendar.json`
- For each entry without `images[]`: calls Pexels API with `imageQuery`
- Stores up to 10 results as `images[]`
- Writes enriched JSON back
- Skips entries that already have `images[]` (safe to re-run)

### `scripts/enrich-wikipedia.js`
- For each entry: calls Wikipedia REST API `/page/summary/{title}`
- Stores `extract` as `aboutLong`
- Falls back to existing `whyCelebrated` if no Wikipedia match
- Skips already-enriched entries

---

## Build Order (do not skip steps, do not cross batches mid-session)

1. **Foundation** — Vite+React init, Tailwind config, Bricolage Grotesque via Google Fonts, CSS tokens, routing (React Router), data import, Pexels hook + cache
2. **Enrichment scripts** — `enrich-images.js` + `enrich-wikipedia.js` (run locally, verify output)
3. **Home screen** — Hero (mobile + web), scroll-collapse sticky header, card grid (section-grouped), bottom tab bar (mobile), FAB stub
4. **Detail modal** — Full-page modal, mobile image carousel (3 images + dots), web mosaic, accordion sections, AI Summary slot, Related row, scroll-collapse sticky bar inside modal
5. **Gallery screen** — Mobile: `/gallery/:id` route, fullscreen + filmstrip. Web: Lightbox overlay
6. **Search + Filters** — Search (title + keywords), filters panel (mobile full-page / web side-sheet), active filter pills, sort control (Card view only)
7. **Calendar view** — Month-grouped list, reuses shell
8. **Map view** — State pins, placeholder acceptable
9. **AI features** — Summary generation via Claude API (FAB activation)
10. **Netlify deploy**

---

## Commit Protocol

- Commit at end of each batch above
- Message format: `feat: [batch name] — [what was done]`
- Always include updated CLAUDE.md in commit
- Never commit with build errors
- Never commit half-applied changes

---

## Git

- Repo: to be initialized fresh
- `.gitignore` must include: `.env`, `src/cache/pexels-cache.json`, `node_modules`

---

## What was ported from v1 (do not rebuild)

- `india-cultural-calendar.json` — copy directly, no changes needed to base schema
- Pexels fetch logic — port the hook, not the UI
- Filter/search logic — port the hooks, not the UI

---

## Current Status

- **Home screen:** complete (hero, scroll-collapse sticky header, card grid, search, filters, bottom tab bar, FAB stub).
- **Detail page — web:** complete. Standalone route `/festival/:id` (`src/components/detail/DetailPage.jsx`), not a modal — card click on viewport ≥768px navigates here via `useNavigate`. Mosaic, AI summary box, conditional accordions (Traditions/Food only for `type === 'Festival'`), Related Festivals, X button calls `navigate(-1)` (browser-back semantics). `src/components/home/FestivalCard.jsx` branches on `window.innerWidth >= 768` to decide route-push vs. modal-open.
- **Detail modal — mobile:** complete, unchanged. `src/components/detail/DetailModal.jsx` still owns the full-page slide-up modal (carousel + dots, accordions, related) for viewport <768px; `App.jsx`'s `HomePage` still renders it, now only ever triggered from mobile.
- **Gallery / Lightbox:** built — `src/components/gallery/Lightbox.jsx` (web fullscreen overlay, prev/next, counter, vertical filmstrip, ←/→/Escape) and `src/components/gallery/GalleryScreen.jsx` (`/gallery/:id` route, black fullscreen, back arrow + counter, swipeable image, horizontal filmstrip) both exist and are wired — `DetailPage.jsx`'s "View all photos" opens `Lightbox` directly; `ImageCarousel.jsx`'s pill navigates to `/gallery/:id`. **Known gap:** `GalleryScreen`'s back arrow (`navigate(-1)`) doesn't restore `DetailModal`'s open state on mobile (state not lifted to URL); not yet polished end-to-end.
- **Wikipedia enrichment:** script exists (`scripts/enrich-wikipedia.js`) and has been run — all 155 entries have `aboutLong`. Needs a rate-limit fix before any future re-run (no throttling currently).
- **Pexels enrichment:** script exists (`scripts/enrich-images.js`), not yet run on the full dataset — images are still fetched live per-card via `usePexels.js` rather than pre-populated `images[]`.
- `src/hooks/usePexels.js` — throttles concurrent Pexels requests (max 15 in flight) to avoid 429s; image objects carry `large2x`/`original` sizes. Cache read/write hits `src/cache/pexels-cache.json` but nothing in `vite.config.js` persists the PUT yet, so caching is a no-op across reloads.
- **Calendar view:** complete — `src/components/calendar/CalendarView.jsx`. `App.jsx`'s `HomePage` now branches on `activeTab`: `'calendar'` renders `CalendarView`, everything else (including `'map'`, still a stub) falls through to `CardGrid`. Events grouped by month in `MONTH_ORDER` (Jan→Dec), empty months hidden entirely; within a month, fixed-date events sort by day ascending and floating (no-date) events sort after, showing the month name as their label instead of a day. Each row reuses the `FestivalCard`/`usePexels` image-fetch + `window.innerWidth >= 768` navigate-vs-modal click pattern. Both `CardGrid` and `CalendarView` are wrapped in a `motion.div` fade so switching tabs animates. No Sort control exists yet (Batch 6 never built one), so "hide sort in Calendar" is a no-op for now.

**1140px grid constraint:** the `max-w-[1140px] mx-auto px-6` container (currently on `App.jsx`'s `<main>`) must be applied to ALL views — Calendar, Map, and any new pages follow the same container. Calendar view confirmed to inherit it correctly (no separate container of its own).

**Next to build:**
- Batch 8 — Map view (SVG, `react-simple-maps`, state pins) — also needs to replace the `CardGrid` fallback currently used for the `'map'` tab
- Batch 9 — AI Summary + FAB chat (Claude API)
- Batch 10 — Gallery/Lightbox polish (fix the back-navigation gap above)
- Netlify deploy
