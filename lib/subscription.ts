import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionPlan = "free" | "pro" | "max";

// ---------------------------------------------------------------------------
// Monthly generation limits per plan
// ---------------------------------------------------------------------------

const GENERATION_LIMITS: Record<SubscriptionPlan, number> = {
  free: 1,
  pro: 100,
  max: Infinity,
};

export function getMonthlyGenerationLimit(plan: SubscriptionPlan): number {
  return GENERATION_LIMITS[plan];
}

// ---------------------------------------------------------------------------
// Plan lookup
// ---------------------------------------------------------------------------

export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .single();
  return (data?.subscription_plan as SubscriptionPlan) ?? "free";
}

// ---------------------------------------------------------------------------
// Trial status — each user gets ONE 14-day free trial across all plans
// ---------------------------------------------------------------------------

export async function hasUsedTrial(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("user_profiles")
    .select("has_used_trial")
    .eq("id", userId)
    .single();
  return data?.has_used_trial === true;
}

export function canUseTutorChat(plan: SubscriptionPlan): boolean {
  return plan === "pro" || plan === "max";
}

// ---------------------------------------------------------------------------
// Usage tracking — counts study_help_sessions created this month
// ---------------------------------------------------------------------------

export async function getUserGenerationsThisMonth(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from("study_help_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", firstOfMonth);

  if (error) {
    console.error("[getUserGenerationsThisMonth] Error:", error);
    return 0;
  }

  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Illustration limits — free users get 1/month, Pro/Max unlimited (per session cap only)
// ---------------------------------------------------------------------------

const FREE_ILLUSTRATION_MONTHLY_LIMIT = 1;

export async function getUserMonthlyIllustrations(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Count illustrations created this month
  const { data, error } = await supabase
    .from("study_help_sessions")
    .select("data")
    .eq("user_id", userId)
    .gte("created_at", firstOfMonth);

  if (error) {
    console.error("[getUserMonthlyIllustrations] Error:", error);
    return 0;
  }

  let total = 0;
  for (const row of data ?? []) {
    const sessionData = row.data as { illustrations?: unknown[] } | null;
    total += sessionData?.illustrations?.length ?? 0;
  }
  return total;
}

export async function canGenerateIllustration(
  supabase: SupabaseClient,
  userId: string,
  plan: SubscriptionPlan
): Promise<{ allowed: boolean; used: number; limit: number }> {
  // Pro/Max — unlimited (per-session cap handled separately)
  if (plan !== "free") {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const used = await getUserMonthlyIllustrations(supabase, userId);
  return {
    allowed: used < FREE_ILLUSTRATION_MONTHLY_LIMIT,
    used,
    limit: FREE_ILLUSTRATION_MONTHLY_LIMIT,
  };
}

export async function canGenerateStudyHelp(
  supabase: SupabaseClient,
  userId: string,
  plan: SubscriptionPlan
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = getMonthlyGenerationLimit(plan);

  // Unlimited plan — skip the DB query
  if (limit === Infinity) {
    return { allowed: true, used: 0, limit };
  }

  const used = await getUserGenerationsThisMonth(supabase, userId);
  return { allowed: used < limit, used, limit };
}

// ---------------------------------------------------------------------------
// Syllabus / course limits — free users limited to 2 courses
// ---------------------------------------------------------------------------

const COURSE_LIMITS: Record<SubscriptionPlan, number> = {
  free: 2,
  pro: 10,
  max: Infinity,
};

export function getCourseLimitForPlan(plan: SubscriptionPlan): number {
  return COURSE_LIMITS[plan];
}

export async function canAddCourse(
  supabase: SupabaseClient,
  userId: string,
  plan: SubscriptionPlan
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = getCourseLimitForPlan(plan);

  if (limit === Infinity) {
    return { allowed: true, used: 0, limit };
  }

  const { count, error } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("[canAddCourse] Error:", error);
    return { allowed: true, used: 0, limit };
  }

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}

// ---------------------------------------------------------------------------
// Saved study session limits — free users limited to 2 saved sessions
// ---------------------------------------------------------------------------

const SAVED_SESSION_LIMITS: Record<SubscriptionPlan, number> = {
  free: 2,
  pro: 50,
  max: Infinity,
};

export function getSavedSessionLimit(plan: SubscriptionPlan): number {
  return SAVED_SESSION_LIMITS[plan];
}

export async function canSaveSession(
  supabase: SupabaseClient,
  userId: string,
  plan: SubscriptionPlan
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = getSavedSessionLimit(plan);

  if (limit === Infinity) {
    return { allowed: true, used: 0, limit };
  }

  const { count, error } = await supabase
    .from("study_help_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("[canSaveSession] Error:", error);
    return { allowed: true, used: 0, limit };
  }

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}
