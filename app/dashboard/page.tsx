import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";

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
      <NavHeader />

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
