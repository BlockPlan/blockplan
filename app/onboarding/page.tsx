import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WizardShell from "./_components/WizardShell";
import SignOutButton from "@/components/sign-out-button";

export const metadata: Metadata = {
  title: "Get Started | BlockPlan",
  description: "Set up your study schedule",
};

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch the user's term (single term per user for MVP)
  const { data: term } = await supabase
    .from("terms")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch courses if a term exists
  const { data: courses } = term
    ? await supabase
        .from("courses")
        .select("id, name, meeting_times")
        .eq("term_id", term.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  // Fetch availability rules (full data for pre-filling the grid)
  const { data: availabilityRules } = await supabase
    .from("availability_rules")
    .select("day_of_week, start_time, end_time, rule_type, label")
    .eq("user_id", user.id)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  const hasTerm = !!term;
  const hasCourses = (courses ?? []).length > 0;
  const hasAvailability = (availabilityRules ?? []).length > 0;

  // Returning user check: has term, courses, and availability — send to dashboard
  if (hasTerm && hasCourses && hasAvailability) {
    redirect("/dashboard");
  }

  // Compute which wizard step to resume at
  let currentStep: number;
  if (!hasTerm) {
    currentStep = 1;
  } else if (!hasCourses) {
    currentStep = 2;
  } else if (!hasAvailability) {
    currentStep = 3;
  } else {
    currentStep = 4;
  }

  return (
    <div className="page-bg">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">BlockPlan</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to BlockPlan
          </h2>
          <p className="mt-2 text-gray-500">
            Let&apos;s set up your term and courses so you can start planning.
          </p>
          <a
            href="/dashboard"
            className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Skip for now — go to dashboard →
          </a>
        </div>

        <WizardShell
          initialStep={currentStep}
          termId={term?.id ?? null}
          courses={courses ?? []}
          availabilityRules={(availabilityRules ?? []).map((r) => ({
            day_of_week: r.day_of_week as number,
            start_time: r.start_time as string,
            end_time: r.end_time as string,
            rule_type: r.rule_type as "available" | "blocked" | "preferred",
            label: r.label as string | undefined,
          }))}
        />
      </main>
    </div>
  );
}
