import { addDays, addMinutes, differenceInMinutes, getDay, startOfDay } from 'date-fns';
import { tz } from '@date-fns/tz';

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export interface AvailabilityRule {
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;  // "HH:MM" wall-clock
  end_time: string;    // "HH:MM" wall-clock
  rule_type: 'available' | 'blocked' | 'preferred';
}

export interface SchedulableTask {
  id: string;
  title: string;
  course_id: string;
  due_date: string | null; // ISO string (TIMESTAMPTZ) or null
  estimated_minutes: number;
  status: 'todo' | 'doing';
}

export interface PlannerSettings {
  max_block_minutes: number; // default 90
  min_block_minutes: number; // default 25
  buffer_minutes: number;    // default 10
  backward_planning?: boolean; // default false
}

export interface ScheduledBlock {
  task_id: string;
  start_time: Date; // UTC Date object
  end_time: Date;   // UTC Date object
}

export interface SchedulerResult {
  blocks: ScheduledBlock[];
  unscheduled: SchedulableTask[];
  risk_tasks: Array<{ task: SchedulableTask; level: 'at_risk' | 'overdue_risk' }>;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface TimeWindow {
  start: Date; // UTC
  end: Date;   // UTC
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a sorted list of available time windows for the next 7 days from
 * planStart, respecting the user's timezone for wall-clock→UTC conversion.
 *
 * Windows that have already ended are skipped. Windows that have partially
 * elapsed are trimmed so they begin at planStart.
 */
function buildAvailabilityWindows(
  rules: AvailabilityRule[],
  userTimezone: string,
  planStart: Date,
): TimeWindow[] {
  const windows: TimeWindow[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    // The calendar date for this offset, expressed in the user's timezone
    const dayDate = addDays(planStart, dayOffset, { in: tz(userTimezone) });
    const dayOfWeek = getDay(dayDate, { in: tz(userTimezone) }); // 0=Sun, 6=Sat

    const availableRules = rules.filter(
      (r) => r.day_of_week === dayOfWeek && r.rule_type === 'available',
    );

    for (const rule of availableRules) {
      // Convert wall-clock "HH:MM" to UTC Date by anchoring to midnight in
      // the user's timezone (startOfDay respects tz context)
      const dayStart = startOfDay(dayDate, { in: tz(userTimezone) });

      const [startH, startM] = rule.start_time.split(':').map(Number);
      const [endH, endM] = rule.end_time.split(':').map(Number);

      const windowStart = addMinutes(dayStart, startH * 60 + startM);
      const windowEnd = addMinutes(dayStart, endH * 60 + endM);

      // Skip windows that have already ended
      if (windowEnd <= planStart) continue;

      // Trim windows that started before planStart
      windows.push({
        start: windowStart < planStart ? planStart : windowStart,
        end: windowEnd,
      });
    }
  }

  // Sort ascending by start time
  return windows.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Sort tasks by earliest due date first; null due_dates go last.
 */
function sortByEDD(tasks: SchedulableTask[]): SchedulableTask[] {
  return [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}

/**
 * Find the next task in priority order that still has remaining minutes.
 * Priority = EDD order (already reflected in sorted order).
 */
function findNextTask(
  sortedTasks: SchedulableTask[],
  remaining: Map<string, number>,
): SchedulableTask | null {
  for (const task of sortedTasks) {
    if ((remaining.get(task.id) ?? 0) > 0) {
      return task;
    }
  }
  return null;
}

/**
 * Classify unscheduled tasks into risk levels.
 * - overdue_risk: due date is in the past (or has no due date and could not be scheduled)
 * - at_risk: has a future due date but could not fit before it
 */
function classifyRisk(
  unscheduled: SchedulableTask[],
  planStart: Date,
): Array<{ task: SchedulableTask; level: 'at_risk' | 'overdue_risk' }> {
  return unscheduled.map((task) => ({
    task,
    level:
      !task.due_date || new Date(task.due_date) <= planStart
        ? 'overdue_risk'
        : 'at_risk',
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure scheduling function: takes tasks, availability rules, planner settings,
 * user timezone, and the plan start time; returns scheduled blocks and
 * risk/unscheduled task information.
 *
 * No side effects. No database access. Fully unit-testable.
 *
 * Algorithm: Greedy EDD (earliest due date first) bin packing.
 * 1. Sort tasks by due_date ASC (null due dates go last)
 * 2. Build 7-day availability windows from planStart
 * 3. Walk windows, fitting tasks into blocks respecting max/min block length
 *    and buffer time. Tasks are split across blocks if they exceed max_block.
 * 4. Tasks not fully placed go into unscheduled; all are risk-classified.
 *
 * When backward_planning is enabled, work is spread evenly across the days
 * between now and each task's due date instead of front-loading.
 */
export function generateSchedule(
  tasks: SchedulableTask[],
  availabilityRules: AvailabilityRule[],
  settings: PlannerSettings,
  userTimezone: string,
  planStart: Date,
): SchedulerResult {
  // Fast path: no tasks
  if (tasks.length === 0) {
    return { blocks: [], unscheduled: [], risk_tasks: [] };
  }

  // Fast path: no available windows → all tasks unscheduled
  const hasAvailableRules = availabilityRules.some((r) => r.rule_type === 'available');
  if (!hasAvailableRules) {
    const risk = classifyRisk(tasks, planStart);
    return { blocks: [], unscheduled: [...tasks], risk_tasks: risk };
  }

  // 1. Sort tasks EDD
  const sorted = sortByEDD(tasks);

  // 2. Track remaining minutes per task
  const remaining = new Map<string, number>(
    sorted.map((t) => [t.id, t.estimated_minutes]),
  );

  // 3. Build availability windows
  const windows = buildAvailabilityWindows(availabilityRules, userTimezone, planStart);

  // 4. Build daily quotas when backward planning is enabled
  //    Maps task_id → Map<dayIndex, minutesAllowedToday>
  const dailyQuota = new Map<string, Map<number, number>>();
  const dailyScheduled = new Map<string, Map<number, number>>();

  if (settings.backward_planning) {
    const planStartDay = startOfDay(planStart, { in: tz(userTimezone) });

    for (const task of sorted) {
      if (!task.due_date || task.estimated_minutes <= 0) continue;

      const dueDate = new Date(task.due_date);
      if (dueDate <= planStart) continue; // overdue — no backward planning

      // Count available days (0-indexed from planStart) up to due date (max 7)
      const availableDays: number[] = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const dayDate = addDays(planStartDay, dayOffset);
        if (dayDate >= dueDate) break;

        // Check if this day has any availability windows
        const dayOfWeek = getDay(dayDate, { in: tz(userTimezone) });
        const hasWindows = availabilityRules.some(
          (r) => r.day_of_week === dayOfWeek && r.rule_type === 'available',
        );
        if (hasWindows) {
          availableDays.push(dayOffset);
        }
      }

      if (availableDays.length === 0) continue;

      // Spread estimated minutes evenly across available days
      const perDay = Math.ceil(task.estimated_minutes / availableDays.length);
      const quotaMap = new Map<number, number>();
      for (const dayIdx of availableDays) {
        quotaMap.set(dayIdx, perDay);
      }
      dailyQuota.set(task.id, quotaMap);
      dailyScheduled.set(task.id, new Map());
    }
  }

  // Helper: get day index for a given time
  const planStartDay = startOfDay(planStart, { in: tz(userTimezone) });
  function getDayIndex(time: Date): number {
    const diff = time.getTime() - planStartDay.getTime();
    return Math.floor(diff / (24 * 60 * 60 * 1000));
  }

  // Modified findNextTask for backward planning: skips tasks that have hit
  // their daily quota for the current day
  function findNextTaskForWindow(
    sortedTasks: SchedulableTask[],
    remainingMap: Map<string, number>,
    dayIndex: number,
  ): SchedulableTask | null {
    for (const task of sortedTasks) {
      if ((remainingMap.get(task.id) ?? 0) <= 0) continue;

      if (settings.backward_planning) {
        const quota = dailyQuota.get(task.id);
        if (quota) {
          const dayMax = quota.get(dayIndex) ?? 0;
          const dayUsed = dailyScheduled.get(task.id)?.get(dayIndex) ?? 0;
          if (dayUsed >= dayMax) continue; // hit daily quota, skip to next task
        }
      }

      return task;
    }
    return null;
  }

  // 5. Greedy bin packing (with optional daily quota enforcement)
  const blocks: ScheduledBlock[] = [];
  let cursorTime: Date = planStart;

  for (const window of windows) {
    // Advance cursor to window start if cursor is behind
    if (cursorTime < window.start) {
      cursorTime = window.start;
    }

    // Skip window if cursor is already past it
    if (cursorTime >= window.end) continue;

    const windowDayIndex = getDayIndex(window.start);

    // Pack as many task chunks into this window as possible
    while (cursorTime < window.end) {
      const task = findNextTaskForWindow(sorted, remaining, windowDayIndex);
      if (!task) break; // All tasks placed or all hit daily quota

      const taskRemaining = remaining.get(task.id)!;
      const windowAvailable = differenceInMinutes(window.end, cursorTime);

      // When backward planning, also cap at daily remaining quota
      let maxForBlock = Math.min(
        taskRemaining,
        settings.max_block_minutes,
        windowAvailable,
      );

      if (settings.backward_planning) {
        const quota = dailyQuota.get(task.id);
        if (quota) {
          const dayMax = quota.get(windowDayIndex) ?? taskRemaining;
          const dayUsed = dailyScheduled.get(task.id)?.get(windowDayIndex) ?? 0;
          maxForBlock = Math.min(maxForBlock, dayMax - dayUsed);
        }
      }

      // Respect minimum block length — skip if not enough room
      if (maxForBlock < settings.min_block_minutes) break;

      const blockEnd = addMinutes(cursorTime, maxForBlock);

      blocks.push({
        task_id: task.id,
        start_time: new Date(cursorTime),
        end_time: new Date(blockEnd),
      });

      remaining.set(task.id, taskRemaining - maxForBlock);

      // Track daily usage for backward planning
      if (settings.backward_planning) {
        const dayMap = dailyScheduled.get(task.id) ?? new Map<number, number>();
        dayMap.set(windowDayIndex, (dayMap.get(windowDayIndex) ?? 0) + maxForBlock);
        dailyScheduled.set(task.id, dayMap);
      }

      // Advance cursor past block + buffer
      cursorTime = addMinutes(blockEnd, settings.buffer_minutes);
    }
  }

  // 6. Any task with remaining minutes > 0 is unscheduled
  const unscheduled = sorted.filter((t) => (remaining.get(t.id) ?? 0) > 0);

  // 7. Classify risk:
  //    - All unscheduled tasks get a risk classification.
  //    - Additionally, tasks with a past due date (overdue) are always at risk
  //      even if they were successfully scheduled (they are already late).
  const riskSet = new Set<string>();
  const risk_tasks: SchedulerResult['risk_tasks'] = [];

  // First add unscheduled tasks
  for (const entry of classifyRisk(unscheduled, planStart)) {
    if (!riskSet.has(entry.task.id)) {
      riskSet.add(entry.task.id);
      risk_tasks.push(entry);
    }
  }

  // Then flag scheduled tasks that are already overdue (due date in the past)
  for (const task of sorted) {
    if (!riskSet.has(task.id) && task.due_date && new Date(task.due_date) <= planStart) {
      riskSet.add(task.id);
      risk_tasks.push({ task, level: 'overdue_risk' });
    }
  }

  return { blocks, unscheduled, risk_tasks };
}
