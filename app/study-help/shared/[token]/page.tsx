import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import type { StudyHelp } from "@/lib/study-help/types";
import Link from "next/link";
import SharedSessionView from "./_components/SharedSessionView";

export default async function SharedStudyHelpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Fetch session by share token (any authenticated user can view)
  const { data: session } = await supabase
    .from("study_help_sessions")
    .select("id, title, description, data, course_id, share_token")
    .eq("share_token", token)
    .single();

  if (!session) notFound();

  // Resolve course name if available
  let courseName: string | undefined;
  if (session.course_id) {
    const { data: course } = await supabase
      .from("courses")
      .select("name")
      .eq("id", session.course_id)
      .single();
    courseName = (course?.name as string) ?? undefined;
  }

  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-4">
          <Link
            href="/study-help/history"
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; Back to My Sessions
          </Link>
        </div>
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Shared with you
        </div>
        <h1 className="page-title mb-2">{session.title}</h1>
        {session.description && (
          <p className="mb-4 text-sm text-gray-600">
            {session.description}
          </p>
        )}
        {courseName && (
          <p className="mb-4 text-xs font-medium text-blue-600">{courseName}</p>
        )}

        <SharedSessionView data={session.data as StudyHelp} />
      </main>
    </div>
  );
}
