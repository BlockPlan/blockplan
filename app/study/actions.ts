"use server";

import { createClient } from "@/lib/supabase/server";
import { generateStudyAids } from "@/lib/study/generate";
import type { StudyAids } from "@/lib/study/types";

export type StudyState = {
  error?: string;
  data?: StudyAids;
  isMock?: boolean;
  taskTitle?: string;
};

export async function generateStudyAidsAction(
  prevState: StudyState,
  formData: FormData
): Promise<StudyState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const taskId = formData.get("taskId") as string;
  const notes = formData.get("notes") as string;

  if (!notes || notes.trim().length === 0) {
    return { error: "Please paste some notes or chapter headings to generate study aids." };
  }

  // Validate task exists and belongs to user
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, type")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (taskError || !task) {
    return { error: "Task not found" };
  }

  // Only allow exam and reading tasks
  if (task.type !== "exam" && task.type !== "reading") {
    return {
      error:
        "Study sessions are only available for exam and reading tasks. This helps you prepare for tests and understand readings — not complete graded assignments.",
    };
  }

  const result = await generateStudyAids(notes);

  return {
    data: result.data,
    isMock: result.isMock,
    taskTitle: task.title,
  };
}
