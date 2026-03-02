"use client";

import PlanBlock from "./PlanBlock";

interface PriorityTask {
  id: string;
  title: string;
  type: string;
  due_date: string | null;
  estimated_minutes: number;
  status: string;
  courses: { name: string } | null;
}

interface DayTimelineProps {
  blocks: Array<{
    id: string;
    start_time: string;
    end_time: string;
    status: "scheduled" | "done" | "missed";
    tasks: { title: string; courses: { name: string } | null } | null;
  }>;
  priorityTasks: PriorityTask[];
  remainingMinutes: number;
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  assignment: "bg-blue-100 text-blue-700",
  exam: "bg-red-100 text-red-700",
  reading: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export default function DayTimeline({
  blocks,
  priorityTasks,
  remainingMinutes,
}: DayTimelineProps) {
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const hours = Math.floor(remainingMinutes / 60);
  const mins = Math.round(remainingMinutes % 60);

  const hasBlocks = blocks.length > 0;
  const allDone = hasBlocks && remainingMinutes === 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Today&apos;s Plan</h2>
        <p className="text-sm text-gray-500">{todayLabel}</p>
      </div>

      {/* Time remaining card */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm font-medium text-gray-500">Time Remaining</p>
        {allDone ? (
          <p className="mt-1 text-2xl font-bold text-green-600">
            All done for today!
          </p>
        ) : hasBlocks ? (
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {hours > 0 ? `${hours}h ` : ""}
            {mins}m
          </p>
        ) : (
          <p className="mt-1 text-lg text-gray-400">No blocks scheduled</p>
        )}
      </div>

      {/* Today's blocks */}
      <div className="mb-6">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Schedule</h3>
        {blocks.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
            No blocks scheduled for today
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {blocks.map((block) => (
              <PlanBlock key={block.id} block={block} />
            ))}
          </div>
        )}
      </div>

      {/* Top priorities */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">
          Top Priorities
        </h3>
        {priorityTasks.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
            All tasks complete!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {priorityTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {task.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2 text-sm">
                      {task.courses && (
                        <span className="text-gray-500">
                          {task.courses.name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-gray-400">
                          Due {formatDueDate(task.due_date)}
                        </span>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
