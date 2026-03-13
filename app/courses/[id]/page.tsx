import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import Link from "next/link";
import { TYPE_BADGE_COLORS, TYPE_LABELS, TASK_STATUSES } from "@/lib/constants/tasks";
import { formatDueDate } from "@/lib/utils/date-formatting";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type MeetingTime = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export default async function CourseDetailPage({
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

  // Fetch course — verify ownership
  const { data: course } = await supabase
    .from("courses")
    .select("id, name, meeting_times")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!course) notFound();

  // Fetch tasks and study sessions in parallel
  const [{ data: tasks }, { data: sessions }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, type, status, due_date, estimated_minutes")
      .eq("course_id", id)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("study_help_sessions")
      .select("id, title, created_at")
      .eq("course_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const taskList = tasks ?? [];
  const sessionList = sessions ?? [];
  const meetingTimes = Array.isArray(course.meeting_times)
    ? (course.meeting_times as MeetingTime[])
    : [];

  const statusMap = Object.fromEntries(
    TASK_STATUSES.map((s) => [s.value, s])
  );

  return (
    <div className="page-bg min-h-screen">
      <NavHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/courses"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Courses
        </Link>

        {/* Course header */}
        <div className="mb-6">
          <h1 className="page-title">{course.name}</h1>
          {meetingTimes.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              {meetingTimes
                .map(
                  (t) =>
                    `${DAY_NAMES[t.day_of_week]} ${t.start_time}–${t.end_time}`
                )
                .join(" · ")}
            </p>
          )}
        </div>

        {/* Quick actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href={`/syllabi/upload?course_id=${course.id}`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            Upload Syllabus
          </Link>
          <Link
            href={`/study-help?course_id=${course.id}`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            AI Study Help
          </Link>
          <Link
            href={`/tasks?course=${course.id}`}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            View All Tasks
          </Link>
        </div>

        {/* Tasks section */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Tasks
            {taskList.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({taskList.length})
              </span>
            )}
          </h2>

          {taskList.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                No tasks yet.{" "}
                <Link
                  href={`/syllabi/upload?course_id=${course.id}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Upload a syllabus
                </Link>{" "}
                to auto-generate tasks, or{" "}
                <Link
                  href="/tasks"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  add them manually
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {taskList.map((task) => {
                const statusInfo = statusMap[task.status] ?? statusMap["todo"];
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                      <span className="truncate text-sm font-medium text-gray-900">
                        {task.title}
                      </span>
                      <span
                        className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLORS[task.type]}`}
                      >
                        {TYPE_LABELS[task.type]}
                      </span>
                    </div>
                    <div className="flex-shrink-0 ml-3 text-xs text-gray-400">
                      {task.due_date ? formatDueDate(task.due_date) : "No date"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Study Sessions section */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            Study Sessions
            {sessionList.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({sessionList.length})
              </span>
            )}
          </h2>

          {sessionList.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
              <p className="text-sm text-gray-500">
                No study sessions yet.{" "}
                <Link
                  href={`/study-help?course_id=${course.id}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Generate AI study materials
                </Link>{" "}
                for this course.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessionList.map((session) => (
                <Link
                  key={session.id}
                  href={`/study-help/${session.id}`}
                  className="block rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {session.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {new Date(session.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
