/**
 * Time-grid layout utilities.
 * Pure functions for positioning blocks on a Google-Calendar-style time grid.
 */

export const PIXELS_PER_MINUTE = 1; // 1 hour = 60 px
export const DEFAULT_START_HOUR = 7; // 7 AM
export const DEFAULT_END_HOUR = 23; // 11 PM
export const MIN_BLOCK_HEIGHT = 20; // pixels — keep tiny blocks clickable

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PositionedBlock<T> {
  item: T;
  top: number; // px from grid top
  height: number; // px
  column: number; // 0-indexed column within overlap group
  totalColumns: number; // total parallel columns in the overlap group
}

// ---------------------------------------------------------------------------
// Grid range
// ---------------------------------------------------------------------------

/**
 * Scan an array of objects with `start_time` / `end_time` ISO strings and
 * return the earliest start hour and latest end hour for the grid.
 */
export function computeGridRange(
  items: { start_time: string; end_time: string }[]
): { startHour: number; endHour: number } {
  let minHour = DEFAULT_START_HOUR;
  let maxHour = DEFAULT_END_HOUR;

  for (const item of items) {
    const sH = new Date(item.start_time).getHours();
    const eH = new Date(item.end_time).getHours();
    const eM = new Date(item.end_time).getMinutes();

    if (sH < minHour) minHour = sH;
    // If end time has minutes, we need the next hour visible
    const effectiveEndHour = eM > 0 ? eH + 1 : eH;
    if (effectiveEndHour > maxHour) maxHour = effectiveEndHour;
  }

  // Clamp to reasonable bounds
  return {
    startHour: Math.max(0, Math.min(minHour, DEFAULT_START_HOUR)),
    endHour: Math.min(24, Math.max(maxHour, DEFAULT_END_HOUR)),
  };
}

// ---------------------------------------------------------------------------
// Positioning helpers
// ---------------------------------------------------------------------------

export function getBlockTop(startTime: string, gridStartHour: number): number {
  const d = new Date(startTime);
  const minutesSinceGridStart =
    (d.getHours() - gridStartHour) * 60 + d.getMinutes();
  return minutesSinceGridStart * PIXELS_PER_MINUTE;
}

export function getBlockHeight(startTime: string, endTime: string): number {
  const diffMs =
    new Date(endTime).getTime() - new Date(startTime).getTime();
  const diffMinutes = diffMs / 60000;
  return Math.max(diffMinutes * PIXELS_PER_MINUTE, MIN_BLOCK_HEIGHT);
}

// ---------------------------------------------------------------------------
// Hour labels
// ---------------------------------------------------------------------------

export interface HourLabel {
  hour: number; // 0–23
  label: string; // "7 AM", "12 PM", etc.
  topPx: number;
}

export function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function getHourLabels(
  startHour: number,
  endHour: number
): HourLabel[] {
  const labels: HourLabel[] = [];
  for (let h = startHour; h <= endHour; h++) {
    labels.push({
      hour: h,
      label: formatHourLabel(h),
      topPx: (h - startHour) * 60 * PIXELS_PER_MINUTE,
    });
  }
  return labels;
}

// ---------------------------------------------------------------------------
// Overlap layout algorithm
// ---------------------------------------------------------------------------

/**
 * Given blocks for a single day, compute absolute positions and handle
 * overlapping blocks by assigning them to parallel columns.
 */
export function layoutBlocks<
  T extends { start_time: string; end_time: string }
>(blocks: T[], gridStartHour: number): PositionedBlock<T>[] {
  if (blocks.length === 0) return [];

  // Sort by start time, then longest duration first
  const sorted = [...blocks].sort((a, b) => {
    const diff =
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    if (diff !== 0) return diff;
    const aDur =
      new Date(a.end_time).getTime() - new Date(a.start_time).getTime();
    const bDur =
      new Date(b.end_time).getTime() - new Date(b.start_time).getTime();
    return bDur - aDur; // longer first
  });

  // Group into overlap clusters
  const clusters: T[][] = [];
  let currentCluster: T[] = [];
  let clusterEnd = 0;

  for (const block of sorted) {
    const startMs = new Date(block.start_time).getTime();
    const endMs = new Date(block.end_time).getTime();

    if (currentCluster.length === 0 || startMs < clusterEnd) {
      currentCluster.push(block);
      clusterEnd = Math.max(clusterEnd, endMs);
    } else {
      clusters.push(currentCluster);
      currentCluster = [block];
      clusterEnd = endMs;
    }
  }
  if (currentCluster.length > 0) clusters.push(currentCluster);

  // Within each cluster, greedily assign columns
  const result: PositionedBlock<T>[] = [];

  for (const cluster of clusters) {
    const columnEndTimes: number[] = []; // tracks end time per column
    const assignments: { item: T; col: number }[] = [];

    for (const block of cluster) {
      const startMs = new Date(block.start_time).getTime();
      let placed = false;

      for (let c = 0; c < columnEndTimes.length; c++) {
        if (startMs >= columnEndTimes[c]) {
          columnEndTimes[c] = new Date(block.end_time).getTime();
          assignments.push({ item: block, col: c });
          placed = true;
          break;
        }
      }
      if (!placed) {
        assignments.push({ item: block, col: columnEndTimes.length });
        columnEndTimes.push(new Date(block.end_time).getTime());
      }
    }

    const totalCols = columnEndTimes.length;
    for (const { item, col } of assignments) {
      result.push({
        item,
        top: getBlockTop(item.start_time, gridStartHour),
        height: getBlockHeight(item.start_time, item.end_time),
        column: col,
        totalColumns: totalCols,
      });
    }
  }

  return result;
}
