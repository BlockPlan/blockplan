import { subDays, isAfter, startOfDay } from "date-fns";

export interface SubtaskSuggestion {
  title: string;
  due_date: Date;
  estimated_minutes: number;
  sort_order: number;
}

/**
 * Clamp a date so it's never earlier than today.
 */
function clamp(d: Date): Date {
  const today = startOfDay(new Date());
  return isAfter(d, today) ? d : today;
}

// ---------------------------------------------------------------------------
// Type-specific milestone templates
// ---------------------------------------------------------------------------

function assignmentMilestones(
  parentDueDate: Date,
  totalMinutes: number
): SubtaskSuggestion[] {
  return [
    {
      title: "Start Outline",
      due_date: clamp(subDays(parentDueDate, 10)),
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.15)),
      sort_order: 0,
    },
    {
      title: "Complete First Draft",
      due_date: clamp(subDays(parentDueDate, 7)),
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.4)),
      sort_order: 1,
    },
    {
      title: "Revise & Edit",
      due_date: clamp(subDays(parentDueDate, 3)),
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.3)),
      sort_order: 2,
    },
    {
      title: "Final Review & Submit",
      due_date: parentDueDate,
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.15)),
      sort_order: 3,
    },
  ];
}

function examMilestones(
  parentDueDate: Date,
  totalMinutes: number
): SubtaskSuggestion[] {
  return [
    {
      title: "Review Notes & Materials",
      due_date: clamp(subDays(parentDueDate, 10)),
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.25)),
      sort_order: 0,
    },
    {
      title: "Practice Problems / Flashcards",
      due_date: clamp(subDays(parentDueDate, 6)),
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.35)),
      sort_order: 1,
    },
    {
      title: "Mock Exam / Self-Test",
      due_date: clamp(subDays(parentDueDate, 3)),
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.25)),
      sort_order: 2,
    },
    {
      title: "Final Review",
      due_date: parentDueDate,
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.15)),
      sort_order: 3,
    },
  ];
}

function readingMilestones(
  parentDueDate: Date,
  totalMinutes: number
): SubtaskSuggestion[] {
  return [
    {
      title: "Skim & Preview",
      due_date: clamp(subDays(parentDueDate, 5)),
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.2)),
      sort_order: 0,
    },
    {
      title: "Deep Read & Take Notes",
      due_date: clamp(subDays(parentDueDate, 2)),
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.6)),
      sort_order: 1,
    },
    {
      title: "Summarize Key Points",
      due_date: parentDueDate,
      estimated_minutes: Math.max(15, Math.round(totalMinutes * 0.2)),
      sort_order: 2,
    },
  ];
}

// ---------------------------------------------------------------------------
// Main exports
// ---------------------------------------------------------------------------

/**
 * Generate subtask suggestions with work-back scheduling from parent due date.
 * Returns type-specific milestones. Due dates are clamped to not be earlier than today.
 */
export function generateSubtaskSuggestions(
  parentDueDate: Date,
  parentEstimatedMinutes: number,
  parentType: string = "assignment"
): SubtaskSuggestion[] {
  switch (parentType) {
    case "exam":
      return examMilestones(parentDueDate, parentEstimatedMinutes);
    case "reading":
      return readingMilestones(parentDueDate, parentEstimatedMinutes);
    default:
      return assignmentMilestones(parentDueDate, parentEstimatedMinutes);
  }
}

/**
 * Check if a task qualifies for subtask suggestions.
 * Assignments, exams, and readings with 60+ minutes (1 hour) get suggestions.
 * Tasks must also have a due date for work-back scheduling to work.
 */
export function shouldSuggestSubtasks(
  type: string,
  estimatedMinutes: number
): boolean {
  const eligibleTypes = ["assignment", "exam", "reading"];
  return eligibleTypes.includes(type) && estimatedMinutes >= 60;
}
