"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types for the import payload (sent from the client after preview)
// ---------------------------------------------------------------------------

export interface ImportEventPayload {
  summary: string;
  startTime: string; // ISO-8601
  endTime: string; // ISO-8601
  description?: string;
  location?: string;
}

// ---------------------------------------------------------------------------
// importCalendarEvents — bulk-create plan_blocks from parsed .ics events
// ---------------------------------------------------------------------------

export async function importCalendarEvents(events: ImportEventPayload[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, error: "Not authenticated" };
  }

  if (!events.length) {
    return { success: false as const, error: "No events to import" };
  }

  // We need a course to attach imported tasks to. Try to find or create an
  // "Imported" course under the user's most recent term.
  const { data: terms } = await supabase
    .from("terms")
    .select("id")
    .eq("user_id", user.id)
    .order("start_date", { ascending: false })
    .limit(1);

  let termId: string;
  if (terms && terms.length > 0) {
    termId = terms[0].id as string;
  } else {
    // Create a default term for the current semester
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 4, 0)
      .toISOString()
      .split("T")[0];

    const { data: newTerm, error: termErr } = await supabase
      .from("terms")
      .insert({
        user_id: user.id,
        name: `${now.getFullYear()} Term`,
        start_date: startDate,
        end_date: endDate,
      })
      .select("id")
      .single();

    if (termErr || !newTerm) {
      return {
        success: false as const,
        error: termErr?.message ?? "Failed to create term",
      };
    }
    termId = newTerm.id as string;
  }

  // Find or create the "Imported Calendar" course
  const { data: existingCourse } = await supabase
    .from("courses")
    .select("id")
    .eq("user_id", user.id)
    .eq("name", "Imported Calendar")
    .limit(1)
    .maybeSingle();

  let courseId: string;
  if (existingCourse) {
    courseId = existingCourse.id as string;
  } else {
    const { data: newCourse, error: courseErr } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        term_id: termId,
        name: "Imported Calendar",
      })
      .select("id")
      .single();

    if (courseErr || !newCourse) {
      return {
        success: false as const,
        error: courseErr?.message ?? "Failed to create course for imports",
      };
    }
    courseId = newCourse.id as string;
  }

  // Create a task for each event, then a plan_block pointing to it.
  // We batch inserts for efficiency.
  const taskInserts = events.map((evt) => {
    const start = new Date(evt.startTime);
    const end = new Date(evt.endTime);
    const durationMin = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 60000),
    );

    return {
      user_id: user.id,
      course_id: courseId,
      title: `[Imported] ${evt.summary}`,
      type: "other" as const,
      status: "doing" as const,
      estimated_minutes: durationMin,
      due_date: start.toISOString().split("T")[0],
    };
  });

  const { data: createdTasks, error: taskErr } = await supabase
    .from("tasks")
    .insert(taskInserts)
    .select("id");

  if (taskErr || !createdTasks) {
    return {
      success: false as const,
      error: taskErr?.message ?? "Failed to create tasks",
    };
  }

  // Now create plan_blocks linking each task to its time slot
  const blockInserts = createdTasks.map((task, i) => ({
    user_id: user.id,
    task_id: task.id as string,
    start_time: events[i].startTime,
    end_time: events[i].endTime,
    status: "scheduled" as const,
  }));

  const { error: blockErr } = await supabase
    .from("plan_blocks")
    .insert(blockInserts);

  if (blockErr) {
    return {
      success: false as const,
      error: blockErr.message,
    };
  }

  revalidatePath("/plan");
  revalidatePath("/dashboard");

  return {
    success: true as const,
    importedCount: events.length,
  };
}
