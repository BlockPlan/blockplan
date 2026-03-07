"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import { format, isToday } from "date-fns";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import PlanBlock from "./PlanBlock";
import type { PlanBlockData } from "./PlanBlock";
import {
  PIXELS_PER_MINUTE,
  computeGridRange,
  getHourLabels,
  layoutBlocks,
} from "./time-grid-utils";
import { moveBlock, undoMoveBlock } from "../actions";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types (re-declared here to match CalendarView's shapes)
// ---------------------------------------------------------------------------

interface PlanBlockRow {
  id: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "done" | "missed";
  task_id: string | null;
  tasks: {
    title: string;
    type: "assignment" | "exam" | "reading" | "other";
    taskStatus: "todo" | "doing" | "done";
    estimated_minutes: number;
    due_date: string | null;
    course_id: string;
    courses: { name: string } | null;
  } | null;
}

interface TaskRow {
  id: string;
  title: string;
  type: "assignment" | "exam" | "reading" | "other";
  status: "todo" | "doing" | "done";
  due_date: string | null;
  estimated_minutes: number;
  course_id: string;
  courseName: string | null;
}

interface SubtaskRow {
  id: string;
  title: string;
  status: "todo" | "done";
  due_date: string;
  estimated_minutes: number;
  sort_order: number;
  task_id: string;
  parentTitle: string;
  parentType: string;
  courseName: string | null;
}

type CourseColorMap = Map<string, { bg: string; text: string; dot: string; chip: string; legend: string }>;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function getCourseColor(courseName: string | null, colorMap: CourseColorMap) {
  const fallback = { bg: "bg-gray-50 border-gray-300", text: "text-gray-700", dot: "bg-gray-500", chip: "bg-gray-100 text-gray-700", legend: "bg-gray-500" };
  if (!courseName) return fallback;
  return colorMap.get(courseName) ?? fallback;
}

function blockToTaskRow(block: PlanBlockRow): TaskRow | null {
  if (!block.task_id || !block.tasks) return null;
  return {
    id: block.task_id,
    title: block.tasks.title,
    type: block.tasks.type,
    status: block.tasks.taskStatus ?? "todo",
    due_date: block.tasks.due_date ?? null,
    estimated_minutes: block.tasks.estimated_minutes,
    course_id: block.tasks.course_id,
    courseName: block.tasks.courses?.name ?? null,
  };
}

// ---------------------------------------------------------------------------
// Droppable wrapper for each day column
// ---------------------------------------------------------------------------

function DroppableDayColumn({
  dateKey,
  height,
  isToday: isTodayCol,
  children,
}: {
  dateKey: string;
  height: number;
  isToday: boolean;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: dateKey });

  return (
    <div
      ref={setNodeRef}
      className={[
        "relative border-l border-gray-100",
        isOver ? "bg-blue-50/50" : "",
        isTodayCol ? "bg-blue-50/30" : "",
      ].join(" ")}
      style={{ height }}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Current time indicator (red line)
// ---------------------------------------------------------------------------

function NowIndicator({ startHour }: { startHour: number }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const minutesSinceStart = (now.getHours() - startHour) * 60 + now.getMinutes();
  if (minutesSinceStart < 0) return null;

  const top = minutesSinceStart * PIXELS_PER_MINUTE;

  return (
    <div className="pointer-events-none absolute left-0 right-0 z-20" style={{ top }}>
      <div className="flex items-center">
        <div className="h-2.5 w-2.5 -ml-1 rounded-full bg-red-500" />
        <div className="h-[2px] flex-1 bg-red-500" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimeGrid Component
// ---------------------------------------------------------------------------

interface TimeGridProps {
  days: Date[];
  blocksByDate: Map<string, PlanBlockRow[]>;
  tasksByDate: Map<string, TaskRow[]>;
  subtasksByDate: Map<string, SubtaskRow[]>;
  colorMap: CourseColorMap;
  onTaskClick: (task: TaskRow) => void;
}

export default function TimeGrid({
  days,
  blocksByDate,
  tasksByDate,
  subtasksByDate,
  colorMap,
  onTaskClick,
}: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMultiDay = days.length > 1;

  // Collect all blocks to compute grid range
  const allBlocks = useMemo(() => {
    const all: PlanBlockRow[] = [];
    for (const day of days) {
      const key = getDateKey(day);
      const dayBlocks = blocksByDate.get(key);
      if (dayBlocks) all.push(...dayBlocks);
    }
    return all;
  }, [days, blocksByDate]);

  const { startHour, endHour } = useMemo(
    () => computeGridRange(allBlocks),
    [allBlocks]
  );

  const hourLabels = useMemo(
    () => getHourLabels(startHour, endHour),
    [startHour, endHour]
  );

  const totalMinutes = (endHour - startHour) * 60;
  const gridHeight = totalMinutes * PIXELS_PER_MINUTE;

  // Scroll to ~current time or 8am on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const minutesSinceStart = (now.getHours() - startHour) * 60 + now.getMinutes();
    const scrollTarget = Math.max(0, minutesSinceStart * PIXELS_PER_MINUTE - 100);
    scrollRef.current.scrollTop = scrollTarget;
  }, [startHour]);

  // ── Drag-and-drop (week mode) ──
  const [activeBlock, setActiveBlock] = useState<PlanBlockRow | null>(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const block = event.active.data.current?.block as PlanBlockRow | undefined;
    if (block) setActiveBlock(block);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveBlock(null);
    const { active, over } = event;
    if (!over) return;

    const blockId = active.id as string;
    const targetDateKey = over.id as string;
    const block = active.data.current?.block as PlanBlockRow | undefined;
    if (!block) return;

    const currentDateKey = getDateKey(new Date(block.start_time));
    if (currentDateKey === targetDateKey) return;

    const targetDayName = format(new Date(targetDateKey + "T12:00:00"), "EEEE");
    const result = await moveBlock(blockId, targetDateKey);
    if (result.success) {
      toast(`Block moved to ${targetDayName}`, {
        action: {
          label: "Undo",
          onClick: async () => {
            await undoMoveBlock(blockId, result.previousStartTime!, result.previousEndTime!);
            toast("Move undone");
          },
        },
      });
    } else {
      toast.error(result.error ?? "Failed to move block");
    }
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveBlock(null);
  }, []);

  // Check if there are any all-day items (tasks/subtasks)
  const hasAllDayItems = useMemo(() => {
    for (const day of days) {
      const key = getDateKey(day);
      if ((tasksByDate.get(key)?.length ?? 0) > 0) return true;
      if ((subtasksByDate.get(key)?.length ?? 0) > 0) return true;
    }
    return false;
  }, [days, tasksByDate, subtasksByDate]);

  const gridContent = (
    <div>
      {/* ── Day headers ── */}
      <div
        className="sticky top-0 z-30 border-b border-gray-200 bg-white"
        style={{
          display: "grid",
          gridTemplateColumns: isMultiDay
            ? `56px repeat(${days.length}, 1fr)`
            : "56px 1fr",
        }}
      >
        <div /> {/* gutter spacer */}
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={getDateKey(day)}
              className={[
                "border-l border-gray-100 px-1 py-2 text-center",
                today ? "bg-blue-50" : "",
              ].join(" ")}
            >
              <p className={["text-xs font-semibold", today ? "text-blue-700" : "text-gray-700"].join(" ")}>
                {format(day, "EEE")}
              </p>
              <p className={["text-xs", today ? "text-blue-600" : "text-gray-500"].join(" ")}>
                {format(day, "MMM d")}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── All-day items (tasks/subtasks due) ── */}
      {hasAllDayItems && (
        <div
          className="border-b border-gray-200 bg-gray-50/50"
          style={{
            display: "grid",
            gridTemplateColumns: isMultiDay
              ? `56px repeat(${days.length}, 1fr)`
              : "56px 1fr",
          }}
        >
          <div className="px-1 py-1.5 text-[10px] font-medium text-gray-400 text-right pr-2">
            Due
          </div>
          {days.map((day) => {
            const key = getDateKey(day);
            const tasks = tasksByDate.get(key) ?? [];
            const subtasks = subtasksByDate.get(key) ?? [];
            if (tasks.length === 0 && subtasks.length === 0) {
              return <div key={key} className="border-l border-gray-100 min-h-[28px]" />;
            }

            return (
              <div key={key} className="border-l border-gray-100 px-1 py-1 space-y-0.5">
                {tasks.map((task) => {
                  const colors = getCourseColor(task.courseName, colorMap);
                  const isDone = task.status === "done";
                  return (
                    <button
                      key={`task-${task.id}`}
                      type="button"
                      onClick={() => onTaskClick(task)}
                      className={[
                        "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] leading-tight transition-colors",
                        isDone ? "bg-gray-100 text-gray-400 line-through" : colors.chip,
                        "hover:opacity-80 cursor-pointer",
                      ].join(" ")}
                    >
                      <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${isDone ? "bg-gray-400" : colors.dot}`} />
                      <span className="truncate">{task.title}</span>
                    </button>
                  );
                })}
                {subtasks.map((sub) => {
                  const subColors = getCourseColor(sub.courseName, colorMap);
                  const subDone = sub.status === "done";
                  return (
                    <div
                      key={`sub-${sub.id}`}
                      className={[
                        "flex items-center gap-1 rounded border border-dashed px-1 py-0.5 text-[10px] leading-tight",
                        subDone ? "bg-gray-100 text-gray-400 border-gray-300 line-through" : subColors.chip + " border-current",
                      ].join(" ")}
                    >
                      <span className="text-[8px]">🏁</span>
                      <span className="truncate">{sub.title}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Scrollable time grid ── */}
      <div
        ref={scrollRef}
        className="overflow-y-auto overflow-x-auto"
        style={{ maxHeight: "calc(100vh - 280px)" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMultiDay
              ? `56px repeat(${days.length}, minmax(100px, 1fr))`
              : "56px 1fr",
            minWidth: isMultiDay ? `${56 + days.length * 100}px` : undefined,
          }}
        >
          {/* Hour labels gutter */}
          <div className="relative" style={{ height: gridHeight }}>
            {hourLabels.map((hl) => (
              <div
                key={hl.hour}
                className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-gray-400 select-none"
                style={{ top: hl.topPx }}
              >
                {hl.label}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const key = getDateKey(day);
            const dayBlocks = blocksByDate.get(key) ?? [];
            const today = isToday(day);

            const positioned = layoutBlocks(dayBlocks, startHour);

            return (
              <DroppableDayColumn
                key={key}
                dateKey={key}
                height={gridHeight}
                isToday={today}
              >
                {/* Hour gridlines */}
                {hourLabels.map((hl) => (
                  <div
                    key={hl.hour}
                    className="absolute left-0 right-0 border-t border-gray-100"
                    style={{ top: hl.topPx }}
                  />
                ))}

                {/* Current time indicator */}
                {today && <NowIndicator startHour={startHour} />}

                {/* Positioned blocks */}
                {positioned.map((pb) => {
                  const block = pb.item;
                  const taskRow = blockToTaskRow(block);
                  return (
                    <div
                      key={block.id}
                      className="absolute z-10 px-[1px]"
                      style={{
                        top: pb.top,
                        height: pb.height,
                        left: `${(pb.column / pb.totalColumns) * 100}%`,
                        width: `${(1 / pb.totalColumns) * 100}%`,
                      }}
                    >
                      <PlanBlock
                        block={block}
                        onEditTask={taskRow ? () => onTaskClick(taskRow) : undefined}
                        draggable={isMultiDay}
                        variant="grid"
                        gridHeight={pb.height}
                      />
                    </div>
                  );
                })}
              </DroppableDayColumn>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Wrap in DndContext for week mode
  if (isMultiDay) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {gridContent}

          <DragOverlay>
            {activeBlock ? (
              <div className="w-40 rounded-lg border border-blue-300 bg-white px-3 py-2 shadow-lg opacity-90">
                <p className="truncate text-xs font-medium text-gray-900">
                  {activeBlock.tasks?.title ?? "Study block"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {activeBlock.tasks?.courses?.name ?? ""}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      {gridContent}
    </div>
  );
}

export type { PlanBlockRow, TaskRow, SubtaskRow, CourseColorMap };
