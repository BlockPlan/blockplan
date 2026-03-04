import type { RecurrenceRule } from "@/lib/validations/recurrence";

interface ParentTaskData {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  type: string;
  estimated_minutes: number;
  points: number | null;
  weight: number | null;
  notes: string | null;
}

interface TaskInstance {
  user_id: string;
  course_id: string;
  title: string;
  type: string;
  status: "todo";
  estimated_minutes: number;
  due_date: string; // ISO string
  points: number | null;
  weight: number | null;
  notes: string | null;
  recurrence_parent_id: string;
}

/**
 * Generate recurring task instances from a parent task + recurrence rule.
 * Starts from the next occurrence after today and generates until end_date.
 */
export function generateRecurrenceInstances(
  parent: ParentTaskData,
  rule: RecurrenceRule
): TaskInstance[] {
  const instances: TaskInstance[] = [];
  const endDate = new Date(rule.end_date);
  endDate.setHours(23, 59, 59, 999);

  // Start from tomorrow
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);
  cursor.setHours(23, 59, 0, 0);

  // Generate up to 200 instances as a safety limit
  const MAX_INSTANCES = 200;

  while (cursor <= endDate && instances.length < MAX_INSTANCES) {
    const dayOfWeek = cursor.getDay(); // 0 = Sunday
    const isMatch =
      rule.frequency === "daily" || rule.days_of_week.includes(dayOfWeek);

    if (isMatch) {
      instances.push({
        user_id: parent.user_id,
        course_id: parent.course_id,
        title: parent.title,
        type: parent.type,
        status: "todo",
        estimated_minutes: parent.estimated_minutes,
        due_date: cursor.toISOString(),
        points: parent.points,
        weight: parent.weight,
        notes: parent.notes,
        recurrence_parent_id: parent.id,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return instances;
}
