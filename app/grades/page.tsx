import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NavHeader from "@/app/plan/_components/NavHeader";
import GradeOverview from "./_components/GradeOverview";
import {
  computeCourseGrade,
  computeGPA,
  type GradableTask,
} from "@/lib/services/grade-calculator";
import { DEFAULT_GRADING_SCALE } from "@/lib/validations/grade";

export default async function GradesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Fetch courses with grading scales
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, grading_scale")
    .eq("user_id", user.id)
    .order("name");

  // Fetch all tasks (grade, points, weight may be null)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, type, status, grade, points, weight, course_id, due_date")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  const safeCourses = (courses ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    gradingScale: (c.grading_scale as Record<string, number>) ?? null,
  }));

  const safeTasks = (tasks ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    type: t.type as string,
    status: t.status as string,
    grade: t.grade as number | null,
    points: t.points as number | null,
    weight: t.weight as number | null,
    course_id: t.course_id as string,
    due_date: t.due_date as string | null,
  }));

  // Group tasks by course
  const tasksByCourse = new Map<string, GradableTask[]>();
  for (const t of safeTasks) {
    const existing = tasksByCourse.get(t.course_id) ?? [];
    existing.push(t);
    tasksByCourse.set(t.course_id, existing);
  }

  // Compute grades per course
  const courseGrades = safeCourses.map((c) => {
    const courseTasks = tasksByCourse.get(c.id) ?? [];
    const scale = c.gradingScale ?? DEFAULT_GRADING_SCALE;
    return computeCourseGrade(c.id, c.name, courseTasks, scale);
  });

  const gpaResult = computeGPA(courseGrades);

  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="page-title mb-6">Grades</h2>

        {/* GPA Summary */}
        <div className="mb-8 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Semester GPA
              </p>
              <p className="mt-1 text-4xl font-bold text-gray-900">
                {gpaResult.gpa !== null ? gpaResult.gpa.toFixed(2) : "–"}
              </p>
            </div>
            <div className="flex gap-6 text-sm text-gray-600">
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {gpaResult.totalGraded}
                </p>
                <p className="text-xs text-gray-500">Graded</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {gpaResult.totalGradable}
                </p>
                <p className="text-xs text-gray-500">Total Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-gray-900">
                  {courseGrades.filter((c) => c.weightedAverage !== null).length}
                </p>
                <p className="text-xs text-gray-500">Courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Per-course grade cards */}
        <GradeOverview
          courseGrades={courseGrades}
          courses={safeCourses}
        />
      </main>
    </div>
  );
}
