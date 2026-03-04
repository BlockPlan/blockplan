import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavHeader from "@/app/plan/_components/NavHeader";
import TaskList from "./_components/TaskList";
import TaskFilters from "./_components/TaskFilters";

interface TasksPageProps {
  searchParams: Promise<{
    course?: string;
    type?: string;
    status?: string;
    sort?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Await searchParams — required in Next.js 16
  const params = await searchParams;
  const { course, type, status, sort } = params;

  // Fetch user's courses for filter dropdown and task form
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const courseList = courses ?? [];

  // If user has no courses, show a helpful message
  if (courseList.length === 0) {
    return (
      <div className="page-bg">
        <NavHeader />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="rounded-xl border border-gray-200 bg-white p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <svg
                className="h-7 w-7 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              No courses yet
            </h2>
            <p className="mb-6 text-gray-500">
              You need to add courses before creating tasks. Complete the
              onboarding wizard to get started.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add courses
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Build Supabase query with filters and sort
  let query = supabase
    .from("tasks")
    .select("*, courses(id, name)")
    .eq("user_id", user.id);

  // Apply filters
  if (course) query = query.eq("course_id", course);
  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);

  // Apply sort
  switch (sort) {
    case "course":
      // Sort by course name client-side after fetching (Supabase doesn't support relation ordering)
      query = query.order("created_at", { ascending: false });
      break;
    case "status":
      query = query.order("status", { ascending: true });
      break;
    case "created":
      query = query.order("created_at", { ascending: false });
      break;
    case "due_date":
    default:
      query = query.order("due_date", { ascending: true, nullsFirst: false });
      break;
  }

  const { data: tasks } = await query;
  let taskList = tasks ?? [];

  // Client-side sort for course (can't order by relation in Supabase)
  if (sort === "course") {
    taskList = [...taskList].sort((a, b) => {
      const nameA = (a.courses as { name: string } | null)?.name ?? "";
      const nameB = (b.courses as { name: string } | null)?.name ?? "";
      return nameA.localeCompare(nameB);
    });
  }

  // Fetch subtasks for all tasks
  const taskIds = taskList.map((t) => t.id as string);
  const { data: subtasks } = taskIds.length > 0
    ? await supabase
        .from("subtasks")
        .select("id, title, status, due_date, estimated_minutes, sort_order, task_id")
        .eq("user_id", user.id)
        .in("task_id", taskIds)
        .order("sort_order", { ascending: true })
    : { data: [] };

  // Group subtasks by task_id
  const subtasksByTask: Record<string, Array<{
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    estimated_minutes: number;
    sort_order: number;
    task_id: string;
  }>> = {};
  for (const s of subtasks ?? []) {
    const taskId = s.task_id as string;
    if (!subtasksByTask[taskId]) subtasksByTask[taskId] = [];
    subtasksByTask[taskId].push({
      id: s.id as string,
      title: s.title as string,
      status: s.status as string,
      due_date: s.due_date as string | null,
      estimated_minutes: s.estimated_minutes as number,
      sort_order: s.sort_order as number,
      task_id: taskId,
    });
  }

  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="page-title">Tasks</h2>
        </div>

        <TaskFilters
          courses={courseList}
          currentCourse={course}
          currentType={type}
          currentStatus={status}
          currentSort={sort}
        />

        <TaskList tasks={taskList} courses={courseList} subtasksByTask={subtasksByTask} />
      </main>
    </div>
  );
}
