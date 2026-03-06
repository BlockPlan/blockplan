"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markBlockDone, markBlockMissed, resetBlockStatus } from "../actions";

type BlockStatus = "scheduled" | "done" | "missed";

interface PlanBlockData {
  id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  status: BlockStatus;
  task_id: string | null;
  tasks: {
    title: string;
    type: "assignment" | "exam" | "reading" | "other";
    taskStatus: "todo" | "doing" | "done";
    estimated_minutes: number;
    due_date: string | null;
    course_id: string;
    courses: {
      name: string;
    } | null;
  } | null;
}

interface PlanBlockProps {
  block: PlanBlockData;
  onEditTask?: () => void;
}

function formatTimeRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(new Date(start))}–${fmt.format(new Date(end))}`;
}

export default function PlanBlock({ block, onEditTask }: PlanBlockProps) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<BlockStatus>(
    block.status,
  );
  const [isPending, startTransition] = useTransition();

  const taskTitle = block.tasks?.title ?? "Unknown task";
  const taskStatus = block.tasks?.taskStatus ?? "todo";
  const courseName = block.tasks?.courses?.name ?? "";
  const timeRange = formatTimeRange(block.start_time, block.end_time);

  const statusIndicator =
    taskStatus === "done"
      ? { icon: "✓", className: "bg-emerald-100 text-emerald-700" }
      : taskStatus === "doing"
        ? { icon: "◑", className: "bg-blue-100 text-blue-700" }
        : null; // don't show badge for "todo" — it's the default

  const handleDone = () => {
    startTransition(async () => {
      setOptimisticStatus("done");
      await markBlockDone(block.id);
    });
  };

  const handleMissed = () => {
    startTransition(async () => {
      setOptimisticStatus("missed");
      const result = await markBlockMissed(block.id);
      if (result.success && result.rescheduledCount !== undefined) {
        toast(`Plan updated — ${result.rescheduledCount} blocks rescheduled`);
      }
      router.refresh();
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      setOptimisticStatus("scheduled");
      await resetBlockStatus(block.id);
      router.refresh();
    });
  };

  if (optimisticStatus === "done") {
    return (
      <div
        className={[
          "rounded-lg border border-green-200 bg-green-50 px-3 py-2",
          onEditTask ? "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-green-300/50 transition-all duration-150" : "",
        ].join(" ")}
        onClick={onEditTask}
        role={onEditTask ? "button" : undefined}
        tabIndex={onEditTask ? 0 : undefined}
        onKeyDown={onEditTask ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditTask(); } } : undefined}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-green-700 line-through">
              {taskTitle}
            </p>
            <p className="mt-0.5 text-xs text-green-500">{timeRange}</p>
            {courseName && (
              <p className="mt-0.5 text-xs text-green-400">{courseName}</p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            disabled={isPending}
            title="Undo — mark as not done"
            className="flex-shrink-0 rounded p-1.5 text-green-400 transition-colors duration-150 hover:bg-green-100 hover:text-green-700 disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (optimisticStatus === "missed") {
    return (
      <div
        className={[
          "rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 opacity-60",
          onEditTask ? "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-gray-300/50 transition-all duration-150" : "",
        ].join(" ")}
        onClick={onEditTask}
        role={onEditTask ? "button" : undefined}
        tabIndex={onEditTask ? 0 : undefined}
        onKeyDown={onEditTask ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditTask(); } } : undefined}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 line-through">
              {taskTitle}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{timeRange}</p>
            {courseName && (
              <p className="mt-0.5 text-xs text-gray-400">{courseName}</p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            disabled={isPending}
            title="Undo — mark as not missed"
            className="flex-shrink-0 rounded p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-white px-3 py-2 shadow-sm transition-shadow duration-200 hover:shadow">
      <div className="flex items-start justify-between gap-1">
        <div
          className={[
            "min-w-0 flex-1",
            onEditTask ? "cursor-pointer hover:text-blue-700 transition-colors" : "",
          ].join(" ")}
          onClick={onEditTask}
          role={onEditTask ? "button" : undefined}
          tabIndex={onEditTask ? 0 : undefined}
          onKeyDown={onEditTask ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditTask(); } } : undefined}
        >
          <p className="truncate text-xs font-medium text-gray-900">
            {taskTitle}
            {onEditTask && (
              <svg className="ml-1 inline h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{timeRange}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {courseName && (
              <span className="truncate text-xs text-gray-400">{courseName}</span>
            )}
            {statusIndicator && (
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusIndicator.className}`}>
                {statusIndicator.icon}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 gap-1.5">
          {/* Mark done */}
          <button
            onClick={handleDone}
            disabled={isPending}
            title="Mark done"
            className="rounded p-1.5 text-gray-400 transition-colors duration-150 hover:bg-green-100 hover:text-green-600 disabled:opacity-40"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {/* Mark missed */}
          <button
            onClick={handleMissed}
            disabled={isPending}
            title="Mark missed"
            className="rounded p-1.5 text-gray-400 transition-colors duration-150 hover:bg-red-100 hover:text-red-600 disabled:opacity-40"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
