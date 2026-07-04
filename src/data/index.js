/**
 * src/data/index.js — single source of truth for festival data.
 *
 * Every screen imports from here instead of the raw JSON. This joins
 * content.json (the cultural content) with dates.json (all date logic)
 * and hands back objects in the SAME shape the old
 * india-cultural-calendar.json had — each event still has `.date` and
 * `.dateType` — so existing components need only a one-line import change.
 *
 * `.date` is now COMPUTED (next occurrence from today), not stored.
 * `.dateInfo` carries the full detail (occurrences, seasonal window,
 * span flags, anchor) for anything that wants the rich version.
 *
 * Default export = the flat events array (parent + all children),
 * so `import events from './data/index.js'` is a drop-in replacement
 * for `import events from './data/india-cultural-calendar.json'`.
 */
import content from "./content.json";
import dates from "./dates.json";
import { buildEvents, eventsForYear, findById } from "./dateResolver.js";

// Computed once at module load. `.date` reflects "today" at load time —
// fine for a session; if you ever need it recomputed mid-session, call
// buildEvents(content, dates) again.
export const events = buildEvents(content, dates);

/** Concrete dated instances for the calendar grid, for a given year. */
export function getEventsForYear(year) {
  return eventsForYear(content, dates, year);
}

/** Resolve one event by id with its parent/children links (for detail pages). */
export function getById(id) {
  return findById(events, id);
}

/** Raw data, exposed for the rare case a component needs the unjoined source. */
export { content, dates };

export default events;
