import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { tz } from "@date-fns/tz";
import NavHeader from "@/app/plan/_components/NavHeader";
import DashboardContent from "./_components/DashboardContent";
import QuickNotes from "./_components/QuickNotes";
import ReminderInit from "@/app/_components/ReminderInit";
import NotificationPermissionBanner from "@/app/_components/NotificationPermissionBanner";
import { computeCourseGrade, computeGPA, type GradableTask } from "@/lib/services/grade-calculator";
import { calculateRiskTasks } from "@/lib/services/risk-calculator";
import { DEFAULT_GRADING_SCALE } from "@/lib/validations/grade";
import { DEFAULT_PLANNER_SETTINGS } from "@/lib/validations/planner";

export const metadata: Metadata = {
  title: "Dashboard | BlockPlan",
  description: "Your study schedule and progress at a glance",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Load user profile for timezone and planner settings
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("timezone, planner_settings")
    .eq("id", user.id)
    .single();

  const timezone = (profile?.timezone as string | null) ?? "America/Boise";
  const plannerSettings = (profile?.planner_settings as typeof DEFAULT_PLANNER_SETTINGS | null) ?? DEFAULT_PLANNER_SETTINGS;

  // Compute today's boundaries in user timezone
  const userTz = tz(timezone);
  const todayStart = startOfDay(new Date(), { in: userTz });
  const todayEnd = endOfDay(new Date(), { in: userTz });

  // Query 1: Today's blocks
  const { data: todayBlocks } = await supabase
    .from("plan_blocks")
    .select(
      "*, tasks(title, type, estimated_minutes, due_date, course_id, courses(name))"
    )
    .eq("user_id", user.id)
    .gte("start_time", todayStart.toISOString())
    .lte("start_time", todayEnd.toISOString())
    .order("start_time", { ascending: true });

  // Query 2: Top 5 priority tasks
  const { data: priorityTasks } = await supabase
    .from("tasks")
    .select(
      "id, title, type, due_date, estimated_minutes, status, course_id, courses(name)"
    )
    .eq("user_id", user.id)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(5);

  // Query 3: All plan_blocks for risk calculation
  const { data: allBlocks } = await supabase
    .from("plan_blocks")
    .select(
      "*, tasks(title, type, estimated_minutes, due_date, course_id, courses(name))"
    )
    .eq("user_id", user.id)
    .order("start_time", { ascending: true });

  // Compute risk tasks using shared calculator
  const riskTasks = calculateRiskTasks(
    (allBlocks ?? []).map((b) => ({
      task_id: (b.task_id as string) ?? null,
      start_time: b.start_time as string,
      end_time: b.end_time as string,
      status: b.status as string,
      tasks: b.tasks
        ? {
            title: (b.tasks as { title: string }).title,
            estimated_minutes: (b.tasks as { estimated_minutes: number }).estimated_minutes,
            due_date: (b.tasks as { due_date: string | null }).due_date,
          }
        : null,
    }))
  );

  // Compute next scheduled block (first scheduled block with start_time > now)
  const now = new Date();
  const safeToday = todayBlocks ?? [];
  const nextScheduledBlock = safeToday.find(
    (b) =>
      b.status === "scheduled" && new Date(b.start_time as string) > now
  );

  const nextBlock = nextScheduledBlock
    ? {
        id: nextScheduledBlock.id as string,
        start_time: nextScheduledBlock.start_time as string,
        end_time: nextScheduledBlock.end_time as string,
        taskTitle: (
          nextScheduledBlock.tasks as {
            title: string;
            due_date: string | null;
            courses: { name: string } | null;
          }
        )?.title ?? "Unknown task",
        courseName:
          (
            nextScheduledBlock.tasks as {
              title: string;
              due_date: string | null;
              courses: { name: string } | null;
            }
          )?.courses?.name ?? null,
        dueDate:
          (
            nextScheduledBlock.tasks as {
              title: string;
              due_date: string | null;
              courses: { name: string } | null;
            }
          )?.due_date ?? null,
      }
    : null;

  // Today's block counts
  const todayBlockCount = safeToday.length;
  const todayDoneCount = safeToday.filter((b) => b.status === "done").length;

  // Upcoming deadlines: tasks due within the next 3 days (not done)
  const threeDaysFromNow = addDays(todayEnd, 3);
  const { data: upcomingDeadlineRows } = await supabase
    .from("tasks")
    .select("id, title, type, due_date, status, course_id, courses(name)")
    .eq("user_id", user.id)
    .neq("status", "done")
    .not("due_date", "is", null)
    .lte("due_date", threeDaysFromNow.toISOString())
    .order("due_date", { ascending: true })
    .limit(5);

  const upcomingDeadlines = (upcomingDeadlineRows ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    type: t.type as string,
    due_date: t.due_date as string,
    courses: t.courses as unknown as { name: string } | null,
  }));

  // Overall task completion counts (all tasks for this user)
  const { data: allTaskRows } = await supabase
    .from("tasks")
    .select("id, status")
    .eq("user_id", user.id);

  const safeAllTasks = allTaskRows ?? [];
  const totalTaskCount = safeAllTasks.length;
  const totalTaskDoneCount = safeAllTasks.filter((t) => t.status === "done").length;

  // Map priority tasks
  const safePriorities = (priorityTasks ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    type: t.type as string,
    due_date: t.due_date as string | null,
    estimated_minutes: t.estimated_minutes as number,
    courses: t.courses as unknown as { name: string } | null,
  }));

  // ── GPA computation ────────────────────────────────────────────────────
  const { data: gpaCourses } = await supabase
    .from("courses")
    .select("id, name, grading_scale")
    .eq("user_id", user.id);

  const { data: gpaTasks } = await supabase
    .from("tasks")
    .select("id, title, type, grade, points, weight, course_id")
    .eq("user_id", user.id);

  const tasksByCourse = new Map<string, GradableTask[]>();
  for (const t of gpaTasks ?? []) {
    const cid = t.course_id as string;
    const existing = tasksByCourse.get(cid) ?? [];
    existing.push({
      id: t.id as string,
      title: t.title as string,
      type: t.type as string,
      grade: t.grade as number | null,
      points: t.points as number | null,
      weight: t.weight as number | null,
    });
    tasksByCourse.set(cid, existing);
  }

  const courseGrades = (gpaCourses ?? []).map((c) => {
    const scale = (c.grading_scale as Record<string, number>) ?? DEFAULT_GRADING_SCALE;
    return computeCourseGrade(c.id as string, c.name as string, tasksByCourse.get(c.id as string) ?? [], scale);
  });

  const gpaResult = computeGPA(courseGrades);

  // ── Reminder tasks for client-side scheduling ────────────────────────
  const { data: reminderRows } = await supabase
    .from("tasks")
    .select("id, title, due_date, reminder_minutes_before, course_id, courses(name)")
    .eq("user_id", user.id)
    .neq("status", "done")
    .not("reminder_minutes_before", "is", null)
    .not("due_date", "is", null);

  const reminderTasks = (reminderRows ?? [])
    .filter((t) => t.reminder_minutes_before != null && t.reminder_minutes_before > 0)
    .map((t) => ({
      id: t.id as string,
      title: t.title as string,
      due_date: t.due_date as string,
      reminder_minutes_before: t.reminder_minutes_before as number,
      courseName: (t.courses as unknown as { name: string } | null)?.name ?? null,
    }));

  // ── Quick notes ──────────────────────────────────────────────────────
  const { data: quickNotesRows } = await supabase
    .from("quick_notes")
    .select("id, content, created_at, completed")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quickNotes = (quickNotesRows ?? []).map((n: any) => ({
    id: n.id as string,
    content: n.content as string,
    completed: n.completed === true,
    created_at: n.created_at as string,
  }));

  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <NotificationPermissionBanner />
        <DashboardContent
          nextBlock={nextBlock}
          priorityTasks={safePriorities}
          riskTasks={riskTasks}
          todayBlockCount={todayBlockCount}
          todayDoneCount={todayDoneCount}
          todayTaskCount={totalTaskCount}
          todayTaskDoneCount={totalTaskDoneCount}
          upcomingDeadlines={upcomingDeadlines}
          gpa={gpaResult.gpa}
          gradedCount={gpaResult.totalGraded}
        />
        <QuickNotes initialNotes={quickNotes} />
        <ReminderInit tasks={reminderTasks} />
      </main>
    </div>
  );
}
