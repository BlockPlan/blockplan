import type { RiskTask } from "@/lib/types/risk";

/**
 * Block shape expected by the risk calculator.
 * Matches the shape returned by Supabase plan_blocks queries.
 */
interface BlockForRisk {
  task_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
  tasks: {
    title: string;
    estimated_minutes: number;
    due_date: string | null;
  } | null;
}

/**
 * Compute risk tasks from a list of plan blocks.
 *
 * A task is flagged as:
 * - "overdue_risk" if its due date has passed and scheduled time < estimated time
 * - "at_risk" if its due date is within the next 7 days and scheduled time < estimated time
 */
export function calculateRiskTasks(blocks: BlockForRisk[]): RiskTask[] {
  const planningHorizonEnd = new Date();
  planningHorizonEnd.setDate(planningHorizonEnd.getDate() + 7);

  const riskTasks: RiskTask[] = [];
  const seenTaskIds = new Set<string>();

  // Sum scheduled minutes per task (excluding missed blocks)
  const scheduledMinutes = new Map<string, number>();
  for (const block of blocks) {
    if (!block.task_id || block.status === "missed") continue;
    const taskId = block.task_id;
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    const minutes = (end.getTime() - start.getTime()) / 60000;
    scheduledMinutes.set(taskId, (scheduledMinutes.get(taskId) ?? 0) + minutes);
  }

  // Check each task for risk
  for (const block of blocks) {
    if (!block.tasks) continue;
    const taskId = block.task_id as string;
    if (seenTaskIds.has(taskId)) continue;
    seenTaskIds.add(taskId);

    const task = block.tasks;
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

  return riskTasks;
}
