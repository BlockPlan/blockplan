"use client";

import { useOptimistic, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDraggable } from "@dnd-kit/core";
import { markBlockDone, markBlockMissed, resetBlockStatus } from "../actions";
import { formatTimeRange } from "@/lib/utils/date-formatting";

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
  draggable?: boolean;
  /** "stacked" = original card layout, "grid" = fills absolute-positioned parent */
  variant?: "stacked" | "grid";
  /** Pixel height of the parent container (used in grid mode to adapt content) */
  gridHeight?: number;
}

export { type PlanBlockData };

export default function PlanBlock({ block, onEditTask, draggable, variant = "stacked", gridHeight }: PlanBlockProps) {
  const router = useRouter();
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<BlockStatus>(
    block.status,
  );
  const [isPending, startTransition] = useTransition();

  const isDraggableBlock = draggable && block.status === "scheduled";
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: block.id,
    data: { block },
    disabled: !isDraggableBlock,
  });

  // Track whether a drag actually started, so we can treat non-drags as clicks
  const wasDraggingRef = useRef(false);

  // Update ref when drag state changes
  if (isDragging) {
    wasDraggingRef.current = true;
  }

  const taskTitle = block.tasks?.title ?? "Unknown task";
  const taskStatus = block.tasks?.taskStatus ?? "todo";
  const courseName = block.tasks?.courses?.name ?? "";
  const timeRange = formatTimeRange(block.start_time, block.end_time);

  const statusIndicator =
    taskStatus === "done"
      ? { icon: "✓", className: "bg-emerald-100 text-emerald-700" }
      : taskStatus === "doing"
        ? { icon: "◑", className: "bg-blue-100 text-blue-700" }
        : null;

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

  const isGrid = variant === "grid";
  const showTime = !isGrid || (gridHeight ?? 60) >= 30;
  const showCourse = !isGrid || (gridHeight ?? 60) >= 50;
  const showActions = !isGrid || (gridHeight ?? 60) >= 60;

  /* ── Done block ── */
  if (optimisticStatus === "done") {
    return (
      <div
        className={[
          "rounded-lg border border-green-200 bg-green-50",
          isGrid ? "h-full w-full overflow-hidden px-1.5 py-1" : "px-2 py-1.5",
          onEditTask ? "cursor-pointer hover:shadow-md transition-all duration-150" : "",
        ].join(" ")}
        onClick={onEditTask}
        role={onEditTask ? "button" : undefined}
        tabIndex={onEditTask ? 0 : undefined}
        onKeyDown={onEditTask ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditTask(); } } : undefined}
      >
        <p className={["font-medium leading-tight text-green-700 line-through", isGrid ? "truncate text-[10px]" : "text-xs"].join(" ")}>
          {taskTitle}
        </p>
        {showTime && (
          <div className="mt-0.5 flex items-center justify-between">
            <span className="whitespace-nowrap text-[10px] text-green-500">{timeRange}</span>
            {showActions && (
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                disabled={isPending}
                title="Undo"
                className="flex-shrink-0 rounded p-0.5 text-green-400 hover:bg-green-100 hover:text-green-700 disabled:opacity-40"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
            )}
          </div>
        )}
        {showCourse && courseName && (
          <p className="truncate text-[10px] leading-tight text-green-400">{courseName}</p>
        )}
      </div>
    );
  }

  /* ── Missed block ── */
  if (optimisticStatus === "missed") {
    return (
      <div
        className={[
          "rounded-lg border border-gray-200 bg-gray-50 opacity-60",
          isGrid ? "h-full w-full overflow-hidden px-1.5 py-1" : "px-2 py-1.5",
          onEditTask ? "cursor-pointer hover:shadow-md transition-all duration-150" : "",
        ].join(" ")}
        onClick={onEditTask}
        role={onEditTask ? "button" : undefined}
        tabIndex={onEditTask ? 0 : undefined}
        onKeyDown={onEditTask ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onEditTask(); } } : undefined}
      >
        <p className={["font-medium leading-tight text-gray-500 line-through", isGrid ? "truncate text-[10px]" : "text-xs"].join(" ")}>
          {taskTitle}
        </p>
        {showTime && (
          <div className="mt-0.5 flex items-center justify-between">
            <span className="whitespace-nowrap text-[10px] text-gray-400">{timeRange}</span>
            {showActions && (
              <button
                onClick={(e) => { e.stopPropagation(); handleReset(); }}
                disabled={isPending}
                title="Undo"
                className="flex-shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:opacity-40"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
              </button>
            )}
          </div>
        )}
        {showCourse && courseName && (
          <p className="truncate text-[10px] leading-tight text-gray-400">{courseName}</p>
        )}
      </div>
    );
  }

  /* ── Scheduled block ── */
  // In grid mode, attach drag listeners to the whole block container;
  // in stacked mode, attach them only to the grip icon button.
  const gridDragProps = isDraggableBlock && isGrid ? { ...listeners, ...attributes } : {};

  const handleBlockClick = (e: React.MouseEvent) => {
    // Don't open edit if we just finished dragging
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return;
    }
    // Don't open edit if clicking action buttons
    if ((e.target as HTMLElement).closest("button")) return;
    onEditTask?.();
  };

  return (
    <div
      ref={isDraggableBlock ? setNodeRef : undefined}
      className={[
        "rounded-lg border border-blue-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow",
        isGrid ? "h-full w-full overflow-hidden px-1.5 py-1" : "px-2 py-1.5",
        isDragging ? "opacity-50" : "",
        isDraggableBlock && isGrid ? "cursor-grab touch-none active:cursor-grabbing" : "",
        onEditTask ? "cursor-pointer" : "",
      ].join(" ")}
      style={isDragging ? { zIndex: 50 } : undefined}
      {...gridDragProps}
      onClick={onEditTask ? handleBlockClick : undefined}
    >
      {/* Title row — drag handle + title */}
      <div
        className={[
          "flex items-start gap-1",
          onEditTask ? "hover:text-blue-700 transition-colors" : "",
        ].join(" ")}
      >
        {isDraggableBlock && !isGrid && (
          <button
            type="button"
            className="mt-px flex-shrink-0 cursor-grab touch-none rounded text-gray-300 hover:text-gray-500 active:cursor-grabbing"
            {...listeners}
            {...attributes}
            aria-label="Drag to reschedule"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
        )}
        <p className={["min-w-0 flex-1 font-medium leading-tight text-gray-900", isGrid ? "truncate text-[10px]" : "line-clamp-2 text-xs"].join(" ")}>
          {taskTitle}
        </p>
      </div>

      {/* Info row — time + status | actions */}
      {showTime && (
        <div className="mt-0.5 flex items-center justify-between gap-1">
          <p className="flex min-w-0 items-center gap-1 text-[10px] leading-tight text-gray-500">
            <span className="whitespace-nowrap">{timeRange}</span>
            {statusIndicator && (
              <span className={`inline-flex items-center rounded-full px-1 py-px text-[9px] font-medium leading-none ${statusIndicator.className}`}>
                {statusIndicator.icon}
              </span>
            )}
          </p>
          {showActions && (
            <div className="flex flex-shrink-0 items-center">
              <button
                onClick={handleDone}
                disabled={isPending}
                title="Mark done"
                className="rounded p-0.5 text-gray-400 hover:bg-green-100 hover:text-green-600 disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={handleMissed}
                disabled={isPending}
                title="Mark missed"
                className="rounded p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-40"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
      {showCourse && courseName && (
        <p className="truncate text-[10px] leading-tight text-gray-400">{courseName}</p>
      )}
    </div>
  );
}
