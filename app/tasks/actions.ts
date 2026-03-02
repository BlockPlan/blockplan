"use server";

import { createClient } from "@/lib/supabase/server";
import { taskSchema, taskUpdateSchema, DEFAULT_MINUTES } from "@/lib/validations/task";
import { revalidatePath } from "next/cache";

// Shared return type for form actions
export type TaskState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
  task?: {
    id: string;
    type: string;
    estimated_minutes: number;
    due_date: string | null;
  };
};

// Create a new task
export async function createTask(
  prevState: TaskState,
  formData: FormData
): Promise<TaskState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const raw = Object.fromEntries(formData);
  const result = taskSchema.safeParse(raw);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { title, type, due_date, estimated_minutes, course_id } = result.data;

  // Apply default estimated_minutes if not provided (defense: use type-based default)
  const finalEstimatedMinutes = estimated_minutes ?? DEFAULT_MINUTES[type];

  // Verify course_id belongs to user (defense in depth alongside RLS)
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id")
    .eq("id", course_id)
    .eq("user_id", user.id)
    .single();

  if (courseError || !course) {
    return { error: "Invalid course selection" };
  }

  const { data: createdTask, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      course_id,
      title,
      type,
      status: "todo",
      estimated_minutes: finalEstimatedMinutes,
      due_date: due_date || null,
    })
    .select("id, type, estimated_minutes, due_date")
    .single();

  if (error) {
    return { error: "Failed to create task. Please try again." };
  }

  revalidatePath("/tasks");
  return {
    success: true,
    task: createdTask
      ? {
          id: createdTask.id as string,
          type: createdTask.type as string,
          estimated_minutes: createdTask.estimated_minutes as number,
          due_date: createdTask.due_date as string | null,
        }
      : undefined,
  };
}

// Update an existing task
export async function updateTask(
  prevState: TaskState,
  formData: FormData
): Promise<TaskState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const raw = Object.fromEntries(formData);
  const result = taskUpdateSchema.safeParse(raw);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { id, ...updateFields } = result.data;

  // Build update payload (only include defined fields)
  const updatePayload: Record<string, unknown> = {};
  if (updateFields.title !== undefined) updatePayload.title = updateFields.title;
  if (updateFields.type !== undefined) updatePayload.type = updateFields.type;
  if (updateFields.course_id !== undefined) updatePayload.course_id = updateFields.course_id;
  if (updateFields.estimated_minutes !== undefined)
    updatePayload.estimated_minutes = updateFields.estimated_minutes;
  // Always set due_date (allows clearing it)
  if ("due_date" in raw) {
    updatePayload.due_date = updateFields.due_date || null;
  }

  const { error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id); // Belt + suspenders alongside RLS

  if (error) {
    return { error: "Failed to update task. Please try again." };
  }

  revalidatePath("/tasks");
  return { success: true };
}

// Delete a task
export async function deleteTask(taskId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);
  // RLS ensures user can only delete their own tasks

  if (error) {
    return { error: "Failed to delete task. Please try again." };
  }

  revalidatePath("/tasks");
  return {};
}

// Fast-path status toggle — no Zod needed, just type assertion
export async function updateTaskStatus(
  taskId: string,
  newStatus: "todo" | "doing" | "done"
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId);
  // RLS ensures user can only update their own tasks

  if (error) {
    return { error: "Failed to update task status." };
  }

  revalidatePath("/tasks");
  return {};
}

// Create subtasks for a task (batch insert)
export async function createSubtasks(
  subtasks: Array<{
    task_id: string;
    title: string;
    due_date: string | null;
    estimated_minutes: number;
    sort_order: number;
  }>
): Promise<{ success?: boolean; count?: number; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  if (subtasks.length === 0) {
    return { success: true, count: 0 };
  }

  const rows = subtasks.map((s) => ({
    user_id: user.id,
    task_id: s.task_id,
    title: s.title,
    status: "todo" as const,
    due_date: s.due_date,
    estimated_minutes: s.estimated_minutes,
    sort_order: s.sort_order,
  }));

  const { error } = await supabase.from("subtasks").insert(rows);

  if (error) {
    return { error: "Failed to create subtasks. Please try again." };
  }

  revalidatePath("/tasks");
  return { success: true, count: subtasks.length };
}
