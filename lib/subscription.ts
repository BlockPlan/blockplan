import { createClient } from "@/lib/supabase/server";

export type SubscriptionPlan = "free" | "pro" | "max";

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
