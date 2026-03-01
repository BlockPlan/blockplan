import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/sign-out-button";
import Link from "next/link";

export default async function DashboardPage() {
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
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Settings
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Dashboard</h2>
          <p className="mb-4 text-gray-500">Dashboard coming in Phase 5</p>
          <p className="text-sm text-gray-400">Signed in as {user.email}</p>
        </div>
      </main>
    </div>
  );
}
