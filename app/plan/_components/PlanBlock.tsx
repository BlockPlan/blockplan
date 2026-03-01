"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { markBlockDone, markBlockMissed } from "../actions";

type BlockStatus = "scheduled" | "done" | "missed";

interface PlanBlockData {
  id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  status: BlockStatus;
  tasks: {
    title: string;
    courses: {
      name: string;
    } | null;
  } | null;
}

interface PlanBlockProps {
  block: PlanBlockData;
}

function formatTimeRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${fmt.format(new Date(start))}–${fmt.format(new Date(end))}`;
}

export default function PlanBlock({ block }: PlanBlockProps) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<BlockStatus>(
    block.status,
  );
  const [isPending, startTransition] = useTransition();

  const taskTitle = block.tasks?.title ?? "Unknown task";
  const courseName = block.tasks?.courses?.name ?? "";
  const timeRange = formatTimeRange(block.start_time, block.end_time);

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

  if (optimisticStatus === "done") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
        <p className="text-xs font-medium text-green-700 line-through">
          {taskTitle}
        </p>
        <p className="mt-0.5 text-xs text-green-500">{timeRange}</p>
        {courseName && (
          <p className="mt-0.5 text-xs text-green-400">{courseName}</p>
        )}
      </div>
    );
  }

  if (optimisticStatus === "missed") {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 opacity-60">
        <p className="text-xs font-medium text-gray-500 line-through">
          {taskTitle}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">{timeRange}</p>
        {courseName && (
          <p className="mt-0.5 text-xs text-gray-400">{courseName}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-white px-3 py-2">
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-gray-900">
            {taskTitle}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{timeRange}</p>
          {courseName && (
            <p className="mt-0.5 truncate text-xs text-gray-400">{courseName}</p>
          )}
        </div>
        <div className="flex flex-shrink-0 gap-1">
          {/* Mark done */}
          <button
            onClick={handleDone}
            disabled={isPending}
            title="Mark done"
            className="rounded p-0.5 text-gray-400 transition-colors hover:bg-green-100 hover:text-green-600 disabled:opacity-40"
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
            className="rounded p-0.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600 disabled:opacity-40"
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
