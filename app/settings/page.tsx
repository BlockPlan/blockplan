import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import DeleteAccountForm from "@/components/delete-account-form";
import PlannerSettingsForm from "@/app/settings/_components/PlannerSettings";
import { DEFAULT_PLANNER_SETTINGS, type PlannerSettings } from "@/lib/validations/planner";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Load existing planner settings from user_profiles (may not exist yet)
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
    <div className="min-h-screen bg-gray-50">
      <NavHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-8 text-2xl font-bold text-gray-900">Settings</h2>

        {/* Account Info */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Account</h3>
          <p className="text-sm text-gray-500">Signed in as {user.email}</p>
        </div>

        {/* Planning Preferences */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">
            Planning Preferences
          </h3>
          <p className="mb-6 text-sm text-gray-500">
            Configure how your study blocks are scheduled. These settings apply
            when generating your weekly plan.
          </p>
          <PlannerSettingsForm initialSettings={plannerSettings} />
        </div>

        {/* Delete Account Section */}
        <div className="rounded-lg border border-red-200 bg-white p-6">
          <h3 className="mb-2 text-lg font-semibold text-red-700">
            Delete Account
          </h3>
          <p className="mb-4 text-sm text-gray-600">
            This will permanently delete your account and all associated data
            including terms, courses, tasks, and uploaded syllabi. This action
            cannot be undone.
          </p>
          <DeleteAccountForm />
        </div>
      </main>
    </div>
  );
}
