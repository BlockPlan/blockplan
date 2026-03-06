/** Shared date/time formatting utilities */

/** Format an ISO date string as "Jan 5, 2025" */
export function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format an ISO date string as "Jan 5" (no year) */
export function formatDueShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

/** Format an ISO timestamp as "2:30 PM" (12h) or "14:30" (24h) */
export function formatTime(isoStr: string, use12Hour = true): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: use12Hour,
  }).format(new Date(isoStr));
}

/** Format an ISO timestamp as compact time range "7–8:20pm" or "11:30am–1pm" */
export function formatTimeRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sH = s.getHours();
  const eH = e.getHours();
  const sM = s.getMinutes();
  const eM = e.getMinutes();
  const sPeriod = sH < 12 ? "am" : "pm";
  const ePeriod = eH < 12 ? "am" : "pm";
  const sH12 = sH % 12 || 12;
  const eH12 = eH % 12 || 12;
  const sMin = sM > 0 ? `:${String(sM).padStart(2, "0")}` : "";
  const eMin = eM > 0 ? `:${String(eM).padStart(2, "0")}` : "";

  // Omit period on start time if same as end (e.g. "7–8:30pm" instead of "7pm–8:30pm")
  if (sPeriod === ePeriod) {
    return `${sH12}${sMin}–${eH12}${eMin}${ePeriod}`;
  }
  return `${sH12}${sMin}${sPeriod}–${eH12}${eMin}${ePeriod}`;
}

/** Convert an ISO date/timestamptz string to "YYYY-MM-DD" for date inputs */
export function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/** Format minutes as "1h 30m", "45m", or "—" for null */
export function formatMinutes(mins: number | null): string {
  if (!mins) return "—";
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}
