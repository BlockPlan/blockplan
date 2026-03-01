import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/sign-out-button";
import DeleteAccountForm from "@/components/delete-account-form";
import Link from "next/link";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">BlockPlan</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Dashboard
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-8 text-2xl font-bold text-gray-900">Settings</h2>

        {/* Account Info */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">Account</h3>
          <p className="text-sm text-gray-500">Signed in as {user.email}</p>
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
