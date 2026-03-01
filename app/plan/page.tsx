import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/sign-out-button";
import PlanGrid from "./_components/PlanGrid";

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

  // Query plan_blocks with task and course data
  const { data: blocks } = await supabase
    .from("plan_blocks")
    .select("*, tasks(title, type, estimated_minutes, due_date, course_id, courses(name))")
    .eq("user_id", user.id)
    .order("start_time", { ascending: true });

  // Check if user has any availability rules
  const { count: availabilityCount } = await supabase
    .from("availability_rules")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const hasAvailability = (availabilityCount ?? 0) > 0;

  // Compute risk tasks inline: tasks with no plan_blocks or insufficient planned minutes
  // relative to their due date and estimated time.
  // Simplified: gather unique tasks that have blocks; flag those with status != done
  // that have due_date before end of planning horizon (7 days from now) and insufficient coverage.
  const planningHorizonEnd = new Date();
  planningHorizonEnd.setDate(planningHorizonEnd.getDate() + 7);

  const riskTasks: RiskTask[] = [];
  const seenTaskIds = new Set<string>();

  if (blocks) {
    // Group scheduled minutes per task from plan_blocks
    const scheduledMinutes = new Map<string, number>();
    for (const block of blocks) {
      if (!block.task_id || block.status === "missed") continue;
      const taskId = block.task_id as string;
      const start = new Date(block.start_time as string);
      const end = new Date(block.end_time as string);
      const minutes = (end.getTime() - start.getTime()) / 60000;
      scheduledMinutes.set(taskId, (scheduledMinutes.get(taskId) ?? 0) + minutes);
    }

    // Identify at-risk tasks from block data
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

  const safeBlocks = (blocks ?? []).map((b) => ({
    id: b.id as string,
    start_time: b.start_time as string,
    end_time: b.end_time as string,
    status: b.status as "scheduled" | "done" | "missed",
    tasks: b.tasks
      ? {
          title: (b.tasks as { title: string; courses: { name: string } | null }).title,
          courses: (b.tasks as { title: string; courses: { name: string } | null }).courses,
        }
      : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">BlockPlan</h1>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Tasks
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Settings
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-8">
        <PlanGrid
          blocks={safeBlocks}
          riskTasks={riskTasks}
          hasAvailability={hasAvailability}
        />
      </main>
    </div>
  );
}
