"use server";

import { createClient } from "@/lib/supabase/server";
import { termSchema, courseSchema } from "@/lib/validations/onboarding";
import { availabilityRulesArraySchema } from "@/lib/validations/availability";
import { revalidatePath } from "next/cache";

// --- Term Actions ---

export type TermState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
  termId?: string;
};

export async function createTerm(
  prevState: TermState,
  formData: FormData
): Promise<TermState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const raw = {
    name: formData.get("name") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
  };

  const result = termSchema.safeParse(raw);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Check if user already has a term (single term per user for MVP)
  const { data: existingTerm } = await supabase
    .from("terms")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (existingTerm) {
    return { error: "You already have a term. Please continue to the next step." };
  }

  const { data, error } = await supabase
    .from("terms")
    .insert({
      user_id: user.id,
      name: result.data.name,
      start_date: result.data.start_date,
      end_date: result.data.end_date,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create term. Please try again." };
  }

  revalidatePath("/onboarding");
  return { success: true, termId: data.id };
}

// --- Course Actions ---

export type CourseState = {
  errors?: Record<string, string[]>;
  error?: string;
  success?: boolean;
  course?: { id: string; name: string; meeting_times: unknown };
};

export async function addCourse(
  prevState: CourseState,
  formData: FormData
): Promise<CourseState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Parse meeting times from JSON string (built by client)
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

  const termId = formData.get("term_id") as string;
  if (!termId) {
    return { error: "Term ID is required" };
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      term_id: termId,
      name: result.data.name,
      meeting_times: result.data.meeting_times ?? null,
    })
    .select("id, name, meeting_times")
    .single();

  if (error) {
    return { error: "Failed to add course. Please try again." };
  }

  revalidatePath("/onboarding");
  return { success: true, course: data };
}

// --- Availability Actions ---

export type AvailabilityState = {
  error?: string;
  success?: boolean;
};

export async function saveAvailabilityRules(
  prevState: AvailabilityState,
  formData: FormData
): Promise<AvailabilityState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const rulesRaw = formData.get("rules") as string | null;
  if (!rulesRaw) {
    return { error: "No availability rules provided." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rulesRaw);
  } catch {
    return { error: "Invalid rules format." };
  }

  const result = availabilityRulesArraySchema.safeParse(parsed);
  if (!result.success) {
    const firstError =
      result.error.errors[0]?.message ?? "Invalid availability rules.";
    return { error: firstError };
  }

  // Delete-all + insert-new batch pattern
  const { error: deleteError } = await supabase
    .from("availability_rules")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: "Failed to clear existing availability rules." };
  }

  if (result.data.length > 0) {
    const rows = result.data.map((rule) => ({
      user_id: user.id,
      day_of_week: rule.day_of_week,
      start_time: rule.start_time,
      end_time: rule.end_time,
      rule_type: rule.rule_type,
      label: rule.label ?? null,
    }));

    const { error: insertError } = await supabase
      .from("availability_rules")
      .insert(rows);

    if (insertError) {
      return { error: "Failed to save availability rules." };
    }
  }

  revalidatePath("/onboarding");
  return { success: true };
}

export async function deleteCourse(courseId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", courseId)
    .eq("user_id", user.id); // Defense in depth alongside RLS

  if (error) {
    return { error: "Failed to delete course. Please try again." };
  }

  revalidatePath("/onboarding");
  return {};
}
