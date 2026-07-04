import fs from "fs";
import { buildEvents, eventsForYear, findById } from "./dateResolver.js";

const content = JSON.parse(fs.readFileSync("./content.json", "utf8"));
const dates = JSON.parse(fs.readFileSync("./dates.json", "utf8"));

// pin "today" so tests are deterministic
const REF = new Date(2026, 6, 3); // 2026-07-03

const events = buildEvents(content, dates, REF);
const byId = Object.fromEntries(events.map((e) => [e.id, e]));

let fails = 0;
function check(label, cond, detail) {
  if (!cond) { fails++; console.log(`  FAIL: ${label}${detail ? " — " + detail : ""}`); }
  else console.log(`  ok:   ${label}`);
}

console.log("== counts ==");
check("all 160 events built", events.length === 160, `got ${events.length}`);

console.log("\n== fixed (from dataset) ==");
const rep = byId["republic-day-india"];
check("republic day dateType Fixed", rep.dateType === "Fixed");
check("republic day date is 2027-01-26 (already past 2026-07-03)",
  rep.date === "2027-01-26", `got ${rep.date}`);

console.log("\n== fixed with range (reclassified) ==");
const hornbill = byId["hornbill-festival"];
check("hornbill is multi-day", hornbill.dateInfo.isMultiDay === true);
check("hornbill 2026-12-01..10", hornbill.dateInfo.start === "2026-12-01" && hornbill.dateInfo.end === "2026-12-10",
  `${hornbill.dateInfo.start}..${hornbill.dateInfo.end}`);

console.log("\n== variable (25/25 matched) ==");
const chhath = byId["chhath-puja"];
check("chhath dateType Variable", chhath.dateType === "Variable");
check("chhath has a non-null next date", !!chhath.date, `got ${chhath.date}`);
check("chhath next date >= today", chhath.date >= "2026-07-03", `got ${chhath.date}`);

console.log("\n== series parent computes span from children ==");
const diwali = byId["diwali"];
check("diwali dateType Variable (series)", diwali.dateType === "Variable");
check("diwali is multi-day span", diwali.dateInfo.isMultiDay === true, JSON.stringify(diwali.dateInfo));
check("diwali has 5 children", (diwali.dateInfo.children || []).length === 5);
check("diwali span start <= end",
  diwali.dateInfo.start && diwali.dateInfo.end && diwali.dateInfo.start <= diwali.dateInfo.end,
  `${diwali.dateInfo.start}..${diwali.dateInfo.end}`);

console.log("\n== series child is individually resolvable ==");
const bhaidooj = byId["diwali-bhai-dooj"];
check("bhai dooj exists as own entry", !!bhaidooj);
check("bhai dooj points to parent diwali", bhaidooj.dateInfo.parent === "diwali", JSON.stringify(bhaidooj.dateInfo.parent));
check("bhai dooj has its own next date", !!bhaidooj.date);

console.log("\n== seasonal: no exact date, has window ==");
const theyyam = byId["theyyam"];
check("theyyam date is null", theyyam.date === null);
check("theyyam dateType Seasonal", theyyam.dateType === "Seasonal");
check("theyyam has window", !!theyyam.dateInfo.window);

console.log("\n== seasonal-with-anchor keeps 2026 date ==");
const gurunanak = byId["guru-nanak-jayanti"];
check("guru nanak dateType Seasonal", gurunanak.dateType === "Seasonal");
check("guru nanak has anchor", !!gurunanak.dateInfo.anchor, JSON.stringify(gurunanak.dateInfo));

console.log("\n== periodic: null date, note preserved ==");
const nanda = byId["nanda-devi-raj-jat"];
check("nanda devi date null", nanda.date === null);
check("nanda devi dateType Periodic", nanda.dateType === "Periodic");
check("nanda devi keeps note", !!nanda.dateInfo.note);

console.log("\n== eventsForYear(2026) ==");
const y26 = eventsForYear(content, dates, 2026);
check("2026 produces events", y26.length > 0, `got ${y26.length}`);
const diwaliSpan = y26.find((e) => e.id === "diwali" && e.role === "span");
check("diwali appears as a span in 2026", !!diwaliSpan, diwaliSpan ? `${diwaliSpan.start}..${diwaliSpan.end}` : "missing");
const bhaidoojDay = y26.find((e) => e.id === "diwali-bhai-dooj" && e.role === "event");
check("bhai dooj appears as its own dated event in 2026", !!bhaidoojDay);
const seasonMarkers = y26.filter((e) => e.role === "season");
check("seasonal month-markers emitted for 2026", seasonMarkers.length > 0, `got ${seasonMarkers.length}`);
// guru nanak has a 2026 anchor -> should be a real dated event in 2026, not a marker
const gnDay = y26.find((e) => e.id === "guru-nanak-jayanti");
check("guru nanak (anchor yr) is a dated event in 2026, not a marker",
  gnDay && gnDay.role === "event", gnDay ? gnDay.role : "missing");
const nandaYear = y26.find((e) => e.id === "nanda-devi-raj-jat");
check("nanda devi raj jat (periodic) appears in eventsForYear with role: season",
  nandaYear && nandaYear.role === "season", nandaYear ? nandaYear.role : "missing");
check("nanda devi raj jat has monthMarker: true", nandaYear && nandaYear.monthMarker === true);
check("nanda devi raj jat has a valid window", !!(nandaYear && nandaYear.window && nandaYear.window.from && nandaYear.window.to),
  nandaYear ? JSON.stringify(nandaYear.window) : "missing");

console.log("\n== eventsForYear(2030): guru nanak has no anchor -> month marker ==");
const y30 = eventsForYear(content, dates, 2030);
const gn30 = y30.find((e) => e.id === "guru-nanak-jayanti");
check("guru nanak in 2030 is a season marker", gn30 && gn30.role === "season", gn30 ? gn30.role : "missing");

console.log("\n== findById resolves parent/children ==");
const res = findById(events, "diwali");
check("findById(diwali) returns 5 children", res.children.length === 5, `got ${res.children.length}`);
const resChild = findById(events, "diwali-bhai-dooj");
check("findById(child) returns parent", resChild.parent && resChild.parent.id === "diwali");

console.log(`\n${fails === 0 ? "ALL PASS" : fails + " FAILURES"}`);
process.exit(fails === 0 ? 0 : 1);
