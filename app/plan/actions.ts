"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateSchedule } from "@/lib/services/scheduler";
import {
  DEFAULT_PLANNER_SETTINGS,
  type PlannerSettings,
} from "@/lib/validations/planner";
import type {
  AvailabilityRule,
  SchedulableTask,
  SchedulerResult,
} from "@/lib/services/scheduler";

// ---------------------------------------------------------------------------
// Private helper — shared scheduling logic for generatePlan and markBlockMissed
// ---------------------------------------------------------------------------

async function _runScheduler(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  planStart: Date,
): Promise<{
  result: SchedulerResult;
  settings: PlannerSettings;
  timezone: string;
  subtaskToParent: Map<string, string>;
}> {
  // Load incomplete tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, course_id, due_date, estimated_minutes, status")
    .eq("user_id", userId)
    .neq("status", "done");

  // Load incomplete subtasks (milestones) — these replace their parent tasks in scheduling
  const { data: subtasks } = await supabase
    .from("subtasks")
    .select("id, title, status, due_date, estimated_minutes, task_id")
    .eq("user_id", userId)
    .neq("status", "done");

  // Load availability rules
  const { data: rules } = await supabase
    .from("availability_rules")
    .select("day_of_week, start_time, end_time, rule_type")
    .eq("user_id", userId);

  // Load user profile (planner_settings, timezone)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("planner_settings, timezone")
    .eq("id", userId)
    .maybeSingle();

  const settings: PlannerSettings = {
    ...DEFAULT_PLANNER_SETTINGS,
    ...((profile?.planner_settings as Partial<PlannerSettings>) ?? {}),
  };

  const timezone = (profile?.timezone as string | null) ?? "America/Boise";

  // Group subtasks by parent task_id
  const subtasksByParent = new Map<string, typeof subtasks>();
  for (const s of subtasks ?? []) {
    const parentId = s.task_id as string;
    if (!subtasksByParent.has(parentId)) subtasksByParent.set(parentId, []);
    subtasksByParent.get(parentId)!.push(s);
  }

  // Build schedulable items: if a task has incomplete subtasks, schedule those instead.
  // We use a subtask→parent mapping so plan_blocks reference the parent task_id.
  const subtaskToParent = new Map<string, string>(); // subtaskId → parentTaskId
  const schedulableTasks: SchedulableTask[] = [];

  for (const t of tasks ?? []) {
    const taskId = t.id as string;
    const taskSubtasks = subtasksByParent.get(taskId);

    if (taskSubtasks && taskSubtasks.length > 0) {
      // Schedule each subtask individually (they have their own due dates and time estimates)
      for (const s of taskSubtasks) {
        const subId = s.id as string;
        subtaskToParent.set(subId, taskId);
        schedulableTasks.push({
          id: subId, // Unique subtask ID for scheduling
          title: `${s.title as string} — ${t.title as string}`,
          course_id: t.course_id as string,
          due_date: (s.due_date as string | null) ?? (t.due_date as string | null),
          estimated_minutes: s.estimated_minutes as number,
          status: t.status as "todo" | "doing",
        });
      }
    } else {
      // No subtasks — schedule the parent task directly
      schedulableTasks.push({
        id: taskId,
        title: t.title as string,
        course_id: t.course_id as string,
        due_date: t.due_date as string | null,
        estimated_minutes: t.estimated_minutes as number,
        status: t.status as "todo" | "doing",
      });
    }
  }

  const availabilityRules: AvailabilityRule[] = (rules ?? []).map((r) => ({
    day_of_week: r.day_of_week as number,
    start_time: r.start_time as string,
    end_time: r.end_time as string,
    rule_type: r.rule_type as "available" | "blocked" | "preferred",
  }));

  const result = generateSchedule(
    schedulableTasks,
    availabilityRules,
    settings,
    timezone,
    planStart,
  );

  return { result, settings, timezone, subtaskToParent };
}

// ---------------------------------------------------------------------------
// generatePlan — create a fresh 7-day plan
// ---------------------------------------------------------------------------

export async function generatePlan() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const planStart = new Date();
  const { result, subtaskToParent } = await _runScheduler(supabase, user.id, planStart);

  // Delete existing scheduled (not done/missed) blocks
  await supabase
    .from("plan_blocks")
    .delete()
    .eq("user_id", user.id)
    .eq("status", "scheduled");

  // Insert new blocks — remap subtask IDs back to parent task IDs for plan_blocks FK
  if (result.blocks.length > 0) {
    await supabase.from("plan_blocks").insert(
      result.blocks.map((block) => ({
        user_id: user.id,
        task_id: subtaskToParent.get(block.task_id) ?? block.task_id,
        start_time: block.start_time.toISOString(),
        end_time: block.end_time.toISOString(),
        status: "scheduled",
      })),
    );
  }

  revalidatePath("/plan");
  revalidatePath("/plan/day");
  revalidatePath("/dashboard");

  return {
    success: true,
    blocksScheduled: result.blocks.length,
    unscheduledTaskIds: result.unscheduled.map((t) => t.id),
    riskTasks: result.risk_tasks.map((rt) => ({
      taskId: rt.task.id,
      taskTitle: rt.task.title,
      level: rt.level,
    })),
  };
}

// ---------------------------------------------------------------------------
// markBlockDone — set a block status to done
// ---------------------------------------------------------------------------

export async function markBlockDone(blockId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  await supabase
    .from("plan_blocks")
    .update({ status: "done" })
    .eq("id", blockId)
    .eq("user_id", user.id);

  revalidatePath("/plan");
  revalidatePath("/plan/day");
  revalidatePath("/dashboard");

  return { success: true };
}

// ---------------------------------------------------------------------------
// resetBlockStatus — undo done/missed, set block back to scheduled
// ---------------------------------------------------------------------------

export async function resetBlockStatus(blockId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  await supabase
    .from("plan_blocks")
    .update({ status: "scheduled" })
    .eq("id", blockId)
    .eq("user_id", user.id);

  revalidatePath("/plan");
  revalidatePath("/plan/day");
  revalidatePath("/dashboard");

  return { success: true };
}

// ---------------------------------------------------------------------------
// markBlockMissed — set a block status to missed, then auto-reschedule
// ---------------------------------------------------------------------------

export async function markBlockMissed(blockId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Mark the block as missed
  await supabase
    .from("plan_blocks")
    .update({ status: "missed" })
    .eq("id", blockId)
    .eq("user_id", user.id);

  // Auto-reschedule: delete future scheduled blocks, generate new plan from now
  const planStart = new Date();
  const { result: newResult, subtaskToParent: newSubtaskMap } = await _runScheduler(
    supabase,
    user.id,
    planStart,
  );

  // Delete only future scheduled blocks (keep done/missed history)
  await supabase
    .from("plan_blocks")
    .delete()
    .eq("user_id", user.id)
    .eq("status", "scheduled");

  // Insert newly generated blocks — remap subtask IDs to parent task IDs
  if (newResult.blocks.length > 0) {
    await supabase.from("plan_blocks").insert(
      newResult.blocks.map((block) => ({
        user_id: user.id,
        task_id: newSubtaskMap.get(block.task_id) ?? block.task_id,
        start_time: block.start_time.toISOString(),
        end_time: block.end_time.toISOString(),
        status: "scheduled",
      })),
    );
  }

  revalidatePath("/plan");
  revalidatePath("/plan/day");
  revalidatePath("/dashboard");

  return { success: true, rescheduledCount: newResult.blocks.length };
}
