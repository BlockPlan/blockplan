/** Shared task type and status constants used across the app */

export const TASK_TYPES = [
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "reading", label: "Reading" },
  { value: "other", label: "Other" },
] as const;

export const TASK_STATUSES = [
  { value: "todo", label: "To Do", icon: "○", color: "border-gray-300 bg-gray-50 text-gray-700" },
  { value: "doing", label: "In Progress", icon: "◑", color: "border-blue-300 bg-blue-50 text-blue-700" },
  { value: "done", label: "Completed", icon: "●", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
] as const;

export const TYPE_BADGE_COLORS: Record<string, string> = {
  assignment: "bg-blue-100 text-blue-700",
  exam: "bg-red-100 text-red-700",
  reading: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-600",
};

export const TYPE_LABELS: Record<string, string> = {
  assignment: "Assignment",
  exam: "Exam",
  reading: "Reading",
  other: "Other",
};
