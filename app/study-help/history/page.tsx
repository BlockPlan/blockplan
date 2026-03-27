import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import StudyHelpHistoryList from "./_components/StudyHelpHistoryList";
import Link from "next/link";
import { getUserPlan, getSavedSessionLimit } from "@/lib/subscription";

export default async function StudyHelpHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: sessions } = await supabase
    .from("study_help_sessions")
    .select("id, title, description, course_id, created_at, share_token")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const plan = await getUserPlan(user.id);
  const limit = getSavedSessionLimit(plan);
  const count = sessions?.length ?? 0;

  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="page-title">Study Help History</h1>
          <Link href="/study-help" className="btn-primary text-sm">
            + New Session
          </Link>
        </div>
        {limit !== Infinity && (
          <p className={`mb-4 text-xs ${count >= limit ? "text-red-500" : "text-gray-400"}`}>
            {count} of {limit} saved sessions used
            {count >= limit && (
              <> · <a href="/pricing" className="text-blue-600 underline">Upgrade</a> for more</>
            )}
          </p>
        )}
        <StudyHelpHistoryList sessions={sessions ?? []} />
      </main>
    </div>
  );
}
