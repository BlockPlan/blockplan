"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_MINUTES } from "@/lib/validations/task";
import type { ParsedItem } from "@/lib/syllabus/types";
import {
  generateSubtaskSuggestions,
  shouldSuggestSubtasks,
} from "@/lib/services/subtask-suggestions";

export async function confirmSyllabusItems(
  courseId: string,
  items: ParsedItem[]
): Promise<{ success: boolean; count?: number; subtaskCount?: number; error?: string }> {
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Verify courseId belongs to user (defense in depth alongside RLS)
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (courseError || !course) {
    return { success: false, error: "Invalid course — not found or not yours" };
  }

  // Validate items array is non-empty
  if (!items || items.length === 0) {
    return { success: false, error: "No items to confirm" };
  }

  // Map ParsedItem[] to task insert rows
  const inserts = items.map((item) => ({
    user_id: user.id,
    course_id: courseId,
    title: item.title,
    type: item.type,
    status: "todo" as const,
    due_date: item.dueDate ?? null,
    estimated_minutes:
      item.estimatedMinutes ?? DEFAULT_MINUTES[item.type] ?? 60,
    points: item.points ?? null,
    weight: item.weight ?? null,
    needs_review: item.needsReview,
  }));

  // Insert tasks and get back their IDs
  const { data: createdTasks, error } = await supabase
    .from("tasks")
    .insert(inserts)
    .select("id, title, type, due_date, estimated_minutes");

  if (error) {
    return { success: false, error: error.message };
  }

  // Auto-generate subtask milestones for qualifying tasks
  const subtaskInserts: Array<{
    user_id: string;
    task_id: string;
    title: string;
    status: "todo";
    due_date: string;
    estimated_minutes: number;
    sort_order: number;
  }> = [];

  for (const task of createdTasks ?? []) {
    const type = task.type as string;
    const minutes = task.estimated_minutes as number;
    const dueDate = task.due_date as string | null;

    if (!dueDate) continue; // Need a due date for work-back scheduling
    if (!shouldSuggestSubtasks(type, minutes)) continue;

    const suggestions = generateSubtaskSuggestions(
      new Date(dueDate),
      minutes,
      type
    );

    for (const s of suggestions) {
      subtaskInserts.push({
        user_id: user.id,
        task_id: task.id as string,
        title: s.title,
        status: "todo",
        due_date: s.due_date.toISOString(),
        estimated_minutes: s.estimated_minutes,
        sort_order: s.sort_order,
      });
    }
  }

  let subtaskCount = 0;
  if (subtaskInserts.length > 0) {
    const { error: subtaskError } = await supabase
      .from("subtasks")
      .insert(subtaskInserts);

    if (subtaskError) {
      console.error("[confirmSyllabusItems] Subtask insert error:", subtaskError.message);
      // Don't fail the whole operation — tasks were already created
    } else {
      subtaskCount = subtaskInserts.length;
    }
  }

  return {
    success: true,
    count: inserts.length,
    subtaskCount,
  };
}
