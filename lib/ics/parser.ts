/**
 * Lightweight .ics (iCalendar) file parser.
 *
 * Parses VEVENT components and expands RRULE recurrences within a date range.
 * No external dependencies — works entirely with built-in JS Date and string APIs.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedEvent {
  /** SUMMARY field — event title */
  summary: string;
  /** Start time as ISO-8601 string */
  startTime: string;
  /** End time as ISO-8601 string */
  endTime: string;
  /** Duration in minutes */
  durationMinutes: number;
  /** Optional DESCRIPTION field */
  description?: string;
  /** Optional LOCATION field */
  location?: string;
  /** Whether this was expanded from a recurring rule */
  isRecurring: boolean;
}

interface RawEvent {
  summary: string;
  dtstart: Date;
  dtend: Date;
  description?: string;
  location?: string;
  rrule?: string;
  exdates: Date[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse an iCalendar date-time string into a JS Date.
 * Handles formats like:
 *   20260115T103000Z       (UTC)
 *   20260115T103000        (floating / local)
 *   20260115               (date-only, all day)
 *   TZID=America/Boise:20260115T103000  (timezone-qualified)
 */
function parseIcsDateTime(raw: string): Date {
  // Strip TZID prefix (we convert everything to local for display)
  let s = raw;
  if (s.includes(":")) {
    s = s.split(":").pop()!;
  }
  s = s.trim();

  // Date-only (all-day event)
  if (s.length === 8) {
    const year = parseInt(s.slice(0, 4));
    const month = parseInt(s.slice(4, 6)) - 1;
    const day = parseInt(s.slice(6, 8));
    return new Date(year, month, day);
  }

  // Date-time
  const year = parseInt(s.slice(0, 4));
  const month = parseInt(s.slice(4, 6)) - 1;
  const day = parseInt(s.slice(6, 8));
  const hour = parseInt(s.slice(9, 11));
  const minute = parseInt(s.slice(11, 13));
  const second = parseInt(s.slice(13, 15)) || 0;

  if (s.endsWith("Z")) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
  // Floating / local
  return new Date(year, month, day, hour, minute, second);
}

/**
 * Parse an iCalendar DURATION value (e.g. PT1H30M, P1DT2H) into milliseconds.
 */
function parseDuration(dur: string): number {
  let ms = 0;
  const dayMatch = dur.match(/(\d+)D/);
  if (dayMatch) ms += parseInt(dayMatch[1]) * 86400000;
  const hourMatch = dur.match(/(\d+)H/);
  if (hourMatch) ms += parseInt(hourMatch[1]) * 3600000;
  const minMatch = dur.match(/(\d+)M/);
  if (minMatch) ms += parseInt(minMatch[1]) * 60000;
  const secMatch = dur.match(/(\d+)S/);
  if (secMatch) ms += parseInt(secMatch[1]) * 1000;
  return ms;
}

/**
 * Parse RRULE BYDAY values to JS day-of-week numbers (0=Sun, 6=Sat).
 */
const DAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

// ---------------------------------------------------------------------------
// RRULE expansion
// ---------------------------------------------------------------------------

function expandRecurrence(
  event: RawEvent,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const rule = event.rrule;
  if (!rule) return [event.dtstart];

  const params = new Map<string, string>();
  for (const part of rule.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) params.set(k.toUpperCase(), v.toUpperCase());
  }

  const freq = params.get("FREQ");
  const count = params.has("COUNT") ? parseInt(params.get("COUNT")!) : undefined;
  const until = params.has("UNTIL") ? parseIcsDateTime(params.get("UNTIL")!) : undefined;
  const interval = params.has("INTERVAL") ? parseInt(params.get("INTERVAL")!) : 1;
  const byDay = params.get("BYDAY")?.split(",").map((d) => DAY_MAP[d.replace(/[^A-Z]/g, "")]).filter((d) => d !== undefined) ?? [];

  const effectiveEnd = until && until < rangeEnd ? until : rangeEnd;
  const occurrences: Date[] = [];
  const exdateSet = new Set(event.exdates.map((d) => d.toISOString()));

  if (freq === "WEEKLY") {
    // If BYDAY is specified, generate occurrences for each listed day
    const daysToUse = byDay.length > 0 ? byDay : [event.dtstart.getDay()];
    let weekStart = new Date(event.dtstart);
    // Back up to the start of the week containing dtstart
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    let generated = 0;
    while (weekStart <= effectiveEnd) {
      for (const dayNum of daysToUse) {
        const occ = new Date(weekStart);
        occ.setDate(occ.getDate() + dayNum);
        occ.setHours(event.dtstart.getHours(), event.dtstart.getMinutes(), event.dtstart.getSeconds());

        if (occ >= event.dtstart && occ >= rangeStart && occ <= effectiveEnd) {
          if (!exdateSet.has(occ.toISOString())) {
            occurrences.push(occ);
            generated++;
            if (count !== undefined && generated >= count) return occurrences;
          }
        }
      }
      weekStart.setDate(weekStart.getDate() + 7 * interval);
    }
  } else if (freq === "DAILY") {
    let current = new Date(event.dtstart);
    let generated = 0;
    while (current <= effectiveEnd) {
      if (current >= rangeStart) {
        if (!exdateSet.has(current.toISOString())) {
          occurrences.push(new Date(current));
          generated++;
          if (count !== undefined && generated >= count) return occurrences;
        }
      }
      current.setDate(current.getDate() + interval);
    }
  } else if (freq === "MONTHLY") {
    let current = new Date(event.dtstart);
    let generated = 0;
    while (current <= effectiveEnd) {
      if (current >= rangeStart) {
        if (!exdateSet.has(current.toISOString())) {
          occurrences.push(new Date(current));
          generated++;
          if (count !== undefined && generated >= count) return occurrences;
        }
      }
      current.setMonth(current.getMonth() + interval);
    }
  } else {
    // Unsupported frequency — just use the single occurrence
    occurrences.push(event.dtstart);
  }

  return occurrences;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

/**
 * Unfold long lines per RFC 5545 section 3.1:
 * Lines that begin with a space or tab are continuations of the previous line.
 */
function unfoldLines(text: string): string {
  return text.replace(/\r?\n[ \t]/g, "");
}

/**
 * Parse an .ics file string and return expanded events within the given date range.
 *
 * @param icsText  Raw .ics file content
 * @param rangeStart  Earliest date to include events for
 * @param rangeEnd    Latest date to include events for
 */
export function parseIcsFile(
  icsText: string,
  rangeStart: Date,
  rangeEnd: Date,
): ParsedEvent[] {
  const unfolded = unfoldLines(icsText);
  const lines = unfolded.split(/\r?\n/);

  const rawEvents: RawEvent[] = [];
  let inEvent = false;
  let current: Partial<RawEvent> & { durationStr?: string } = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "BEGIN:VEVENT") {
      inEvent = true;
      current = { exdates: [] };
      continue;
    }

    if (trimmed === "END:VEVENT") {
      inEvent = false;

      // Validate we have minimum required fields
      if (current.summary && current.dtstart) {
        // Calculate dtend from duration if not explicit
        if (!current.dtend && current.durationStr) {
          const ms = parseDuration(current.durationStr);
          current.dtend = new Date(current.dtstart.getTime() + ms);
        }
        // Default: 1 hour if no end time
        if (!current.dtend) {
          current.dtend = new Date(current.dtstart.getTime() + 3600000);
        }

        rawEvents.push({
          summary: current.summary,
          dtstart: current.dtstart,
          dtend: current.dtend,
          description: current.description,
          location: current.location,
          rrule: current.rrule,
          exdates: current.exdates ?? [],
        });
      }
      continue;
    }

    if (!inEvent) continue;

    // Parse property:value (handle properties with parameters like DTSTART;TZID=...)
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx < 0) continue;
    const propPart = trimmed.slice(0, colonIdx);
    const value = trimmed.slice(colonIdx + 1);
    const propName = propPart.split(";")[0].toUpperCase();

    switch (propName) {
      case "SUMMARY":
        current.summary = value.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\\\/g, "\\");
        break;
      case "DTSTART":
        current.dtstart = parseIcsDateTime(trimmed.slice(trimmed.indexOf(":") + 1));
        // If the property part has TZID, pass the whole thing
        if (propPart.includes("TZID")) {
          current.dtstart = parseIcsDateTime(propPart.split("TZID=")[1] + ":" + value);
        }
        break;
      case "DTEND":
        current.dtend = parseIcsDateTime(trimmed.slice(trimmed.indexOf(":") + 1));
        if (propPart.includes("TZID")) {
          current.dtend = parseIcsDateTime(propPart.split("TZID=")[1] + ":" + value);
        }
        break;
      case "DURATION":
        current.durationStr = value;
        break;
      case "RRULE":
        current.rrule = value;
        break;
      case "EXDATE":
        if (value) {
          for (const d of value.split(",")) {
            current.exdates?.push(parseIcsDateTime(d.trim()));
          }
        }
        break;
      case "DESCRIPTION":
        current.description = value.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\\\/g, "\\");
        break;
      case "LOCATION":
        current.location = value.replace(/\\n/g, " ").replace(/\\,/g, ",").replace(/\\\\/g, "\\");
        break;
    }
  }

  // Expand recurrences and flatten
  const results: ParsedEvent[] = [];
  for (const raw of rawEvents) {
    const durationMs = raw.dtend.getTime() - raw.dtstart.getTime();
    const durationMinutes = Math.round(durationMs / 60000);
    const isRecurring = !!raw.rrule;

    const occurrences = expandRecurrence(raw, rangeStart, rangeEnd);
    for (const occ of occurrences) {
      const end = new Date(occ.getTime() + durationMs);
      results.push({
        summary: raw.summary,
        startTime: occ.toISOString(),
        endTime: end.toISOString(),
        durationMinutes,
        description: raw.description,
        location: raw.location,
        isRecurring,
      });
    }
  }

  // Sort by start time
  results.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return results;
}
