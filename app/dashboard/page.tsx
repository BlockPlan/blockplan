import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { startOfDay, endOfDay } from "date-fns";
import { tz } from "@date-fns/tz";
import NavHeader from "@/app/plan/_components/NavHeader";
import DashboardContent from "./_components/DashboardContent";
import ReminderInit from "@/app/_components/ReminderInit";
import NotificationPermissionBanner from "@/app/_components/NotificationPermissionBanner";
import { computeCourseGrade, computeGPA, type GradableTask } from "@/lib/services/grade-calculator";
import { DEFAULT_GRADING_SCALE } from "@/lib/validations/grade";
import { computeStudySuggestions } from "@/lib/services/study-suggestions";
import { DEFAULT_PLANNER_SETTINGS } from "@/lib/validations/planner";
import type { AvailabilityRule } from "@/lib/services/scheduler";

interface RiskTask {
  taskId: string;
  taskTitle: string;
  level: "at_risk" | "overdue_risk";
}

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

  // Compute risk tasks
  const planningHorizonEnd = new Date();
  planningHorizonEnd.setDate(planningHorizonEnd.getDate() + 7);

  const riskTasks: RiskTask[] = [];
  const seenTaskIds = new Set<string>();

  if (allBlocks) {
    const scheduledMinutes = new Map<string, number>();
    for (const block of allBlocks) {
      if (!block.task_id || block.status === "missed") continue;
      const taskId = block.task_id as string;
      const start = new Date(block.start_time as string);
      const end = new Date(block.end_time as string);
      const minutes = (end.getTime() - start.getTime()) / 60000;
      scheduledMinutes.set(
        taskId,
        (scheduledMinutes.get(taskId) ?? 0) + minutes
      );
    }

    for (const block of allBlocks) {
      if (!block.tasks) continue;
      const taskId = block.task_id as string;
      if (seenTaskIds.has(taskId)) continue;
      seenTaskIds.add(taskId);

      const task = block.tasks as {
        title: string;
        estimated_minutes: number;
        due_date: string | null;
      };

      if (!task.due_date) continue;

      const dueDate = new Date(task.due_date);
      const now = new Date();
      const covered = scheduledMinutes.get(taskId) ?? 0;
      const isOverdue = dueDate <= now;
      const isDueSoon = dueDate <= planningHorizonEnd;

      if (isOverdue && covered < task.estimated_minutes) {
        riskTasks.push({
          taskId,
          taskTitle: task.title,
          level: "overdue_risk",
        });
      } else if (isDueSoon && covered < task.estimated_minutes) {
        riskTasks.push({
          taskId,
          taskTitle: task.title,
          level: "at_risk",
        });
      }
    }
  }

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

  // ── Study suggestions ─────────────────────────────────────────────────
  const { data: availRules } = await supabase
    .from("availability_rules")
    .select("day_of_week, start_time, end_time, rule_type")
    .eq("user_id", user.id);

  // Fetch all incomplete tasks for suggestions (reuse format)
  const { data: allIncompleteTasks } = await supabase
    .from("tasks")
    .select("id, title, type, due_date, estimated_minutes, status, course_id, courses(name)")
    .eq("user_id", user.id)
    .neq("status", "done");

  // Build course lookup map
  const courseLookup = new Map<string, string>();
  for (const t of allIncompleteTasks ?? []) {
    if (t.course_id && t.courses) {
      courseLookup.set(
        t.course_id as string,
        (t.courses as unknown as { name: string }).name
      );
    }
  }

  // Build blocks array for suggestions
  const blocksForSuggestions = (allBlocks ?? []).map((b) => ({
    id: b.id as string,
    task_id: (b.task_id as string | null),
    start_time: b.start_time as string,
    end_time: b.end_time as string,
    status: b.status as string,
  }));

  const suggestionResult = computeStudySuggestions({
    tasks: (allIncompleteTasks ?? []).map((t) => ({
      id: t.id as string,
      title: t.title as string,
      course_id: t.course_id as string,
      due_date: t.due_date as string | null,
      estimated_minutes: (t.estimated_minutes as number) ?? 30,
      status: t.status as string,
    })),
    availabilityRules: (availRules ?? []) as AvailabilityRule[],
    settings: plannerSettings,
    timezone,
    existingBlocks: blocksForSuggestions,
    courseLookup,
  });

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
          gpa={gpaResult.gpa}
          gradedCount={gpaResult.totalGraded}
          suggestionResult={suggestionResult}
        />
        <ReminderInit tasks={reminderTasks} />
      </main>
    </div>
  );
}
