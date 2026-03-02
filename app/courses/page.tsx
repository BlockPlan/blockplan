import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import CourseList from "./_components/CourseList";
import CourseForm from "./_components/CourseForm";

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
    redirect("/onboarding");
  }

  // Fetch courses for this term
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, meeting_times")
    .eq("term_id", term.id)
    .order("created_at", { ascending: true });

  const courseList = courses ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader />

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
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
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Add a course
          </h3>
          <CourseForm />
        </div>
      </main>
    </div>
  );
}
