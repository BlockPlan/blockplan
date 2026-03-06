import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavHeader from "@/app/plan/_components/NavHeader";
import DeleteAccountForm from "@/components/delete-account-form";
import PlannerSettingsForm from "@/app/settings/_components/PlannerSettings";
import SignOutButton from "@/components/sign-out-button";
import ChangePasswordButton from "@/app/profile/_components/ChangePasswordButton";
import {
  DEFAULT_PLANNER_SETTINGS,
  type PlannerSettings,
} from "@/lib/validations/planner";

export const metadata: Metadata = {
  title: "Profile | BlockPlan",
  description: "Manage your account, subscription, and preferences",
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Load planner settings
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("planner_settings")
    .eq("id", user.id)
    .single();

  const plannerSettings: PlannerSettings = {
    ...DEFAULT_PLANNER_SETTINGS,
    ...((profile?.planner_settings as Partial<PlannerSettings>) ?? {}),
  };

  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h2 className="page-title mb-8">Profile</h2>

        {/* Account Info */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Account</h3>

          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            {/* Password */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Password</p>
                <p className="text-sm text-gray-500">
                  Update your account password
                </p>
              </div>
              <ChangePasswordButton email={user.email ?? ""} />
            </div>

            {/* Sign Out */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Session</p>
                <p className="text-sm text-gray-500">
                  Sign out of your account
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </section>

        {/* Your Plan */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Plan</h3>
              <p className="mt-1 text-sm text-gray-500">
                You&apos;re currently on the{" "}
                <span className="font-semibold text-gray-900">Free</span> plan
              </p>
            </div>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
              Free
            </span>
          </div>

          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-sm text-blue-800">
              Unlock AI study help, smart scheduling, and more with Pro.
            </p>
            <Link
              href="/pricing"
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              View Plans & Pricing
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </section>

        {/* Planner Preferences */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">
            Planner Preferences
          </h3>
          <p className="mb-6 text-sm text-gray-500">
            Configure how your study blocks are scheduled. These settings apply
            when generating your weekly plan.
          </p>
          <PlannerSettingsForm initialSettings={plannerSettings} />
        </section>

        {/* Quick Links */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Resources
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href="/help"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg">
                📖
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Help & User Guide
                </p>
                <p className="text-xs text-gray-500">
                  Learn how to use BlockPlan
                </p>
              </div>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg">
                💎
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Plans & Pricing
                </p>
                <p className="text-xs text-gray-500">
                  Compare Free, Pro & MAX
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="rounded-xl border border-red-200 bg-red-50/30 p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-2 text-lg font-semibold text-red-700">
            Danger Zone
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            This will permanently delete your account and all associated data
            including terms, courses, tasks, and uploaded syllabi. This action
            cannot be undone.
          </p>
          <DeleteAccountForm />
        </section>
      </main>
    </div>
  );
}
