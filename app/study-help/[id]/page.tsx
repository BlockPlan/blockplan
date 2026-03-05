import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import StudyHelpResults from "../_components/StudyHelpResults";
import type { StudyHelp } from "@/lib/study-help/types";
import Link from "next/link";

export default async function StudyHelpSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: session } = await supabase
    .from("study_help_sessions")
    .select("id, title, description, data, course_id")
    .eq("id", id)
    .eq("user_id", user.id)
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
            &larr; Back to History
          </Link>
        </div>
        <h1 className="page-title mb-2">{session.title}</h1>
        {session.description && (
          <p className="mb-4 text-sm text-gray-600">{session.description}</p>
        )}
        <StudyHelpResults
          data={session.data as StudyHelp}
          courseName={courseName}
        />
      </main>
    </div>
  );
}
