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

/** Format an ISO timestamp as "14:30" (24h) or "2:30 PM" (12h) */
export function formatTime(isoStr: string, use12Hour = false): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: use12Hour,
  }).format(new Date(isoStr));
}

/** Format an ISO timestamp as time range "14:30–15:15" */
export function formatTimeRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(new Date(start))}–${fmt.format(new Date(end))}`;
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
