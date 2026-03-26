import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import CourseList from "./_components/CourseList";
import CourseForm from "./_components/CourseForm";

export const metadata: Metadata = {
  title: "Courses | BlockPlan",
  description: "Manage your enrolled courses",
};

export default async function CoursesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Get the user's active term
  const { data: term } = await supabase
    .from("terms")
    .select("id, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!term) {
    return (
      <div className="page-bg">
        <NavHeader />
        <main className="mx-auto max-w-3xl px-4 py-10 text-center">
          <h2 className="text-xl font-semibold text-gray-900">No term set up yet</h2>
          <p className="mt-2 text-gray-500">Set up your term and courses to get started.</p>
          <a href="/onboarding" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Set up now
          </a>
        </main>
      </div>
    );
  }

  // Fetch courses for this term
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, meeting_times")
    .eq("term_id", term.id)
    .order("created_at", { ascending: true });

  const courseList = courses ?? [];

  return (
    <div className="page-bg">
      <NavHeader />

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h2 className="page-title">Courses</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage your courses for{" "}
            <span className="font-medium text-gray-700">{term.name}</span>.
          </p>
        </div>

        {/* Existing courses */}
        <div className="mb-8">
          <CourseList courses={courseList} />
        </div>

        {/* Add course form */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Add a course
          </h3>
          <CourseForm />
        </div>
      </main>
    </div>
  );
}
