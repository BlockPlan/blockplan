import type { Metadata } from "next";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "./_components/NavHeader";
import CalendarView from "./_components/CalendarView";

export const metadata: Metadata = {
  title: "Calendar | BlockPlan",
  description: "View and manage your study schedule",
};

interface RiskTask {
  taskId: string;
  taskTitle: string;
  level: "at_risk" | "overdue_risk";
}

export default async function PlanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Query ALL plan_blocks with task and course data (client filters by visible range)
  const { data: blocks } = await supabase
    .from("plan_blocks")
    .select("*, tasks(title, type, status, estimated_minutes, due_date, course_id, courses(name))")
    .eq("user_id", user.id)
    .order("start_time", { ascending: true });

  // Query ALL tasks with due dates (shown as due-date markers on the calendar)
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select("id, title, type, status, due_date, estimated_minutes, course_id, grade, points, weight, courses(name)")
    .eq("user_id", user.id)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  // Filter out tasks with broken/empty titles from bad parser runs
  const tasks = (rawTasks ?? []).filter((t) => {
    if (!t.title) return false;
    const title = (t.title as string).trim();
    if (!title) return false;
    // Reject generic section-header leftovers like "Assignments ():", "Assignments:", etc.
    if (/^(assignments?|homework|quizzes?|readings?|exams?|projects?)\s*(\(.*?\))?\s*:?\s*$/i.test(title)) return false;
    return true;
  });

  // Query subtasks (milestones) with parent task + course info
  const { data: rawSubtasks } = await supabase
    .from("subtasks")
    .select("id, title, status, due_date, estimated_minutes, sort_order, task_id, tasks(title, type, course_id, courses(name))")
    .eq("user_id", user.id)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true });

  // Query courses for the edit form
  const { data: rawCourses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  const courses = (rawCourses ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
  }));

  // Check if user has any availability rules
  const { count: availabilityCount } = await supabase
    .from("availability_rules")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const hasAvailability = (availabilityCount ?? 0) > 0;

  // Compute risk tasks
  const planningHorizonEnd = new Date();
  planningHorizonEnd.setDate(planningHorizonEnd.getDate() + 7);

  const riskTasks: RiskTask[] = [];
  const seenTaskIds = new Set<string>();

  if (blocks) {
    const scheduledMinutes = new Map<string, number>();
    for (const block of blocks) {
      if (!block.task_id || block.status === "missed") continue;
      const taskId = block.task_id as string;
      const start = new Date(block.start_time as string);
      const end = new Date(block.end_time as string);
      const minutes = (end.getTime() - start.getTime()) / 60000;
      scheduledMinutes.set(taskId, (scheduledMinutes.get(taskId) ?? 0) + minutes);
    }

    for (const block of blocks) {
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
        riskTasks.push({ taskId, taskTitle: task.title, level: "overdue_risk" });
      } else if (isDueSoon && covered < task.estimated_minutes) {
        riskTasks.push({ taskId, taskTitle: task.title, level: "at_risk" });
      }
    }
  }

  const safeBlocks = (blocks ?? []).map((b) => {
    const taskData = b.tasks as {
      title: string;
      type: string;
      status: string;
      estimated_minutes: number;
      due_date: string | null;
      course_id: string;
      courses: { name: string } | null;
    } | null;

    return {
      id: b.id as string,
      start_time: b.start_time as string,
      end_time: b.end_time as string,
      status: b.status as "scheduled" | "done" | "missed",
      task_id: (b.task_id as string) ?? null,
      tasks: taskData
        ? {
            title: taskData.title,
            type: taskData.type as "assignment" | "exam" | "reading" | "other",
            taskStatus: taskData.status as "todo" | "doing" | "done",
            estimated_minutes: taskData.estimated_minutes,
            due_date: taskData.due_date,
            course_id: taskData.course_id,
            courses: taskData.courses,
          }
        : null,
    };
  });

  const safeTasks = tasks.map((t) => ({
    id: t.id as string,
    title: t.title as string,
    type: t.type as "assignment" | "exam" | "reading" | "other",
    status: t.status as "todo" | "doing" | "done",
    due_date: t.due_date as string,
    estimated_minutes: t.estimated_minutes as number,
    course_id: t.course_id as string,
    courseName: (t.courses as unknown as { name: string } | null)?.name ?? null,
    grade: t.grade as number | null,
    points: t.points as number | null,
    weight: t.weight as number | null,
  }));

  const safeSubtasks = (rawSubtasks ?? []).map((s) => {
    const parentTask = s.tasks as unknown as {
      title: string;
      type: string;
      course_id: string;
      courses: { name: string } | null;
    } | null;

    return {
      id: s.id as string,
      title: s.title as string,
      status: s.status as "todo" | "done",
      due_date: s.due_date as string,
      estimated_minutes: s.estimated_minutes as number,
      sort_order: s.sort_order as number,
      task_id: s.task_id as string,
      parentTitle: parentTask?.title ?? "Task",
      parentType: parentTask?.type ?? "assignment",
      courseName: parentTask?.courses?.name ?? null,
    };
  });

  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Suspense fallback={<div className="text-center text-gray-400 py-8">Loading calendar...</div>}>
          <CalendarView
            blocks={safeBlocks}
            tasks={safeTasks}
            subtasks={safeSubtasks}
            riskTasks={riskTasks}
            hasAvailability={hasAvailability}
            courses={courses}
          />
        </Suspense>
      </main>
    </div>
  );
}
