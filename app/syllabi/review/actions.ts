"use server";

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_MINUTES } from "@/lib/validations/task";
import type { ParsedItem } from "@/lib/syllabus/types";

export async function confirmSyllabusItems(
  courseId: string,
  items: ParsedItem[]
): Promise<{ success: boolean; count?: number; error?: string }> {
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

  const { error } = await supabase.from("tasks").insert(inserts);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: inserts.length };
}
