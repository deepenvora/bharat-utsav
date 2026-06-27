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

**No hero.** Page always starts with the sticky header.

- Sticky top bar: "Bharat Utsav" in `#F71079` (Bricolage Grotesque, bold) | Search bar | Filters pill — always visible, not scroll-dependent
- Below header: section-grouped card grid (2-col)
- Section headers: type label (e.g. "Festivals", "State Foundation Day") — bold, dark

**Bottom of screen (always sticky):**
- Tab bar: Card | Calendar | Map
- Active tab: `#F71079` icon + label
- Inactive: `#6B6B6B`

**FAB:** Bottom-right, `#F71079` gradient to purple, sparkle icon (AI placeholder, no action yet)

---

### HOME — Web

**No hero.** Page always starts with the sticky header.

- Sticky top bar: "Bharat Utsav" logo left | Search bar center (medium width)
- Sub-bar below it, always visible: Filters pill left of card grid | View toggle (Card | Calendar | Map) right, active = filled `#F71079` pill

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
      Header.jsx          # Always-visible sticky header (no hero, no scroll-collapse)
      BottomTabBar.jsx    # Mobile only, Card/Calendar/Map
      FAB.jsx             # Floating action button
    home/
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
    chat/
      ChatPanel.jsx        # Web: 320px slide-in panel, FAB-toggled
      ChatOverlay.jsx      # Mobile: full-screen modal, FAB-toggled
      ChatMessages.jsx     # Message bubbles + typing indicator (shared)
      ChatInput.jsx        # Pinned input row + send button (shared)
      StarterPills.jsx     # 4 suggestion pills, shown until first message (shared)
  hooks/
    usePexels.js          # Fetch + cache Pexels images
    useWikipedia.js       # Fetch Wikipedia content
    useChat.js            # Multi-turn chat state + direct Claude API call
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
9. **AI features** — local deterministic summary + keyword-search FAB chat (no external API)
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

- **Home screen:** complete — **hero removed entirely** (`HeroSection.jsx` deleted, no longer referenced anywhere). `App.jsx`'s `HomePage` now always renders the compact sticky `Header` (logo + search + Filters, plus the Card/Calendar/Map sub-bar on desktop) — there is no scroll-collapse state any more (the old `showCompactHeader`/`heroSentinelRef`/`IntersectionObserver` machinery was removed since nothing reads it). Search lives permanently in the sticky header bar; `<main>` always gets `headerHeight + 24` top padding to clear the fixed header. Card grid, filters, bottom tab bar, FAB stub all unchanged.
- **Detail page — web:** complete. Standalone route `/festival/:id` (`src/components/detail/DetailPage.jsx`), not a modal — card click on viewport ≥768px navigates here via `useNavigate`. Mosaic, AI summary box, conditional accordions (Traditions/Food only for `type === 'Festival'`), Related Festivals, X button calls `navigate(-1)` (browser-back semantics). `src/components/home/FestivalCard.jsx` branches on `window.innerWidth >= 768` to decide route-push vs. modal-open.
- **Detail modal — mobile:** complete, unchanged. `src/components/detail/DetailModal.jsx` still owns the full-page slide-up modal (carousel + dots, accordions, related) for viewport <768px; `App.jsx`'s `HomePage` still renders it, now only ever triggered from mobile.
- **Gallery / Lightbox:** built — `src/components/gallery/Lightbox.jsx` (web fullscreen overlay, prev/next, counter, vertical filmstrip, ←/→/Escape) and `src/components/gallery/GalleryScreen.jsx` (`/gallery/:id` route, black fullscreen, X button + centered counter, swipeable image, horizontal filmstrip) both exist and are wired — `DetailPage.jsx`'s "View all photos" opens `Lightbox` directly at index 0; clicking any individual mosaic image (`ImageMosaic.jsx`'s `onImageClick`) opens it at that image's index instead (`Lightbox` now takes an `initialIndex` prop). `GalleryScreen`'s header was a back arrow (`navigate(-1)`) — now an X (`handleClose`): web (`window.innerWidth >= 768`) goes to `/festival/:id`, mobile still does `navigate(-1)` back to whatever pushed the gallery route. **Known gap (mobile only):** `navigate(-1)` lands back on `/` but doesn't restore `DetailModal`'s open state (state not lifted to URL) — confirmed still present, out of scope for the X-button fix since mobile's `navigate(-1)` behavior was explicitly kept as-is.
- **Wikipedia enrichment:** script exists (`scripts/enrich-wikipedia.js`) and has been run — all 155 entries have `aboutLong`. Needs a rate-limit fix before any future re-run (no throttling currently).
- **Pexels enrichment:** script exists (`scripts/enrich-images.js`), not yet run on the full dataset — images are still fetched live per-card via `usePexels.js` rather than pre-populated `images[]`.
- `src/hooks/usePexels.js` — throttles concurrent Pexels requests (max 15 in flight) to avoid 429s; image objects carry `large2x`/`original` sizes. Cache read/write hits `src/cache/pexels-cache.json` but nothing in `vite.config.js` persists the PUT yet, so caching is a no-op across reloads.
- **Calendar view:** complete — `src/components/calendar/CalendarView.jsx`. `App.jsx`'s `HomePage` branches on `activeTab`: `'calendar'` → `CalendarView`, `'map'` → `MapView`, everything else → `CardGrid`. Events grouped by month in `MONTH_ORDER` (Jan→Dec), empty months hidden entirely; within a month, fixed-date events sort by day ascending and floating (no-date) events sort after, showing the month name as their label instead of a day. Each row reuses the `FestivalCard`/`usePexels` image-fetch + `window.innerWidth >= 768` navigate-vs-modal click pattern. `CardGrid`/`CalendarView`/`MapView` are each wrapped in a `motion.div` fade so switching tabs animates. No Sort control exists yet (Batch 6 never built one), so "hide sort in Calendar/Map" is a no-op for now.
- **Map view:** complete — `src/components/map/MapView.jsx`, using `react-simple-maps`. **Topology source deviates from an earlier ask**: `deldersveld/topojson`'s `countries/india/india-states.json` returns 404 (repo no longer exists) — swapped to `udit-001/india-maps-data`'s `topojson/india.json` (trimmed client-side to just its `states` object before passing to `Geographies`, since the file also bundles district-level boundaries). This source's `st_nm` property values are an exact 1:1 match with this dataset's `state[]` strings (36/36, zero unmatched — confirmed via the `[MapView] matched ...` console log on every load), so the `MATCH_MAP` alias table is present per spec but currently inert; keep it if the topology source ever changes. Pastel `STATE_COLORS` + pink-fallback + `#F71079` selected-state styling all keyed off normalized state names.
  - **Counting/filtering (corrected):** `getEventsForState` is a single predicate — `state[] contains that exact state key` (case-insensitive via `resolveStateKey`) — used identically for the tooltip count, the selected-state count, and the filtered list. `'All India'` entries are **not** auto-included anymore; an event only counts toward a state if that state is literally in its `state[]`. (An earlier version additively summed direct-state-count + All-India-count, which double-counted events tagged with both, e.g. Christmas/Good Friday, and inflated every state's count by the full All-India total ~41.)
  - **Andaman & Nicobar Islands excluded from the map**: filtered out of the `Geographies` render loop (`resolveStateKey(geo.properties.st_nm) !== 'andaman and nicobar islands'`) and explicitly deleted from the `STATE_COLORS` lookup (35 of the topology's 36 geometries render). Scoped to the map only — still a normal filterable state everywhere else (search, Filters panel, card/calendar views).
  - **Web:** 40/60 split panel inside the 1140px grid (`grid-cols-[minmax(0,2fr)_minmax(0,3fr)]` — plain `2fr_3fr` let a long selected-state header, e.g. "Dadra and Nagar Haveli and Daman and Diu", blow out the track and made the left-panel dividers bleed under the map; both the grid item and the header text now have `min-w-0`/`truncate`). Left column is a plain-flow scrollable list (all events by default, or the selected state's events only), right column is `position: sticky; top: headerHeight; height: calc(100vh - headerHeight)` holding the SVG, hover shows a cursor-following tooltip (state name + count), click toggles selection.
  - **Mobile:** `HomePage` measures `Header`'s and `BottomTabBar`'s rendered heights via `ResizeObserver` (matched by `data-app-header` / `data-app-bottom-tab-bar` attributes) and feeds them to `MapView` as `headerHeight`/`bottomBarHeight`. The fixed map container uses `top: headerHeight; height: calc(100vh - headerHeight - bottomBarHeight)` (measured `bottomBarHeight`, not a hardcoded value — BottomTabBar actually renders ~71px tall). Tapping a state opens a `framer-motion` spring bottom sheet (stiffness 300 / damping 30); tapping a zero-event state does nothing (no sheet); tapping the backdrop closes it. Desktop's empty state instead keeps the selection and shows "No events found for [State]" in the left panel — reachable via search/filters now that state counts no longer inherit All-India events by default.
  - `ComposableMap` projection: `scale: 820` (desktop), `scale: 920` (mobile) — different per platform via the existing `isMobile` flag, `width={500} height={550}`, **default `preserveAspectRatio` ("meet")**, no `overflow: hidden` on either container. History here: `scale: 900`/no-crop under-filled → tried `scale: 1300` + `preserveAspectRatio="xMidYMid slice"` to fill completely, but `slice` *crops* whichever dimension overflows, which clipped Andaman/the southern tip on short viewports → reverted to default `preserveAspectRatio` (never crops, only letterboxes) and tuned `scale` up from there to shrink the letterbox margin as much as possible without cropping. Mobile's `920` (vs. the `580` first tried) was tuned by measuring the rendered content bounding box against the SVG's box directly — `580` only filled ~59% of the container width on a narrow phone viewport, `920` fills ~94% while still keeping the whole country inside the box (verified: content bbox ⊆ svg bbox on both platforms).

**1140px grid constraint:** the `max-w-[1140px] mx-auto px-6` container (currently on `App.jsx`'s `<main>`) must be applied to ALL views — Calendar, Map, and any new pages follow the same container. Calendar and Map (desktop split-panel) both confirmed to inherit it correctly; Map's mobile full-bleed layer is a deliberate, spec'd exception (fixed, outside the padded container).

- **FAB chat:** complete — **rebuilt to be fully local, no Anthropic API call at all** (this replaces the original Claude-API-backed version: removed `fetch` to `https://api.anthropic.com/v1/messages`, the system-prompt builder, and the compact-database `useMemo` entirely). `useChat.js` now does keyword-based local search over the full `india-cultural-calendar.json` import: `extractKeywords(query)` lowercases the input, tokenizes on `[a-z0-9]+`, and strips a `STOP_WORDS` set (filler words like "tell", "me", "about", "which", "festival(s)", "celebrated", "significance", question words) so natural-language questions reduce to their meaningful terms (e.g. "What is the significance of Holi?" → `["holi"]`). `matchesKeyword(entry, keyword)` does case-insensitive substring matching against `title`/`keywords[]`/`state[]`/`whyCelebrated`/`religion`, plus exact match against `month`; `searchFestivals` returns entries matching ANY extracted keyword (OR), capped at 5. `generateLocalResponse` formats a single match as `**Title** (Month)\n\nwhyCelebrated\n\nhowCelebrated`, multiple matches as a bulleted list with bolded titles and an 80-char `whyCelebrated` snippet, and a fixed "couldn't find anything" string when zero match. `sendMessage` is now synchronous (no `async`/`try-catch` — local array filtering can't fail) and instant, same philosophy as the AI Summary box below. Verified live: zero network requests to `anthropic.com` fire (confirmed via a request listener), and all 4 starter pills — including full sentences like "Tell me about Onam" — now resolve to real results after the keyword-extraction step (without it, all 4 returned "couldn't find anything," since the original literal/substring design only matched short keyword-style input, not full questions).
  - **Known minor false-positive:** plain substring matching means a keyword can match inside an unrelated word (e.g. `"holi"` matches inside `"holistic"` in International Day of Yoga's `whyCelebrated`), so a Holi query can surface one unrelated result alongside the correct Holi entry. Not fixed — inherent to substring matching, the correct result still appears, and word-boundary matching wasn't requested.
  - `ChatMessages.jsx` updated to actually render this response format: added a safe `renderWithBold` helper (splits on `**...**`, wraps matches in `<strong>` — never `dangerouslySetInnerHTML`) and `whitespace-pre-line` on the bubble so `\n\n` produces real paragraph breaks. Previously the bubble rendered `{message.content}` as flat text, which would have shown literal asterisks and collapsed all line breaks.
  - The `'error'` message role/rendering in `ChatMessages.jsx` is now dead code in practice (local search can't throw) but left in place — harmless, decoupled, not worth removing for its own sake.
  - **Security flag from the old version is now moot**: no API key leaves the browser, no `anthropic.com` network call exists, so there's nothing to proxy before Netlify deploy for this feature. `VITE_ANTHROPIC_API_KEY` is no longer referenced anywhere in `src/` (confirmed via grep) — still sitting in `.env` (with its pre-existing accidental duplicate line) but currently unused by the app; harmless to leave, fine to clean up whenever.
  - FAB (`src/components/layout/FAB.jsx`) still takes `isOpen`/`onClick`, swaps `SparklesIcon` ↔ `Cancel01Icon`, `z-[60]` so it stays clickable above the chat panel/overlay (both `z-50`). `App.jsx`'s `HomePage` still picks `'panel'` vs `'overlay'` via a one-time `window.innerWidth < 768` check at the moment the FAB is clicked, stored in `chatMode` state. `<main>` gets `marginRight: 320` (web only) while the panel is open; FAB hides entirely while the mobile overlay is open.
  - Still no persistence — each panel/overlay open mounts a fresh `useChat()` instance, history resets between opens (unaffected by the rebuild).

- **AI Summary box:** complete — deterministic, zero-API summary, replacing the old "coming soon" placeholder. `src/utils/generateSummary.js` exports `generateSummary(entry)`: sentence 1 from the first 1–2 sentences of `aboutLong` (sentence-split on `.!?`, then truncated to ~150 chars with an ellipsis if the combined length runs over — falls back to the full `whyCelebrated` string if `aboutLong` is missing), sentence 2 is the first sentence of `howCelebrated`, sentence 3 (Festivals only) is the fixed template `"Known for traditions like {traditions[0]} and {traditions[1]}, and dishes such as {foods[0]}."` — only appended when `traditions.length >= 2` and `foods.length >= 1` (skipped gracefully otherwise, not partially rendered). Returns `''` if no fields are present. Wired identically into `DetailPage.jsx` (web) and `DetailModal.jsx` (mobile): both compute `const summary = generateSummary(event)` and wrap the AI Summary card in `{summary ? (...) : null}` so the whole bordered box (label + text) disappears rather than rendering empty. Verified against real entries: Diwali (Festival) → 3 sentences with traditions/food; Republic Day (National Holiday) → 2 sentences, no third; National Youth Day (Awareness Day) → 2 sentences. No entry in the current 155-row dataset has every relevant field empty, so the hide-when-empty path was confirmed via the pure function (returns `""` for a field-less object) plus a code-level check of the `{summary ? ... : null}` guard, not a live empty-card screenshot.

**Next to build:**
- Batch 10 — Gallery/Lightbox polish (fix the back-navigation gap above)
- Netlify deploy
