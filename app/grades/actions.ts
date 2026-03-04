"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { gradeEntrySchema, gradingScaleSchema } from "@/lib/validations/grade";

// ── Types ────────────────────────────────────────────────────────────────

export type GradeState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
};

// ── Update a task's grade, points, and weight ───────────────────────────

export async function updateTaskGrade(
  prevState: GradeState,
  formData: FormData
): Promise<GradeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData);
  const result = gradeEntrySchema.safeParse(raw);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { task_id, grade, points, weight } = result.data;

  const updatePayload: Record<string, unknown> = {};
  if (grade !== undefined) updatePayload.grade = grade;
  else if ("grade" in raw && raw.grade === "") updatePayload.grade = null;
  if (points !== undefined) updatePayload.points = points;
  else if ("points" in raw && raw.points === "") updatePayload.points = null;
  if (weight !== undefined) updatePayload.weight = weight;
  else if ("weight" in raw && raw.weight === "") updatePayload.weight = null;

  if (Object.keys(updatePayload).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", task_id)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update grade. Please try again." };
  }

  revalidatePath("/grades");
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── Update a course's grading scale ─────────────────────────────────────

export async function updateCourseGradingScale(
  courseId: string,
  scale: Record<string, number>
): Promise<GradeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const parsed = gradingScaleSchema.safeParse(scale);
  if (!parsed.success) {
    return { error: "Invalid grading scale" };
  }

  const { error } = await supabase
    .from("courses")
    .update({ grading_scale: parsed.data })
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update grading scale." };
  }

  revalidatePath("/grades");
  return { success: true };
}
