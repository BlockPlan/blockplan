import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionPlan = "free" | "pro" | "max";

// ---------------------------------------------------------------------------
// Monthly generation limits per plan
// ---------------------------------------------------------------------------

const GENERATION_LIMITS: Record<SubscriptionPlan, number> = {
  free: 1,
  pro: 15,
  max: 50,
};

export function getMonthlyGenerationLimit(plan: SubscriptionPlan): number {
  return GENERATION_LIMITS[plan];
}

// ---------------------------------------------------------------------------
// Plan lookup
// ---------------------------------------------------------------------------

export async function getUserPlan(_userId: string): Promise<SubscriptionPlan> {
  // TODO: Re-enable DB lookup once Stripe billing is live
  // const supabase = await createClient();
  // const { data } = await supabase
  //   .from("user_profiles")
  //   .select("subscription_plan")
  //   .eq("id", _userId)
  //   .single();
  // return (data?.subscription_plan as SubscriptionPlan) ?? "free";

  return "max";
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
