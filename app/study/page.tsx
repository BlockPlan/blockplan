import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavHeader from "@/app/plan/_components/NavHeader";
import StudySession from "./_components/StudySession";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ task_id?: string }>;
}) {
  const params = await searchParams;
  const taskId = params.task_id;

  if (!taskId) {
    redirect("/tasks");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch task to validate type and get title
  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, type")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (!task) {
    redirect("/tasks");
  }

  // Only allow exam and reading tasks
  if (task.type !== "exam" && task.type !== "reading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavHeader />
        <main className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-amber-800">
              Study Sessions for Exam &amp; Reading Tasks Only
            </h2>
            <p className="mb-4 text-sm text-amber-700">
              Study sessions help you prepare for tests and understand readings.
              They are not available for assignments or other task types.
            </p>
            <Link
              href="/tasks"
              className="inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Back to Tasks
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <StudySession taskId={task.id} taskTitle={task.title} />
      </main>
    </div>
  );
}
