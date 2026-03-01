import { describe, it, expect } from 'vitest';
import {
  generateSchedule,
  type AvailabilityRule,
  type SchedulableTask,
  type PlannerSettings,
} from '../scheduler';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TZ = 'America/Boise'; // UTC-7 (MDT) / UTC-6 (MST)

/** planStart: Monday 2026-04-06 10:00 AM Boise time (MDT = UTC-6 in April) */
const PLAN_START = new Date('2026-04-06T16:00:00Z'); // 10:00 AM MDT

const DEFAULT_SETTINGS: PlannerSettings = {
  max_block_minutes: 90,
  min_block_minutes: 25,
  buffer_minutes: 10,
};

/** Monday availability: 8:00–12:00 (rule for day_of_week=1) */
const MON_RULE: AvailabilityRule = {
  day_of_week: 1,
  start_time: '08:00',
  end_time: '12:00',
  rule_type: 'available',
};

/** Tuesday availability: 8:00–12:00 */
const TUE_RULE: AvailabilityRule = {
  day_of_week: 2,
  start_time: '08:00',
  end_time: '12:00',
  rule_type: 'available',
};

function makeTask(overrides: Partial<SchedulableTask> = {}): SchedulableTask {
  return {
    id: 'task-1',
    title: 'Test Task',
    course_id: 'course-1',
    due_date: '2026-04-10T23:59:00Z',
    estimated_minutes: 45,
    status: 'todo',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

describe('generateSchedule', () => {
  // 1. Empty tasks
  it('returns empty result when no tasks provided', () => {
    const result = generateSchedule([], [MON_RULE], DEFAULT_SETTINGS, TZ, PLAN_START);
    expect(result.blocks).toEqual([]);
    expect(result.unscheduled).toEqual([]);
    expect(result.risk_tasks).toEqual([]);
  });

  // 2. Empty availability rules
  it('returns all tasks as unscheduled when no availability rules', () => {
    const task = makeTask();
    const result = generateSchedule([task], [], DEFAULT_SETTINGS, TZ, PLAN_START);
    expect(result.blocks).toEqual([]);
    expect(result.unscheduled).toHaveLength(1);
    expect(result.unscheduled[0].id).toBe('task-1');
  });

  // 3. Single task fits in single window
  it('schedules a single task that fits in one window', () => {
    const task = makeTask({ estimated_minutes: 45 });
    const result = generateSchedule([task], [MON_RULE], DEFAULT_SETTINGS, TZ, PLAN_START);

    // planStart is 10:00 AM Monday; window is 8:00-12:00 Monday
    // effective window starts at 10:00 AM, so task should be placed
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0].task_id).toBe('task-1');
    expect(result.unscheduled).toHaveLength(0);

    // Block duration should be 45 minutes
    const blockDuration =
      (result.blocks[0].end_time.getTime() - result.blocks[0].start_time.getTime()) / 60000;
    expect(blockDuration).toBe(45);
  });

  // 4. Task split across blocks (exceeds max_block_minutes)
  it('splits a task across multiple blocks when it exceeds max_block_minutes', () => {
    const settings: PlannerSettings = { ...DEFAULT_SETTINGS, max_block_minutes: 90, min_block_minutes: 25 };
    // 150 min task => 2 blocks: 90 + 60
    const task = makeTask({ estimated_minutes: 150 });
    // Two separate day windows large enough
    const rules: AvailabilityRule[] = [MON_RULE, TUE_RULE];
    const result = generateSchedule([task], rules, settings, TZ, PLAN_START);

    expect(result.blocks.length).toBeGreaterThanOrEqual(2);
    expect(result.unscheduled).toHaveLength(0);

    const totalMinutes = result.blocks.reduce(
      (sum, b) => sum + (b.end_time.getTime() - b.start_time.getTime()) / 60000,
      0
    );
    expect(totalMinutes).toBe(150);
  });

  // 5. Buffer between blocks
  it('places a buffer gap between consecutive blocks', () => {
    const settings: PlannerSettings = { ...DEFAULT_SETTINGS, buffer_minutes: 10 };
    const task1 = makeTask({ id: 'task-1', estimated_minutes: 30 });
    const task2 = makeTask({ id: 'task-2', estimated_minutes: 30, due_date: '2026-04-10T23:59:00Z' });

    const result = generateSchedule([task1, task2], [MON_RULE], settings, TZ, PLAN_START);

    // Should have 2 blocks
    expect(result.blocks).toHaveLength(2);

    const [first, second] = result.blocks.sort(
      (a, b) => a.start_time.getTime() - b.start_time.getTime()
    );

    const gapMinutes = (second.start_time.getTime() - first.end_time.getTime()) / 60000;
    expect(gapMinutes).toBe(10);
  });

  // 6. EDD priority: earlier due date scheduled first
  it('schedules tasks in earliest-due-date-first order', () => {
    const taskA = makeTask({ id: 'task-a', due_date: '2026-04-10T23:59:00Z', estimated_minutes: 30 });
    const taskB = makeTask({ id: 'task-b', due_date: '2026-04-08T23:59:00Z', estimated_minutes: 30 });

    const result = generateSchedule([taskA, taskB], [MON_RULE], DEFAULT_SETTINGS, TZ, PLAN_START);

    expect(result.blocks).toHaveLength(2);
    const sorted = result.blocks.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    // Task B (earlier due date) should be scheduled first
    expect(sorted[0].task_id).toBe('task-b');
    expect(sorted[1].task_id).toBe('task-a');
  });

  // 7. Null due date tasks scheduled last
  it('schedules null-due-date tasks after dated tasks', () => {
    const taskNoDue = makeTask({ id: 'task-no-due', due_date: null, estimated_minutes: 30 });
    const taskWithDue = makeTask({ id: 'task-with-due', due_date: '2026-04-10T23:59:00Z', estimated_minutes: 30 });

    const result = generateSchedule([taskNoDue, taskWithDue], [MON_RULE], DEFAULT_SETTINGS, TZ, PLAN_START);

    expect(result.blocks).toHaveLength(2);
    const sorted = result.blocks.sort((a, b) => a.start_time.getTime() - b.start_time.getTime());
    // Dated task should come first
    expect(sorted[0].task_id).toBe('task-with-due');
    expect(sorted[1].task_id).toBe('task-no-due');
  });

  // 8. Min block length respected
  it('does not place a block if available window time is less than min_block_minutes', () => {
    const settings: PlannerSettings = {
      max_block_minutes: 90,
      min_block_minutes: 25,
      buffer_minutes: 0,
    };

    // Window with only 20 minutes of space (from planStart until window end)
    // planStart = 10:00 AM; window is 08:00-10:20 (only 20 min remaining after planStart)
    const tightRule: AvailabilityRule = {
      day_of_week: 1,
      start_time: '08:00',
      end_time: '10:20',
      rule_type: 'available',
    };

    // Task with 10 min remaining but min_block is 25
    const task = makeTask({ estimated_minutes: 10 });
    const result = generateSchedule([task], [tightRule], settings, TZ, PLAN_START);

    // 20 min window, 10 min task, but min_block=25 => 10 < 25? No, block duration would be 10.
    // Actually, blockDuration = min(10, 90, 20) = 10, which is < min_block_minutes(25) => not placed
    expect(result.blocks).toHaveLength(0);
    expect(result.unscheduled).toHaveLength(1);
  });

  // 9. Overdue risk detection
  it('classifies tasks with due_date in the past as overdue_risk', () => {
    const overdueTask = makeTask({
      id: 'overdue-task',
      due_date: '2026-04-01T00:00:00Z', // in the past relative to planStart (2026-04-06)
      estimated_minutes: 60,
    });

    const result = generateSchedule([overdueTask], [MON_RULE], DEFAULT_SETTINGS, TZ, PLAN_START);

    // The task may or may not be scheduled, but it should appear in risk_tasks as overdue_risk
    const risk = result.risk_tasks.find(r => r.task.id === 'overdue-task');
    expect(risk).toBeDefined();
    expect(risk?.level).toBe('overdue_risk');
  });

  // 10. At risk detection: task that can't fit before due date
  it('classifies tasks that cannot fit before due date as at_risk', () => {
    // Task needs 200 minutes, but only 2 hours available before due date
    // Due date is tomorrow (2026-04-07); window today is only 2 hours (10:00-12:00 = 120 min)
    const tightTask = makeTask({
      id: 'tight-task',
      due_date: '2026-04-07T12:00:00Z', // tomorrow noon
      estimated_minutes: 200,
    });

    // Only Monday window available before due date (2 hours = 120 min)
    const result = generateSchedule([tightTask], [MON_RULE], DEFAULT_SETTINGS, TZ, PLAN_START);

    // Task should be in risk_tasks (can't fit 200 min in 120 min window before due date)
    const risk = result.risk_tasks.find(r => r.task.id === 'tight-task');
    expect(risk).toBeDefined();
  });

  // 11. Windows in the past are skipped
  it('skips availability windows that are entirely in the past', () => {
    // planStart is 10:00 AM Monday; window 6:00-9:00 is in the past
    const pastRule: AvailabilityRule = {
      day_of_week: 1,
      start_time: '06:00',
      end_time: '09:00',
      rule_type: 'available',
    };

    const task = makeTask({ estimated_minutes: 30 });
    const result = generateSchedule([task], [pastRule], DEFAULT_SETTINGS, TZ, PLAN_START);

    // No available future windows => task unscheduled
    expect(result.blocks).toHaveLength(0);
    expect(result.unscheduled).toHaveLength(1);
  });

  // 12. Partially elapsed window is trimmed
  it('trims a partially elapsed window to start at planStart', () => {
    // planStart is 10:00 AM Monday; window is 9:00-13:00 (partially elapsed)
    const partialRule: AvailabilityRule = {
      day_of_week: 1,
      start_time: '09:00',
      end_time: '13:00',
      rule_type: 'available',
    };

    const task = makeTask({ estimated_minutes: 30 });
    const result = generateSchedule([task], [partialRule], DEFAULT_SETTINGS, TZ, PLAN_START);

    expect(result.blocks).toHaveLength(1);
    // Block should start at planStart (10:00 AM = 16:00 UTC), not at 9:00 AM
    const blockStartHour = result.blocks[0].start_time.getUTCHours();
    expect(blockStartHour).toBe(16); // 16:00 UTC = 10:00 AM MDT
  });
});
