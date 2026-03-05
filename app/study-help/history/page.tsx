import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import StudyHelpHistoryList from "./_components/StudyHelpHistoryList";
import Link from "next/link";

export default async function StudyHelpHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: sessions } = await supabase
    .from("study_help_sessions")
    .select("id, title, description, course_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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
        <StudyHelpHistoryList sessions={sessions ?? []} />
      </main>
    </div>
  );
}
