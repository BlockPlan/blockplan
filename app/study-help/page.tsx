import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import StudyHelpSession from "./_components/StudyHelpSession";

export const metadata: Metadata = {
  title: "Study Help | BlockPlan",
  description: "AI-powered study materials and flashcards",
};

export default async function StudyHelpPage({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch user's courses for the optional course selector
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <StudyHelpSession
          courses={courses ?? []}
          initialCourseId={params.course_id}
        />
      </main>
    </div>
  );
}
