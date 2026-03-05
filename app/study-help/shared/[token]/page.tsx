import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
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

  // Fetch session by share token (no user_id check — this is public)
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
    <div className="page-bg min-h-screen">
      {/* Simple branded header for public pages */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-bold text-gray-900">
            BlockPlan
          </Link>
          <Link
            href="/auth"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Sign Up Free
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
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

        {/* CTA banner */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 text-center">
          <p className="text-lg font-semibold text-gray-900">
            Made with BlockPlan
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Turn your syllabi into study plans, flashcards, and quizzes — automatically.
          </p>
          <Link
            href="/auth"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Get Started Free
          </Link>
        </div>
      </main>
    </div>
  );
}
