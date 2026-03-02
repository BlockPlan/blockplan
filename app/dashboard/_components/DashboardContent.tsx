"use client";

import Link from "next/link";
import RiskBadge from "@/app/plan/_components/RiskBadge";

interface NextBlock {
  id: string;
  start_time: string;
  end_time: string;
  taskTitle: string;
  courseName: string | null;
}

interface PriorityTask {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  estimated_minutes: number;
  courses: { name: string } | null;
}

interface RiskTask {
  taskId: string;
  taskTitle: string;
  level: "at_risk" | "overdue_risk";
}

interface DashboardContentProps {
  nextBlock: NextBlock | null;
  priorityTasks: PriorityTask[];
  riskTasks: RiskTask[];
  todayBlockCount: number;
  todayDoneCount: number;
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  assignment: "bg-blue-100 text-blue-700",
  exam: "bg-red-100 text-red-700",
  reading: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

function formatTime(isoStr: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoStr));
}

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export default function DashboardContent({
  nextBlock,
  priorityTasks,
  riskTasks,
  todayBlockCount,
  todayDoneCount,
}: DashboardContentProps) {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const progressPercent =
    todayBlockCount > 0
      ? Math.round((todayDoneCount / todayBlockCount) * 100)
      : 0;

  return (
    <div>
      {/* Welcome card */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
        <p className="mt-1 text-sm text-gray-500">{todayLabel}</p>
        {todayBlockCount > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {todayDoneCount}/{todayBlockCount} blocks completed today
              </span>
              <span className="font-medium text-gray-900">
                {progressPercent}%
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Next Up card */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">Next Up</p>
          {nextBlock ? (
            <div className="mt-2">
              <p className="font-semibold text-gray-900">
                {nextBlock.taskTitle}
              </p>
              {nextBlock.courseName && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {nextBlock.courseName}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formatTime(nextBlock.start_time)} -{" "}
                {formatTime(nextBlock.end_time)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No upcoming blocks</p>
          )}
          <Link
            href="/plan"
            className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            View Plan
          </Link>
        </div>

        {/* Top 5 Priorities card */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-gray-500">
            Top Priorities
          </p>
          {priorityTasks.length === 0 ? (
            <p className="text-sm text-gray-400">All caught up!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {priorityTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      {task.courses && <span>{task.courses.name}</span>}
                      {task.due_date && (
                        <span>Due {formatDueDate(task.due_date)}</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      TYPE_BADGE_COLORS[task.type] ?? TYPE_BADGE_COLORS.other
                    }`}
                  >
                    {task.type}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/tasks"
            className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            View All Tasks
          </Link>
        </div>
      </div>

      {/* Risk Alerts card */}
      {riskTasks.length > 0 && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium text-gray-500">Risk Alerts</p>
          <div className="flex flex-wrap gap-2">
            {riskTasks.map((rt) => (
              <RiskBadge
                key={rt.taskId}
                level={rt.level}
                taskTitle={rt.taskTitle}
              />
            ))}
          </div>
          <Link
            href="/plan"
            className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800"
          >
            View Plan
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 flex gap-3">
        <Link
          href="/plan"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Weekly Plan
        </Link>
        <Link
          href="/plan/day"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Daily View
        </Link>
        <Link
          href="/tasks"
          className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          All Tasks
        </Link>
      </div>
    </div>
  );
}
