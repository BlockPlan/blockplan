"use server";

import { createClient } from "@/lib/supabase/server";
import { courseSchema } from "@/lib/validations/onboarding";
import { revalidatePath } from "next/cache";

export type CourseActionState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
};

// ─── Create Course ────────────────────────────────────────────────────────────

export async function createCourse(
  prevState: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Get the user's active term
  const { data: term } = await supabase
    .from("terms")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!term) {
    return { error: "No active term found. Please complete onboarding first." };
  }

  // Parse meeting times
  let meeting_times = undefined;
  const meetingTimesRaw = formData.get("meeting_times") as string | null;
  if (meetingTimesRaw) {
    try {
      meeting_times = JSON.parse(meetingTimesRaw);
    } catch {
      meeting_times = undefined;
    }
  }

  const raw = {
    name: formData.get("name") as string,
    meeting_times: meeting_times || undefined,
  };

  const result = courseSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("courses").insert({
    user_id: user.id,
    term_id: term.id,
    name: result.data.name,
    meeting_times: result.data.meeting_times ?? null,
  });

  if (error) {
    return { error: "Failed to add course. Please try again." };
  }

  revalidatePath("/courses");
  return { success: true };
}

// ─── Update Course ────────────────────────────────────────────────────────────

export async function updateCourse(
  prevState: CourseActionState,
  formData: FormData
): Promise<CourseActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const courseId = formData.get("id") as string;
  if (!courseId) {
    return { error: "Course ID is required." };
  }

  // Parse meeting times
  let meeting_times = undefined;
  const meetingTimesRaw = formData.get("meeting_times") as string | null;
  if (meetingTimesRaw) {
    try {
      meeting_times = JSON.parse(meetingTimesRaw);
    } catch {
      meeting_times = undefined;
    }
  }

  const raw = {
    name: formData.get("name") as string,
    meeting_times: meeting_times || undefined,
  };

  const result = courseSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { error } = await supabase
    .from("courses")
    .update({
      name: result.data.name,
      meeting_times: result.data.meeting_times ?? null,
    })
    .eq("id", courseId)
    .eq("user_id", user.id); // Defense in depth alongside RLS

  if (error) {
    return { error: "Failed to update course. Please try again." };
  }

  revalidatePath("/courses");
  return { success: true };
}

// ─── Delete Course ────────────────────────────────────────────────────────────

export async function deleteCourse(
  courseId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Verify ownership before delete
  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!course) {
    return { error: "Course not found." };
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to delete course. Please try again." };
  }

  revalidatePath("/courses");
  return {};
}
