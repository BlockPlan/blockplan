import { subDays, isAfter, startOfDay } from "date-fns";

export interface SubtaskSuggestion {
  title: string;
  due_date: Date;
  estimated_minutes: number;
  sort_order: number;
}

/**
 * Generate subtask suggestions with work-back scheduling from parent due date.
 * Due dates are clamped to not be earlier than today.
 */
export function generateSubtaskSuggestions(
  parentDueDate: Date,
  parentEstimatedMinutes: number,
): SubtaskSuggestion[] {
  const today = startOfDay(new Date());
  const clamp = (d: Date) => (isAfter(d, today) ? d : today);

  return [
    {
      title: "Outline",
      due_date: clamp(subDays(parentDueDate, 10)),
      estimated_minutes: Math.round(parentEstimatedMinutes * 0.15),
      sort_order: 0,
    },
    {
      title: "First Draft",
      due_date: clamp(subDays(parentDueDate, 7)),
      estimated_minutes: Math.round(parentEstimatedMinutes * 0.4),
      sort_order: 1,
    },
    {
      title: "Revise",
      due_date: clamp(subDays(parentDueDate, 3)),
      estimated_minutes: Math.round(parentEstimatedMinutes * 0.3),
      sort_order: 2,
    },
    {
      title: "Final Submit",
      due_date: parentDueDate,
      estimated_minutes: Math.round(parentEstimatedMinutes * 0.15),
      sort_order: 3,
    },
  ];
}

/**
 * Check if a task qualifies for subtask suggestions.
 * Only assignments with 4+ hours (240 minutes) get suggestions.
 */
export function shouldSuggestSubtasks(
  type: string,
  estimatedMinutes: number,
): boolean {
  return type === "assignment" && estimatedMinutes >= 240;
}
