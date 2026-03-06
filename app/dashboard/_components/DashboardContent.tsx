"use client";

import Link from "next/link";
import RiskBadge from "@/app/plan/_components/RiskBadge";
import type { RiskTask } from "@/lib/types/risk";
import { TYPE_BADGE_COLORS } from "@/lib/constants/tasks";
import { formatTime as sharedFormatTime, formatDueShort } from "@/lib/utils/date-formatting";

interface NextBlock {
  id: string;
  start_time: string;
  end_time: string;
  taskTitle: string;
  courseName: string | null;
  dueDate: string | null;
}

interface PriorityTask {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  estimated_minutes: number;
  courses: { name: string } | null;
}

interface DashboardContentProps {
  nextBlock: NextBlock | null;
  priorityTasks: PriorityTask[];
  riskTasks: RiskTask[];
  todayBlockCount: number;
  todayDoneCount: number;
  todayTaskCount: number;
  todayTaskDoneCount: number;
  gpa: number | null;
  gradedCount: number;
}

export default function DashboardContent({
  nextBlock,
  priorityTasks,
  riskTasks,
  todayBlockCount,
  todayDoneCount,
  todayTaskCount,
  todayTaskDoneCount,
  gpa,
  gradedCount,
}: DashboardContentProps) {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const blockPercent =
    todayBlockCount > 0
      ? Math.round((todayDoneCount / todayBlockCount) * 100)
      : 0;

  const taskPercent =
    todayTaskCount > 0
      ? Math.round((todayTaskDoneCount / todayTaskCount) * 100)
      : 0;

  const hasBlocks = todayBlockCount > 0;
  const hasTasks = todayTaskCount > 0;

  return (
    <div>
      {/* Welcome card */}
      <div data-tour="dashboard-welcome" className="mb-4 rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Welcome back</h2>
        <p className="mt-1 text-sm text-gray-500">{todayLabel}</p>

        {(hasTasks || hasBlocks) && (
          <div className={`mt-4 grid gap-4 ${hasTasks && hasBlocks ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
            {/* Tasks progress */}
            {hasTasks && (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    <span className="font-medium">{todayTaskDoneCount}/{todayTaskCount}</span> tasks completed
                    <span className="text-gray-400"> · all courses</span>
                  </span>
                  <span className="font-medium text-blue-600">
                    {taskPercent}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${taskPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Blocks progress */}
            {hasBlocks && (
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    <span className="font-medium">{todayDoneCount}/{todayBlockCount}</span> blocks done today
                  </span>
                  <span className="font-medium text-emerald-600">
                    {blockPercent}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-2 rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${blockPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* GPA card */}
      {gradedCount > 0 && (
        <div className="mb-4 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-white p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                Current GPA
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {gpa !== null ? gpa.toFixed(2) : "–"}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {gradedCount} assignment{gradedCount !== 1 ? "s" : ""} graded
              </p>
            </div>
            <Link
              href="/grades"
              className="text-sm font-medium text-purple-600 transition-colors duration-150 hover:text-purple-800"
            >
              View Grades
            </Link>
          </div>
        </div>
      )}

      {/* Getting Started — shown for brand-new users */}
      {!hasTasks && !hasBlocks && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold text-gray-900">
            Getting Started
          </h3>
          <p className="mt-1 mb-5 text-sm text-gray-500">
            Set up your planner in three quick steps:
          </p>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                1
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">Add your courses</p>
                <p className="text-sm text-gray-500">
                  Head to{" "}
                  <Link href="/courses" className="font-medium text-blue-600 hover:underline">
                    Courses
                  </Link>{" "}
                  and add each class you&apos;re taking this semester.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                2
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">Create tasks or upload a syllabus</p>
                <p className="text-sm text-gray-500">
                  Add assignments on the{" "}
                  <Link href="/tasks" className="font-medium text-blue-600 hover:underline">
                    Tasks
                  </Link>{" "}
                  page, or{" "}
                  <Link href="/syllabi/upload" className="font-medium text-blue-600 hover:underline">
                    Upload a Syllabus
                  </Link>{" "}
                  to auto-import them.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                3
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">Generate your study plan</p>
                <p className="text-sm text-gray-500">
                  Go to the{" "}
                  <Link href="/plan" className="font-medium text-blue-600 hover:underline">
                    Calendar
                  </Link>{" "}
                  and click &ldquo;Generate Plan&rdquo; to auto-schedule study blocks.
                </p>
              </div>
            </li>
          </ol>
        </div>
      )}

      {/* Main cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Next Up card */}
        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Next Up</p>
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
                {sharedFormatTime(nextBlock.start_time)} -{" "}
                {sharedFormatTime(nextBlock.end_time)}
              </p>
              {nextBlock.dueDate && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Due {formatDueShort(nextBlock.dueDate)}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-500">No upcoming blocks</p>
          )}
          <Link
            href="/plan"
            className="mt-3 inline-block text-sm font-medium text-blue-600 transition-colors duration-150 hover:text-blue-800"
          >
            View Plan
          </Link>
        </div>

        {/* Top 5 Priorities card */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Top Priorities
          </p>
          {priorityTasks.length === 0 ? (
            <p className="text-sm text-gray-400">All caught up!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {priorityTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks?highlight=${task.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 -mx-2 transition-colors hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      {task.courses && <span>{task.courses.name}</span>}
                      {task.due_date && (
                        <span>Due {formatDueShort(task.due_date)}</span>
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
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/tasks"
            className="mt-3 inline-block text-sm font-medium text-blue-600 transition-colors duration-150 hover:text-blue-800"
          >
            View All Tasks
          </Link>
        </div>
      </div>

      {/* Risk Alerts card */}
      {riskTasks.length > 0 && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Risk Alerts</p>
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
            className="mt-3 inline-block text-sm font-medium text-blue-600 transition-colors duration-150 hover:text-blue-800"
          >
            View Plan
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/plan"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:border-gray-300"
        >
          Weekly Plan
        </Link>
        <Link
          href="/plan/day"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:border-gray-300"
        >
          Daily View
        </Link>
        <Link
          href="/tasks"
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm font-medium text-gray-700 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-card-hover)] hover:border-gray-300"
        >
          All Tasks
        </Link>
      </div>
    </div>
  );
}
