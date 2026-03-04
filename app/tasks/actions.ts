"use server";

import { createClient } from "@/lib/supabase/server";
import { taskSchema, taskUpdateSchema, DEFAULT_MINUTES } from "@/lib/validations/task";
import { recurrenceRuleSchema } from "@/lib/validations/recurrence";
import { generateRecurrenceInstances } from "@/lib/services/recurrence-generator";
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

  const { title, type, due_date, estimated_minutes, course_id, notes, grade, points, weight, reminder_minutes_before } = result.data;

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

  let { data: createdTask, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      course_id,
      title,
      type,
      status: "todo",
      estimated_minutes: finalEstimatedMinutes,
      due_date: due_date || null,
      notes: notes || null,
      grade: grade ?? null,
      points: points ?? null,
      weight: weight ?? null,
      reminder_minutes_before: reminder_minutes_before ?? null,
    })
    .select("id, type, estimated_minutes, due_date")
    .single();

  // If the notes column doesn't exist yet, retry without it
  if (error) {
    const retry = await supabase
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
    createdTask = retry.data;
    error = retry.error;
  }

  if (error) {
    return { error: "Failed to create task. Please try again." };
  }

  // Handle recurring task creation
  if (createdTask) {
    const recFrequency = formData.get("recurrence_frequency") as string | null;
    const recDays = formData.get("recurrence_days") as string | null;
    const recEndDate = formData.get("recurrence_end_date") as string | null;

    if ((recFrequency === "daily" || recFrequency === "weekly") && recEndDate) {
      const daysArray = recDays ? recDays.split(",").map(Number).filter((n) => !isNaN(n)) : [];
      const ruleParsed = recurrenceRuleSchema.safeParse({
        frequency: recFrequency,
        days_of_week: recFrequency === "daily" ? [] : daysArray,
        end_date: recEndDate,
      });

      if (ruleParsed.success) {
        // Save recurrence rule on the parent task
        await supabase
          .from("tasks")
          .update({ recurrence_rule: ruleParsed.data })
          .eq("id", createdTask.id)
          .eq("user_id", user.id);

        // Generate child instances
        const instances = generateRecurrenceInstances(
          {
            id: createdTask.id as string,
            user_id: user.id,
            course_id,
            title,
            type,
            estimated_minutes: finalEstimatedMinutes,
            points: points ?? null,
            weight: weight ?? null,
            notes: notes || null,
          },
          ruleParsed.data
        );

        if (instances.length > 0) {
          await supabase.from("tasks").insert(instances);
        }
      }
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/dashboard");
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
  if (updateFields.status !== undefined) updatePayload.status = updateFields.status;
  if (updateFields.type !== undefined) updatePayload.type = updateFields.type;
  if (updateFields.course_id !== undefined) updatePayload.course_id = updateFields.course_id;
  if (updateFields.estimated_minutes !== undefined)
    updatePayload.estimated_minutes = updateFields.estimated_minutes;
  // Always set due_date (allows clearing it)
  if ("due_date" in raw) {
    updatePayload.due_date = updateFields.due_date || null;
  }
  // Always set notes (allows clearing it)
  if ("notes" in raw) {
    updatePayload.notes = updateFields.notes || null;
  }
  // Grade fields (allow clearing)
  if ("grade" in raw) {
    updatePayload.grade = updateFields.grade ?? null;
  }
  if ("points" in raw) {
    updatePayload.points = updateFields.points ?? null;
  }
  if ("weight" in raw) {
    updatePayload.weight = updateFields.weight ?? null;
  }
  if ("reminder_minutes_before" in raw) {
    updatePayload.reminder_minutes_before = updateFields.reminder_minutes_before ?? null;
  }

  let { error } = await supabase
    .from("tasks")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", user.id); // Belt + suspenders alongside RLS

  // If the notes column doesn't exist yet, retry without it
  if (error && "notes" in updatePayload) {
    const { notes: _notes, ...payloadWithoutNotes } = updatePayload;
    const retry = await supabase
      .from("tasks")
      .update(payloadWithoutNotes)
      .eq("id", id)
      .eq("user_id", user.id);
    error = retry.error;
  }

  if (error) {
    return { error: "Failed to update task. Please try again." };
  }

  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/dashboard");
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
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to delete task. Please try again." };
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
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
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update task status." };
  }

  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  return {};
}

// Toggle a subtask's status between todo and done
export async function toggleSubtaskStatus(
  subtaskId: string,
  newStatus: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("subtasks")
    .update({ status: newStatus })
    .eq("id", subtaskId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update subtask status." };
  }

  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/dashboard");
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
  revalidatePath("/dashboard");
  return { success: true, count: subtasks.length };
}

// ── Recurring task operations ───────────────────────────────────────────

/**
 * Delete a recurring task with scope: "this" | "future" | "all"
 */
export async function deleteRecurringTask(
  taskId: string,
  scope: "this" | "future" | "all"
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Fetch the task to get its parent and due_date
  const { data: task } = await supabase
    .from("tasks")
    .select("id, recurrence_parent_id, due_date")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (!task) return { error: "Task not found" };

  const parentId = (task.recurrence_parent_id as string) ?? taskId;

  if (scope === "this") {
    // Just delete this one instance
    await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id);
  } else if (scope === "future") {
    // Delete this task and all future siblings
    const dueDate = task.due_date as string;
    if (dueDate) {
      await supabase
        .from("tasks")
        .delete()
        .eq("user_id", user.id)
        .eq("recurrence_parent_id", parentId)
        .gte("due_date", dueDate);
      // Also delete this task itself if it's a child
      if (task.recurrence_parent_id) {
        await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", user.id);
      }
    }
  } else {
    // Delete all: parent + all children (cascade handles children)
    await supabase.from("tasks").delete().eq("id", parentId).eq("user_id", user.id);
  }

  revalidatePath("/tasks");
  revalidatePath("/plan");
  revalidatePath("/dashboard");
  return {};
}
