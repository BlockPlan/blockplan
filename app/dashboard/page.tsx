import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { startOfDay, endOfDay } from "date-fns";
import { tz } from "@date-fns/tz";
import NavHeader from "@/app/plan/_components/NavHeader";
import DashboardContent from "./_components/DashboardContent";

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

  // Load user profile for timezone
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const timezone = (profile?.timezone as string | null) ?? "America/Boise";

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
            courses: { name: string } | null;
          }
        )?.title ?? "Unknown task",
        courseName:
          (
            nextScheduledBlock.tasks as {
              title: string;
              courses: { name: string } | null;
            }
          )?.courses?.name ?? null,
      }
    : null;

  // Today's block counts
  const todayBlockCount = safeToday.length;
  const todayDoneCount = safeToday.filter((b) => b.status === "done").length;

  // Map priority tasks
  const safePriorities = (priorityTasks ?? []).map((t) => ({
    id: t.id as string,
    title: t.title as string,
    type: t.type as string,
    due_date: t.due_date as string | null,
    estimated_minutes: t.estimated_minutes as number,
    courses: t.courses as unknown as { name: string } | null,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <DashboardContent
          nextBlock={nextBlock}
          priorityTasks={safePriorities}
          riskTasks={riskTasks}
          todayBlockCount={todayBlockCount}
          todayDoneCount={todayDoneCount}
        />
      </main>
    </div>
  );
}
