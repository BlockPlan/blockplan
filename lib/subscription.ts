import { createClient } from "@/lib/supabase/server";

export type SubscriptionPlan = "free" | "pro" | "max";

export async function getUserPlan(userId: string): Promise<SubscriptionPlan> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_profiles")
    .select("subscription_plan")
    .eq("id", userId)
    .single();

  return (data?.subscription_plan as SubscriptionPlan) ?? "free";
}

export function canUseTutorChat(plan: SubscriptionPlan): boolean {
  return plan === "pro" || plan === "max";
}
