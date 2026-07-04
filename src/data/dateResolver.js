/**
 * dateResolver.js — pure date logic for Bharat Utsav.
 *
 * No imports, no side effects: every function takes data in and returns
 * data out, so it can be tested in isolation. index.js wires the real
 * content.json + dates.json into these.
 *
 * The core job: content.json entries have NO date field anymore. This
 * module joins each content entry with its dates.json record and produces:
 *   - `date`      : computed next-occurrence ISO string (or null) — keeps
 *                   the OLD shape the existing components expect.
 *   - `dateType`  : mapped from the new `type` — also old-shape compat.
 *   - `dateInfo`  : the full resolved detail (occurrences, window, anchor,
 *                   span flags) for anything that wants the rich version.
 */

const MONTHS = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

// Build a YYYY-MM-DD string manually — never via Date.toISOString(), which
// shifts across timezones and causes off-by-one-day bugs.
function iso(year, month, day) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function todayParts(refDate) {
  const d = refDate || new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

// Is candidate (mm,dd) on or after today's (m,d)? (ignores year)
function onOrAfterToday(mm, dd, ref) {
  if (mm > ref.m) return true;
  if (mm < ref.m) return false;
  return dd >= ref.d;
}

// Map new `type` -> old `dateType` string the components switch on.
function mapDateType(type) {
  switch (type) {
    case "fixed": return "Fixed";
    case "variable": return "Variable";
    case "series": return "Variable";
    case "seasonal": return "Seasonal";
    case "periodic": return "Periodic";
    default: return "Unknown";
  }
}

/**
 * Resolve a single dates.json record into { dateType, date, dateInfo }.
 * `childResolver` lets a series parent compute its date from its children.
 */
function resolveOne(id, rec, refDate, childResolver) {
  const ref = todayParts(refDate);
  const dateType = mapDateType(rec.type);

  // --- fixed: rule is "MM-DD" or { start:"MM-DD", end:"MM-DD" } ---
  if (rec.type === "fixed") {
    let startMMDD, endMMDD;
    if (typeof rec.rule === "string") {
      startMMDD = endMMDD = rec.rule;
    } else {
      startMMDD = rec.rule.start;
      endMMDD = rec.rule.end;
    }
    const [sm, sd] = startMMDD.split("-").map(Number);
    const [em, ed] = endMMDD.split("-").map(Number);
    const year = onOrAfterToday(sm, sd, ref) ? ref.y : ref.y + 1;
    const start = iso(year, sm, sd);
    const end = iso(year, em, ed);
    return {
      dateType,
      date: start,
      dateInfo: {
        type: "fixed",
        start,
        end,
        isMultiDay: start !== end,
        source: rec.source,
      },
    };
  }

  // --- variable: occurrences keyed by year, each { start, end } ---
  if (rec.type === "variable") {
    const occ = rec.occurrences || {};
    const years = Object.keys(occ).sort();
    // next occurrence: first whose start >= today, else the last known
    let next = null;
    for (const y of years) {
      if (occ[y].start >= iso(ref.y, ref.m, ref.d)) { next = occ[y]; break; }
    }
    if (!next && years.length) next = occ[years[years.length - 1]];
    return {
      dateType,
      date: next ? next.start : null,
      dateInfo: {
        type: "variable",
        start: next ? next.start : null,
        end: next ? next.end : null,
        isMultiDay: next ? next.start !== next.end : false,
        occurrences: occ,
        parent: rec.parent || null,
        source: rec.source,
      },
    };
  }

  // --- series parent: compute span from its children ---
  if (rec.type === "series") {
    const childDates = (rec.children || [])
      .map((cid) => childResolver(cid))
      .filter((r) => r && r.date);
    childDates.sort((a, b) => (a.date < b.date ? -1 : 1));
    const start = childDates.length ? childDates[0].dateInfo.start : null;
    const end = childDates.length
      ? childDates[childDates.length - 1].dateInfo.end
      : null;
    return {
      dateType,
      date: start,
      dateInfo: {
        type: "series",
        start,
        end,
        isMultiDay: !!(start && end && start !== end),
        children: rec.children || [],
        source: rec.source,
      },
    };
  }

  // --- seasonal: month window, optional preserved anchor occurrence ---
  if (rec.type === "seasonal") {
    const occ = rec.occurrences || {};
    const anchorYears = Object.keys(occ).sort();
    const anchor = anchorYears.length ? occ[anchorYears[0]] : null;
    return {
      dateType,
      date: null, // deliberately no exact next-date — it's seasonal
      dateInfo: {
        type: "seasonal",
        window: rec.window || null,
        anchor: anchor ? { year: anchorYears[0], ...anchor } : null,
        source: rec.source,
      },
    };
  }

  // --- periodic: no known upcoming date (e.g. 12-yearly) ---
  if (rec.type === "periodic") {
    return {
      dateType,
      date: null,
      dateInfo: {
        type: "periodic",
        intervalYears: rec.intervalYears || null,
        note: rec.note || null,
        source: rec.source,
      },
    };
  }

  return { dateType: "Unknown", date: null, dateInfo: { type: "unknown" } };
}

/**
 * buildEvents: join every content entry with its dates record.
 * Returns the flat array (parent + children) in OLD shape + `dateInfo`.
 */
export function buildEvents(content, dates, refDate) {
  // memoized single-entry resolver, used both directly and by series parents
  const cache = {};
  const resolveById = (id) => {
    if (id in cache) return cache[id];
    const rec = dates[id];
    if (!rec) { cache[id] = null; return null; }
    cache[id] = resolveOne(id, rec, refDate, resolveById);
    return cache[id];
  };

  return content.map((entry) => {
    const resolved = resolveById(entry.id) || {
      dateType: "Unknown", date: null, dateInfo: { type: "unknown" },
    };
    return {
      ...entry,
      date: resolved.date,
      dateType: resolved.dateType,
      dateInfo: resolved.dateInfo,
    };
  });
}

/**
 * eventsForYear: concrete dated instances for the calendar grid, for one year.
 * Emits { id, title, type, role, start, end, isMultiDay, monthMarker, window }.
 *   role 'event'  -> a normal dated festival (place on day cell / span bar)
 *   role 'span'   -> series parent span container
 *   role 'season' -> seasonal month-level marker (not a day cell)
 * Seasonal entries with a preserved anchor occurrence IN this year are
 * emitted as real dated events instead of month markers.
 */
export function eventsForYear(content, dates, year) {
  const byId = Object.fromEntries(content.map((c) => [c.id, c]));
  const out = [];

  for (const id of Object.keys(dates)) {
    const rec = dates[id];
    const meta = byId[id];
    if (!meta) continue;
    const base = { id, title: meta.title, type: meta.type };

    if (rec.type === "fixed") {
      let s, e;
      if (typeof rec.rule === "string") s = e = rec.rule;
      else { s = rec.rule.start; e = rec.rule.end; }
      const [sm, sd] = s.split("-").map(Number);
      const [em, ed] = e.split("-").map(Number);
      const start = iso(year, sm, sd), end = iso(year, em, ed);
      out.push({ ...base, role: "event", start, end, isMultiDay: start !== end });

    } else if (rec.type === "variable") {
      const occ = (rec.occurrences || {})[year];
      if (occ) out.push({
        ...base, role: "event", start: occ.start, end: occ.end,
        isMultiDay: occ.start !== occ.end, parent: rec.parent || null,
      });

    } else if (rec.type === "series") {
      // parent span computed from children present in this year
      const childOccs = (rec.children || [])
        .map((cid) => (dates[cid]?.occurrences || {})[year])
        .filter(Boolean)
        .sort((a, b) => (a.start < b.start ? -1 : 1));
      if (childOccs.length) {
        out.push({
          ...base, role: "span",
          start: childOccs[0].start,
          end: childOccs[childOccs.length - 1].end,
          isMultiDay: true,
          spanChildren: rec.children,
        });
      }

    } else if (rec.type === "seasonal") {
      const occ = (rec.occurrences || {})[year];
      if (occ) {
        // preserved anchor falls in this year -> render as a real dated event
        out.push({ ...base, role: "event", start: occ.start, end: occ.end,
          isMultiDay: occ.start !== occ.end });
      } else if (rec.window) {
        out.push({ ...base, role: "season", monthMarker: true, window: rec.window });
      }
    }
    // periodic: skipped — no known date for this year
  }

  return out;
}

export function findById(events, id) {
  const map = Object.fromEntries(events.map((e) => [e.id, e]));
  const event = map[id] || null;
  if (!event) return null;
  // resolve parent/children links for the detail page
  const parent = event.parent ? map[event.parent] || null : null;
  const children = (event.seriesChildren || event.dateInfo?.children || [])
    .map((cid) => map[cid])
    .filter(Boolean);
  return { event, parent, children };
}
