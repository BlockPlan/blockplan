import {
  generateSchedule,
  type AvailabilityRule,
  type SchedulableTask,
  type PlannerSettings,
} from "./scheduler";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Urgency = "overdue" | "urgent" | "upcoming" | "normal";

export interface StudySuggestion {
  taskId: string;
  taskTitle: string;
  courseName: string | null;
  dueDate: string | null;
  remainingMinutes: number;
  suggestedStart: string; // ISO string
  suggestedEnd: string;   // ISO string
  urgency: Urgency;
  urgencyLabel: string;
}

export interface TodayBlock {
  id: string;
  taskId: string;
  taskTitle: string;
  courseName: string | null;
  startTime: string;
  endTime: string;
  status: string;
  dueDate: string | null;
}

export interface SuggestionResult {
  suggestions: StudySuggestion[];
  hasActivePlan: boolean;
  hasAvailability: boolean;
  hasTasks: boolean;
  todayRemainingBlocks: TodayBlock[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeUrgency(
  dueDate: string | null,
  remainingMinutes: number,
  now: Date
): { urgency: Urgency; urgencyLabel: string } {
  if (!dueDate) {
    return { urgency: "normal", urgencyLabel: `${remainingMinutes} min remaining` };
  }

  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return {
      urgency: "overdue",
      urgencyLabel: `Overdue! ${remainingMinutes} min remaining`,
    };
  }
  if (diffHours < 24) {
    return {
      urgency: "urgent",
      urgencyLabel: `Due in ${diffHours} hours — ${remainingMinutes} min remaining`,
    };
  }
  if (diffDays <= 2) {
    return {
      urgency: "urgent",
      urgencyLabel: `Due in ${diffDays} day${diffDays > 1 ? "s" : ""} — ${remainingMinutes} min remaining`,
    };
  }
  if (diffDays <= 7) {
    return {
      urgency: "upcoming",
      urgencyLabel: `Due in ${diffDays} days — ${remainingMinutes} min remaining`,
    };
  }

  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(due);
  return {
    urgency: "normal",
    urgencyLabel: `Due ${dateLabel} — ${remainingMinutes} min remaining`,
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Compute study suggestions by running the existing scheduler against
 * incomplete tasks and user availability. No DB access — pure function.
 */
export function computeStudySuggestions({
  tasks,
  availabilityRules,
  settings,
  timezone,
  existingBlocks,
  courseLookup,
}: {
  tasks: Array<{
    id: string;
    title: string;
    course_id: string;
    due_date: string | null;
    estimated_minutes: number;
    status: string;
  }>;
  availabilityRules: AvailabilityRule[];
  settings: PlannerSettings;
  timezone: string;
  existingBlocks: Array<{
    id: string;
    task_id: string | null;
    start_time: string;
    end_time: string;
    status: string;
  }>;
  courseLookup: Map<string, string>; // course_id → name
}): SuggestionResult {
  const now = new Date();
  const hasAvailability = availabilityRules.some((r) => r.rule_type === "available");
  const hasTasks = tasks.length > 0;

  // Check if there are future scheduled blocks (active plan)
  const hasActivePlan = existingBlocks.some(
    (b) => b.status === "scheduled" && new Date(b.start_time) > now
  );

  // Build today's remaining blocks
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todayRemainingBlocks: TodayBlock[] = existingBlocks
    .filter(
      (b) =>
        b.status === "scheduled" &&
        new Date(b.start_time) >= now &&
        new Date(b.start_time) <= todayEnd &&
        b.task_id
    )
    .map((b) => {
      const taskMatch = tasks.find((t) => t.id === b.task_id);
      return {
        id: b.id,
        taskId: b.task_id!,
        taskTitle: taskMatch?.title ?? "Unknown task",
        courseName: taskMatch ? (courseLookup.get(taskMatch.course_id) ?? null) : null,
        startTime: b.start_time,
        endTime: b.end_time,
        status: b.status,
        dueDate: taskMatch?.due_date ?? null,
      };
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // If no availability or no tasks, return early with metadata
  if (!hasAvailability || !hasTasks) {
    return { suggestions: [], hasActivePlan, hasAvailability, hasTasks, todayRemainingBlocks };
  }

  // Compute done minutes per task from completed blocks
  const doneMinutes = new Map<string, number>();
  for (const block of existingBlocks) {
    if (block.status === "done" && block.task_id) {
      const start = new Date(block.start_time);
      const end = new Date(block.end_time);
      const minutes = (end.getTime() - start.getTime()) / 60000;
      doneMinutes.set(block.task_id, (doneMinutes.get(block.task_id) ?? 0) + minutes);
    }
  }

  // Build schedulable tasks with adjusted estimated_minutes
  const schedulableTasks: SchedulableTask[] = tasks
    .filter((t) => t.status !== "done")
    .map((t) => {
      const done = doneMinutes.get(t.id) ?? 0;
      const remaining = Math.max(0, t.estimated_minutes - done);
      return {
        id: t.id,
        title: t.title,
        course_id: t.course_id,
        due_date: t.due_date,
        estimated_minutes: remaining,
        status: (t.status === "doing" ? "doing" : "todo") as "todo" | "doing",
      };
    })
    .filter((t) => t.estimated_minutes > 0);

  if (schedulableTasks.length === 0) {
    return { suggestions: [], hasActivePlan, hasAvailability, hasTasks, todayRemainingBlocks };
  }

  // Run the existing scheduler to get suggested blocks
  const result = generateSchedule(
    schedulableTasks,
    availabilityRules,
    settings,
    timezone,
    now
  );

  // Take top 5 suggested blocks and enrich with urgency
  const suggestions: StudySuggestion[] = result.blocks.slice(0, 5).map((block) => {
    const task = schedulableTasks.find((t) => t.id === block.task_id)!;
    const { urgency, urgencyLabel } = computeUrgency(task.due_date, task.estimated_minutes, now);
    return {
      taskId: task.id,
      taskTitle: task.title,
      courseName: courseLookup.get(task.course_id) ?? null,
      dueDate: task.due_date,
      remainingMinutes: task.estimated_minutes,
      suggestedStart: block.start_time.toISOString(),
      suggestedEnd: block.end_time.toISOString(),
      urgency,
      urgencyLabel,
    };
  });

  return { suggestions, hasActivePlan, hasAvailability, hasTasks, todayRemainingBlocks };
}
