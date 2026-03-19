"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  format,
  isSameMonth,
  isToday,
  eachDayOfInterval,
  parseISO,
} from "date-fns";
import Link from "next/link";
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
import { generatePlan, moveBlock, undoMoveBlock } from "../actions";
import PlanBlock from "./PlanBlock";
import TimeGrid from "./TimeGrid";
import RiskBadge from "./RiskBadge";
import ExportButton from "./ExportButton";
import BlockFormDialog from "./BlockFormDialog";
import type { BlockFormData } from "./BlockFormDialog";
import TaskForm from "@/app/tasks/_components/TaskForm";
import type { RiskTask } from "@/lib/types/risk";
import { TYPE_LABELS } from "@/lib/constants/tasks";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ViewMode = "day" | "week" | "month";

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

interface CourseOption {
  id: string;
  name: string;
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
  notes?: string | null;
  grade?: number | null;
  points?: number | null;
  weight?: number | null;
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

interface CalendarViewProps {
  blocks: PlanBlockRow[];
  tasks: TaskRow[];
  subtasks: SubtaskRow[];
  riskTasks: RiskTask[];
  hasAvailability: boolean;
  courses: CourseOption[];
}

// ---------------------------------------------------------------------------
// Course color palette — each course gets a unique color
// ---------------------------------------------------------------------------

const COURSE_COLOR_PALETTE = [
  { bg: "bg-blue-50 border-blue-300",    text: "text-blue-800",    dot: "bg-blue-500",    chip: "bg-blue-100 text-blue-800",    legend: "bg-blue-500" },
  { bg: "bg-emerald-50 border-emerald-300", text: "text-emerald-800", dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800", legend: "bg-emerald-500" },
  { bg: "bg-orange-50 border-orange-300", text: "text-orange-800",  dot: "bg-orange-500",  chip: "bg-orange-100 text-orange-800",  legend: "bg-orange-500" },
  { bg: "bg-purple-50 border-purple-300", text: "text-purple-800",  dot: "bg-purple-500",  chip: "bg-purple-100 text-purple-800",  legend: "bg-purple-500" },
  { bg: "bg-rose-50 border-rose-300",    text: "text-rose-800",    dot: "bg-rose-500",    chip: "bg-rose-100 text-rose-800",    legend: "bg-rose-500" },
  { bg: "bg-teal-50 border-teal-300",    text: "text-teal-800",    dot: "bg-teal-500",    chip: "bg-teal-100 text-teal-800",    legend: "bg-teal-500" },
  { bg: "bg-amber-50 border-amber-300",  text: "text-amber-800",   dot: "bg-amber-500",   chip: "bg-amber-100 text-amber-800",   legend: "bg-amber-500" },
  { bg: "bg-indigo-50 border-indigo-300", text: "text-indigo-800",  dot: "bg-indigo-500",  chip: "bg-indigo-100 text-indigo-800",  legend: "bg-indigo-500" },
  { bg: "bg-pink-50 border-pink-300",    text: "text-pink-800",    dot: "bg-pink-500",    chip: "bg-pink-100 text-pink-800",    legend: "bg-pink-500" },
  { bg: "bg-cyan-50 border-cyan-300",    text: "text-cyan-800",    dot: "bg-cyan-500",    chip: "bg-cyan-100 text-cyan-800",    legend: "bg-cyan-500" },
];

const FALLBACK_COLOR = { bg: "bg-gray-50 border-gray-300", text: "text-gray-700", dot: "bg-gray-500", chip: "bg-gray-100 text-gray-700", legend: "bg-gray-500" };

type CourseColorMap = Map<string, typeof COURSE_COLOR_PALETTE[0]>;

/**
 * Build a stable mapping from course name → color.
 * Courses are sorted alphabetically so the same course always gets the same color.
 */
function buildCourseColorMap(tasks: TaskRow[], blocks: PlanBlockRow[], subtasks: SubtaskRow[] = []): CourseColorMap {
  const courseNames = new Set<string>();

  for (const t of tasks) {
    if (t.courseName) courseNames.add(t.courseName);
  }
  for (const b of blocks) {
    if (b.tasks?.courses?.name) courseNames.add(b.tasks.courses.name);
  }
  for (const s of subtasks) {
    if (s.courseName) courseNames.add(s.courseName);
  }

  const sorted = Array.from(courseNames).sort();
  const map: CourseColorMap = new Map();
  sorted.forEach((name, i) => {
    map.set(name, COURSE_COLOR_PALETTE[i % COURSE_COLOR_PALETTE.length]);
  });
  return map;
}

function getCourseColor(courseName: string | null, colorMap: CourseColorMap) {
  if (!courseName) return FALLBACK_COLOR;
  return colorMap.get(courseName) ?? FALLBACK_COLOR;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function groupBlocksByDate(blocks: PlanBlockRow[]): Map<string, PlanBlockRow[]> {
  const map = new Map<string, PlanBlockRow[]>();
  for (const block of blocks) {
    const key = getDateKey(new Date(block.start_time));
    const existing = map.get(key) ?? [];
    existing.push(block);
    map.set(key, existing);
  }
  for (const [, dayBlocks] of map) {
    dayBlocks.sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
  }
  return map;
}

function groupTasksByDate(tasks: TaskRow[]): Map<string, TaskRow[]> {
  const map = new Map<string, TaskRow[]>();
  for (const task of tasks) {
    if (!task.due_date) continue;
    const key = getDateKey(new Date(task.due_date));
    const existing = map.get(key) ?? [];
    existing.push(task);
    map.set(key, existing);
  }
  return map;
}

function groupSubtasksByDate(subtasks: SubtaskRow[]): Map<string, SubtaskRow[]> {
  const map = new Map<string, SubtaskRow[]>();
  for (const sub of subtasks) {
    if (!sub.due_date) continue;
    const key = getDateKey(new Date(sub.due_date));
    const existing = map.get(key) ?? [];
    existing.push(sub);
    map.set(key, existing);
  }
  // Sort by sort_order within each day
  for (const [, daySubs] of map) {
    daySubs.sort((a, b) => a.sort_order - b.sort_order);
  }
  return map;
}

function getRangeLabel(date: Date, mode: ViewMode): string {
  switch (mode) {
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
    case "week": {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, "MMM d")} – ${format(weekEnd, "d, yyyy")}`;
      }
      return `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;
    }
    case "month":
      return format(date, "MMMM yyyy");
  }
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-gray-100 text-gray-600" },
  doing: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  done: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
};

// ---------------------------------------------------------------------------
// Task card component (for due dates on calendar)
// ---------------------------------------------------------------------------

function TaskCard({ task, colorMap, onClick }: { task: TaskRow; colorMap: CourseColorMap; onClick?: () => void }) {
  const colors = getCourseColor(task.courseName, colorMap);
  const isDone = task.status === "done";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-lg border px-3 py-2 text-left transition-all duration-150",
        isDone ? "bg-gray-50 border-gray-200 opacity-60" : colors.bg,
        onClick ? "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-300/50 active:scale-[0.99]" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${isDone ? "bg-gray-400" : colors.dot}`} />
        <div className="min-w-0 flex-1">
          <p
            className={[
              "text-sm font-medium",
              isDone ? "text-gray-500 line-through" : colors.text,
            ].join(" ")}
          >
            {task.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
            {task.courseName && (
              <span className={isDone ? "text-gray-400" : colors.text + " font-medium opacity-70"}>
                {task.courseName}
              </span>
            )}
            <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 uppercase">
              {TYPE_LABELS[task.type] ?? task.type}
            </span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE[task.status]?.className ?? ""}`}>
              {STATUS_BADGE[task.status]?.label ?? task.status}
            </span>
            {(task.type === "exam" || task.type === "reading") && (
              <Link
                href={`/study?task_id=${task.id}`}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                onClick={(e) => e.stopPropagation()}
              >
                Study
              </Link>
            )}
            {onClick && (
              <svg className="ml-auto h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Subtask milestone card (for due dates on calendar)
// ---------------------------------------------------------------------------

function SubtaskCard({ subtask, colorMap }: { subtask: SubtaskRow; colorMap: CourseColorMap }) {
  const colors = getCourseColor(subtask.courseName, colorMap);
  const isDone = subtask.status === "done";

  return (
    <div
      className={[
        "rounded-lg border px-3 py-2 border-dashed",
        isDone ? "bg-gray-50 border-gray-200 opacity-60" : colors.bg,
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <span className="mt-1 text-sm">🏁</span>
        <div className="min-w-0 flex-1">
          <p
            className={[
              "text-sm font-medium",
              isDone ? "text-gray-500 line-through" : colors.text,
            ].join(" ")}
          >
            {subtask.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
            {subtask.courseName && (
              <span className={isDone ? "text-gray-400" : colors.text + " font-medium opacity-70"}>
                {subtask.courseName}
              </span>
            )}
            <span className="text-gray-400 italic truncate">
              {subtask.parentTitle}
            </span>
            {isDone && (
              <span className="text-green-600 font-medium">Done</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit Task Dialog — opens when clicking a task on the calendar
// ---------------------------------------------------------------------------

function EditTaskDialog({
  task,
  courses,
  onClose,
}: {
  task: TaskRow;
  courses: CourseOption[];
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => onClose();
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  // Convert TaskRow to the shape TaskForm expects
  const editTask = {
    id: task.id,
    title: task.title,
    type: task.type,
    status: task.status,
    due_date: task.due_date,
    estimated_minutes: task.estimated_minutes,
    course_id: task.course_id,
    notes: task.notes,
    grade: task.grade,
    points: task.points,
    weight: task.weight,
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-0 shadow-[var(--shadow-dialog)] ring-1 ring-gray-900/5 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4">
        <TaskForm
          task={editTask}
          courses={courses}
          onSuccess={() => dialogRef.current?.close()}
        />
      </div>
    </dialog>
  );
}

// ---------------------------------------------------------------------------
// Helper: Convert PlanBlockRow to TaskRow for editing
// ---------------------------------------------------------------------------

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
// Sub-components
// ---------------------------------------------------------------------------

function CourseLegend({ colorMap }: { colorMap: CourseColorMap }) {
  if (colorMap.size === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      {Array.from(colorMap.entries()).map(([name, colors]) => (
        <div key={name} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-full ${colors.legend}`} />
          <span className="text-xs font-medium text-gray-700">{name}</span>
        </div>
      ))}
    </div>
  );
}

function DayView({
  date,
  blocksByDate,
  tasksByDate,
  subtasksByDate,
  colorMap,
  onTaskClick,
  onBlockClick,
}: {
  date: Date;
  blocksByDate: Map<string, PlanBlockRow[]>;
  tasksByDate: Map<string, TaskRow[]>;
  subtasksByDate: Map<string, SubtaskRow[]>;
  colorMap: CourseColorMap;
  onTaskClick: (task: TaskRow) => void;
  onBlockClick: (block: PlanBlockRow) => void;
}) {
  const key = getDateKey(date);
  const blocks = blocksByDate.get(key) ?? [];
  const tasks = tasksByDate.get(key) ?? [];
  const subtasks = subtasksByDate.get(key) ?? [];

  const remainingMinutes = blocks
    .filter((b) => b.status === "scheduled")
    .reduce((sum, b) => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      return sum + (end.getTime() - start.getTime()) / 60000;
    }, 0);

  const hours = Math.floor(remainingMinutes / 60);
  const mins = Math.round(remainingMinutes % 60);
  const hasBlocks = blocks.length > 0;
  const allDone = hasBlocks && remainingMinutes === 0;

  return (
    <div className="space-y-6">
      {/* Assignments due this day */}
      {tasks.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Due This Day ({tasks.length})
          </h3>
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} colorMap={colorMap} onClick={() => onTaskClick(task)} />
            ))}
          </div>
        </div>
      )}

      {/* Subtask milestones due this day */}
      {subtasks.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
            🏁 Milestones Due ({subtasks.length})
          </h3>
          <div className="flex flex-col gap-2">
            {subtasks.map((sub) => (
              <SubtaskCard key={sub.id} subtask={sub} colorMap={colorMap} />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled study blocks */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-900">
          Scheduled Blocks
        </h3>

        {/* Time remaining card */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-500">Time Remaining</p>
          {allDone ? (
            <p className="mt-1 text-2xl font-bold text-green-600">All done!</p>
          ) : hasBlocks ? (
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {hours > 0 ? `${hours}h ` : ""}
              {mins}m
            </p>
          ) : (
            <p className="mt-1 text-lg text-gray-400">No blocks scheduled</p>
          )}
        </div>

        {blocks.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
            No study blocks scheduled for this day
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {blocks.map((block) => (
              <PlanBlock
                key={block.id}
                block={block}
                onEditTask={() => onBlockClick(block)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && subtasks.length === 0 && blocks.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-8 text-center">
          <p className="text-sm text-gray-400">Nothing scheduled for this day</p>
          <p className="mt-2 text-sm text-gray-500">
            Use <span className="font-medium text-gray-700">&ldquo;Add Block&rdquo;</span> to schedule a study session, or{" "}
            <span className="font-medium text-gray-700">&ldquo;Generate Plan&rdquo;</span>{" "}
            to auto-create your schedule.
          </p>
          <Link
            href="/tasks"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Go to Tasks &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Droppable day column wrapper for drag-and-drop in Week view
// ---------------------------------------------------------------------------

function DroppableDayColumn({ dateKey, children }: { dateKey: string; children: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: dateKey });

  return (
    <div
      ref={setNodeRef}
      className={[
        "min-w-0 rounded-lg transition-colors duration-150",
        isOver ? "bg-blue-50 ring-2 ring-blue-300 ring-inset" : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function WeekView({
  date,
  blocksByDate,
  tasksByDate,
  subtasksByDate,
  colorMap,
  onTaskClick,
}: {
  date: Date;
  blocksByDate: Map<string, PlanBlockRow[]>;
  tasksByDate: Map<string, TaskRow[]>;
  subtasksByDate: Map<string, SubtaskRow[]>;
  colorMap: CourseColorMap;
  onTaskClick: (task: TaskRow) => void;
}) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const days = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const [activeBlock, setActiveBlock] = useState<PlanBlockRow | null>(null);

  // Configure sensors: pointer (desktop) + touch (mobile with long-press)
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

    // Get the block's current date key
    const block = active.data.current?.block as PlanBlockRow | undefined;
    if (!block) return;
    const currentDateKey = getDateKey(new Date(block.start_time));

    // Don't move if dropped on the same day
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((day) => {
          const key = getDateKey(day);
          const blocks = blocksByDate.get(key) ?? [];
          const tasks = tasksByDate.get(key) ?? [];
          const subtasks = subtasksByDate.get(key) ?? [];
          const today = isToday(day);
          const hasContent = blocks.length > 0 || tasks.length > 0 || subtasks.length > 0;

          return (
            <DroppableDayColumn key={key} dateKey={key}>
              {/* Day header */}
              <div
                className={[
                  "mb-2 rounded-md px-2 py-1 text-center",
                  today ? "bg-blue-100" : "bg-gray-100",
                ].join(" ")}
              >
                <p className={["text-xs font-semibold", today ? "text-blue-700" : "text-gray-700"].join(" ")}>
                  {format(day, "EEE")}
                </p>
                <p className={["text-xs", today ? "text-blue-600" : "text-gray-500"].join(" ")}>
                  {format(day, "MMM d")}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                {/* Tasks due this day — colored by course */}
                {tasks.map((task) => {
                  const colors = getCourseColor(task.courseName, colorMap);
                  const isDone = task.status === "done";
                  return (
                    <button
                      type="button"
                      key={`task-${task.id}`}
                      onClick={() => onTaskClick(task)}
                      className={[
                        "w-full rounded-lg border px-2 py-2 text-left transition-all duration-150",
                        isDone ? "bg-gray-50 border-gray-200 opacity-60" : colors.bg,
                        "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-blue-300/50",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-1">
                        <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${isDone ? "bg-gray-400" : colors.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className={["line-clamp-2 text-xs font-semibold leading-tight", isDone ? "text-gray-400 line-through" : colors.text].join(" ")}>
                            {task.title}
                          </p>
                          {task.courseName && (
                            <p className="mt-0.5 truncate text-[11px] leading-tight text-gray-400">
                              {task.courseName}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Subtask milestones — dashed border, milestone icon */}
                {subtasks.map((sub) => {
                  const subColors = getCourseColor(sub.courseName, colorMap);
                  const subDone = sub.status === "done";
                  return (
                    <div
                      key={`sub-${sub.id}`}
                      className={[
                        "rounded-lg border border-dashed px-2 py-1.5",
                        subDone ? "bg-gray-50 border-gray-200 opacity-60" : subColors.bg,
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">🏁</span>
                        <p className={["truncate text-xs font-medium", subDone ? "text-gray-400 line-through" : subColors.text].join(" ")}>
                          {sub.title}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-gray-400 pl-4 italic">
                        {sub.parentTitle}
                      </p>
                    </div>
                  );
                })}

                {/* Scheduled blocks — draggable */}
                {blocks.map((block) => {
                  const taskRow = blockToTaskRow(block);
                  return (
                    <PlanBlock
                      key={block.id}
                      block={block}
                      onEditTask={taskRow ? () => onTaskClick(taskRow) : undefined}
                      draggable
                    />
                  );
                })}

                {!hasContent && (
                  <p className="px-2 py-3 text-center text-xs text-gray-400">
                    No items
                  </p>
                )}
              </div>
            </DroppableDayColumn>
          );
        })}
      </div>

      {/* Drag overlay — shows a preview of the block being dragged */}
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
  );
}

function MonthView({
  date,
  blocksByDate,
  tasksByDate,
  subtasksByDate,
  allTasks,
  colorMap,
  onDayClick,
  onTaskClick,
}: {
  date: Date;
  blocksByDate: Map<string, PlanBlockRow[]>;
  tasksByDate: Map<string, TaskRow[]>;
  subtasksByDate: Map<string, SubtaskRow[]>;
  allTasks: TaskRow[];
  colorMap: CourseColorMap;
  onDayClick: (day: Date) => void;
  onTaskClick: (task: TaskRow) => void;
}) {
  // Build a lookup for finding parent tasks by ID
  const taskById = useMemo(() => {
    const map = new Map<string, TaskRow>();
    for (const t of allTasks) map.set(t.id, t);
    return map;
  }, [allTasks]);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const weeks: Date[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-semibold text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200 last:border-b-0">
            {week.map((day) => {
              const key = getDateKey(day);
              const blocks = blocksByDate.get(key) ?? [];
              const tasks = tasksByDate.get(key) ?? [];
              const subtasks = subtasksByDate.get(key) ?? [];
              const inMonth = isSameMonth(day, date);
              const today = isToday(day);

              // Combine tasks + subtasks + blocks for display
              const allItems = [
                ...tasks.map((t) => ({
                  id: `t-${t.id}`,
                  label: t.title,
                  itemType: "task" as const,
                  courseName: t.courseName,
                  isDone: t.status === "done",
                  taskStatus: t.status,
                  taskRow: t,
                })),
                ...subtasks.map((s) => {
                  // Try to find the parent task; if not found, build a minimal TaskRow from subtask data
                  let resolvedTaskRow: TaskRow | null = taskById.get(s.task_id) ?? null;
                  if (!resolvedTaskRow) {
                    resolvedTaskRow = {
                      id: s.task_id,
                      title: s.parentTitle,
                      type: s.parentType as "assignment" | "exam" | "reading" | "other",
                      status: s.status === "done" ? "done" : "todo",
                      due_date: s.due_date,
                      estimated_minutes: s.estimated_minutes,
                      course_id: "",
                      courseName: s.courseName,
                    };
                  }
                  return {
                    id: `s-${s.id}`,
                    label: `🏁 ${s.title}`,
                    itemType: "subtask" as const,
                    courseName: s.courseName,
                    isDone: s.status === "done",
                    taskStatus: s.status,
                    taskRow: resolvedTaskRow,
                  };
                }),
                ...blocks.map((b) => {
                  // Try to find the parent task in our lookup, or build a TaskRow from the block's embedded data
                  let resolvedTaskRow: TaskRow | null = b.task_id ? taskById.get(b.task_id) ?? null : null;
                  if (!resolvedTaskRow && b.task_id && b.tasks) {
                    resolvedTaskRow = {
                      id: b.task_id,
                      title: b.tasks.title,
                      type: b.tasks.type,
                      status: b.tasks.taskStatus as "todo" | "doing" | "done",
                      due_date: b.tasks.due_date,
                      estimated_minutes: b.tasks.estimated_minutes,
                      course_id: b.tasks.course_id,
                      courseName: b.tasks.courses?.name ?? null,
                    };
                  }
                  return {
                    id: `b-${b.id}`,
                    label: b.tasks?.title ?? "Block",
                    itemType: "block" as const,
                    courseName: b.tasks?.courses?.name ?? null,
                    isDone: b.status === "done",
                    taskStatus: b.tasks?.taskStatus ?? "todo",
                    taskRow: resolvedTaskRow,
                  };
                }),
              ];

              return (
                <div
                  key={key}
                  className={[
                    "min-h-[80px] p-1 text-left transition-colors",
                    inMonth ? "bg-white" : "bg-gray-50",
                  ].join(" ")}
                >
                  {/* Day number — clickable to drill into Day view */}
                  <div className="flex items-center justify-between mb-0.5">
                    <button
                      type="button"
                      onClick={() => onDayClick(day)}
                      className={[
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                        today
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : inMonth
                            ? "text-gray-900"
                            : "text-gray-400",
                      ].join(" ")}
                    >
                      {format(day, "d")}
                    </button>
                    {allItems.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {allItems.length}
                      </span>
                    )}
                  </div>

                  {/* Compact indicators — colored by course, all clickable */}
                  <div className="flex flex-col gap-0.5">
                    {allItems.slice(0, 3).map((item) => {
                      const colors = getCourseColor(item.courseName, colorMap);

                      if (item.itemType === "task") {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (item.taskRow) onTaskClick(item.taskRow);
                            }}
                            className={[
                              "flex items-center gap-0.5 truncate rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer transition-shadow hover:ring-1 hover:ring-blue-300 text-left w-full",
                              item.isDone ? "bg-gray-100 text-gray-400 line-through" : colors.chip,
                            ].join(" ")}
                          >
                            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${item.isDone ? "bg-emerald-500" : item.taskStatus === "doing" ? "bg-blue-500" : colors.dot}`} />
                            <span className="truncate">{item.label}</span>
                            {item.taskStatus === "done" && <span className="flex-shrink-0 text-emerald-600">✓</span>}
                            {item.taskStatus === "doing" && <span className="flex-shrink-0 text-blue-600">◑</span>}
                          </button>
                        );
                      }
                      if (item.itemType === "subtask") {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (item.taskRow) onTaskClick(item.taskRow);
                              else onDayClick(day);
                            }}
                            className={[
                              "flex items-center gap-0.5 truncate rounded border border-dashed px-1 py-0.5 text-[10px] leading-tight cursor-pointer hover:ring-1 hover:ring-blue-300 text-left w-full",
                              item.isDone ? "bg-gray-100 text-gray-400 border-gray-300 line-through" : colors.chip + " border-current",
                            ].join(" ")}
                          >
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      }
                      // block — click to edit the parent task
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.taskRow) onTaskClick(item.taskRow);
                            else onDayClick(day);
                          }}
                          className={[
                            "flex items-center gap-0.5 truncate rounded px-1 py-0.5 text-[10px] leading-tight cursor-pointer hover:ring-1 hover:ring-blue-300 text-left w-full",
                            item.isDone ? "bg-green-100 text-green-700" : colors.chip,
                          ].join(" ")}
                        >
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${item.isDone ? "bg-green-500" : colors.dot}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                    {allItems.length > 3 && (
                      <button
                        type="button"
                        onClick={() => onDayClick(day)}
                        className="text-[10px] text-blue-500 hover:text-blue-700 px-1 text-left cursor-pointer"
                      >
                        +{allItems.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function CalendarView({
  blocks,
  tasks,
  subtasks,
  riskTasks,
  hasAvailability,
  courses,
}: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [editingTask, setEditingTask] = useState<TaskRow | null>(null);
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const [blockFormData, setBlockFormData] = useState<Partial<BlockFormData> | null>(null);

  // Initialize from URL params
  const initialView = (searchParams.get("view") as ViewMode) || "week";
  const initialDate = searchParams.get("date")
    ? parseISO(searchParams.get("date")!)
    : new Date();

  const [viewMode, setViewMode] = useState<ViewMode>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  // Build course → color mapping
  const courseColorMap = useMemo(() => buildCourseColorMap(tasks, blocks, subtasks), [tasks, blocks, subtasks]);

  // Group blocks, tasks, and subtasks by date for fast lookup
  const blocksByDate = useMemo(() => groupBlocksByDate(blocks), [blocks]);
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const subtasksByDate = useMemo(() => groupSubtasksByDate(subtasks), [subtasks]);

  // URL sync helper
  const updateUrl = useCallback(
    (newView: ViewMode, newDate: Date) => {
      const params = new URLSearchParams();
      params.set("view", newView);
      params.set("date", format(newDate, "yyyy-MM-dd"));
      router.replace(`/plan?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // Navigation
  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    updateUrl(viewMode, today);
  };

  const goPrev = () => {
    let newDate: Date;
    switch (viewMode) {
      case "day":
        newDate = subDays(currentDate, 1);
        break;
      case "week":
        newDate = subWeeks(currentDate, 1);
        break;
      case "month":
        newDate = subMonths(currentDate, 1);
        break;
    }
    setCurrentDate(newDate);
    updateUrl(viewMode, newDate);
  };

  const goNext = () => {
    let newDate: Date;
    switch (viewMode) {
      case "day":
        newDate = addDays(currentDate, 1);
        break;
      case "week":
        newDate = addWeeks(currentDate, 1);
        break;
      case "month":
        newDate = addMonths(currentDate, 1);
        break;
    }
    setCurrentDate(newDate);
    updateUrl(viewMode, newDate);
  };

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    updateUrl(mode, currentDate);
  };

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setViewMode("day");
    updateUrl("day", day);
  };

  const handleBlockClick = useCallback((block: PlanBlockRow) => {
    setBlockFormData({
      blockId: block.id,
      taskId: block.task_id ?? undefined,
      date: format(new Date(block.start_time), "yyyy-MM-dd"),
      startTime: `${String(new Date(block.start_time).getHours()).padStart(2, "0")}:${String(new Date(block.start_time).getMinutes()).padStart(2, "0")}`,
      endTime: `${String(new Date(block.end_time).getHours()).padStart(2, "0")}:${String(new Date(block.end_time).getMinutes()).padStart(2, "0")}`,
      status: block.status,
      taskStatus: (block.tasks?.taskStatus as "todo" | "doing" | "done") ?? "todo",
    });
  }, []);

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generatePlan();
      if (result.success) {
        if (result.blocksScheduled && result.blocksScheduled > 0) {
          toast(`${result.blocksScheduled} blocks scheduled`);
        } else {
          toast("No blocks could be scheduled");
        }
      } else {
        toast("Failed to generate plan");
      }
    });
  };

  const viewButtons: { mode: ViewMode; label: string }[] = [
    { mode: "day", label: "Day" },
    { mode: "week", label: "Week" },
    { mode: "month", label: "Month" },
  ];

  return (
    <div>
      {/* ---- Top bar ---- */}
      <div className="mb-6 space-y-3">
        {/* Row 1: Title + action buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="page-title">Your Plan</h2>
          <div className="flex items-center gap-2">
            <ExportButton />
            <button
              onClick={() => setBlockFormData({ date: format(currentDate, "yyyy-MM-dd") })}
              className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-medium text-blue-600 transition-all duration-150 hover:bg-blue-50 hover:border-blue-400 active:scale-[0.98]"
            >
              <span className="flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Block
              </span>
            </button>
            <button
              onClick={() => {
                setShowConfirmGenerate(true);
                setTimeout(() => confirmDialogRef.current?.showModal(), 0);
              }}
              disabled={isPending}
              className="btn-primary disabled:opacity-60"
            >
              {isPending ? "Generating..." : "Generate Plan"}
            </button>
          </div>
        </div>

        {/* Row 2: Navigation + view toggle */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* Date navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="rounded-md border border-gray-300 p-1.5 text-gray-600 transition-all duration-150 hover:bg-gray-100 active:scale-95"
              aria-label="Previous"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToday}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-100 active:scale-95"
            >
              Today
            </button>
            <button
              onClick={goNext}
              className="rounded-md border border-gray-300 p-1.5 text-gray-600 transition-all duration-150 hover:bg-gray-100 active:scale-95"
              aria-label="Next"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Range label */}
            <span className="ml-2 text-base font-semibold text-gray-900">
              {getRangeLabel(currentDate, viewMode)}
            </span>
          </div>

          {/* View mode toggle */}
          <div className="flex rounded-lg bg-gray-100 p-0.5">
            {viewButtons.map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => switchView(mode)}
                className={[
                  "rounded-md px-3 py-1 text-sm font-medium transition-all duration-200",
                  viewMode === mode
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course color legend */}
      <CourseLegend colorMap={courseColorMap} />

      {/* No availability warning */}
      {!hasAvailability && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Add availability windows in Settings before generating a plan.{" "}
          <a
            href="/onboarding"
            className="font-medium underline hover:text-amber-900"
          >
            Set availability
          </a>
        </div>
      )}

      {/* ---- View content ---- */}
      {viewMode === "day" && (
        <div className="space-y-4">
          {/* Time Remaining card */}
          {(() => {
            const dayKey = getDateKey(currentDate);
            const dayBlocks = blocksByDate.get(dayKey) ?? [];
            const remainingMinutes = dayBlocks
              .filter((b) => b.status === "scheduled")
              .reduce((sum, b) => {
                const s = new Date(b.start_time);
                const e = new Date(b.end_time);
                return sum + (e.getTime() - s.getTime()) / 60000;
              }, 0);
            const hrs = Math.floor(remainingMinutes / 60);
            const mns = Math.round(remainingMinutes % 60);
            const hasBlocks = dayBlocks.length > 0;
            const allDone = hasBlocks && remainingMinutes === 0;

            return (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-sm font-medium text-gray-500">Time Remaining</p>
                {allDone ? (
                  <p className="mt-1 text-2xl font-bold text-green-600">All done!</p>
                ) : hasBlocks ? (
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {hrs > 0 ? `${hrs}h ` : ""}{mns}m
                  </p>
                ) : (
                  <p className="mt-1 text-lg text-gray-400">No blocks scheduled</p>
                )}
              </div>
            );
          })()}
          <TimeGrid
            days={[currentDate]}
            blocksByDate={blocksByDate}
            tasksByDate={tasksByDate}
            subtasksByDate={subtasksByDate}
            colorMap={courseColorMap}
            onTaskClick={setEditingTask}
            onBlockClick={handleBlockClick}
          />
        </div>
      )}
      {viewMode === "week" && (
        <TimeGrid
          days={eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 0 }),
            end: addDays(startOfWeek(currentDate, { weekStartsOn: 0 }), 6),
          })}
          blocksByDate={blocksByDate}
          tasksByDate={tasksByDate}
          subtasksByDate={subtasksByDate}
          colorMap={courseColorMap}
          onTaskClick={setEditingTask}
          onBlockClick={handleBlockClick}
        />
      )}
      {viewMode === "month" && (
        <MonthView
          date={currentDate}
          blocksByDate={blocksByDate}
          tasksByDate={tasksByDate}
          subtasksByDate={subtasksByDate}
          allTasks={tasks}
          colorMap={courseColorMap}
          onDayClick={handleDayClick}
          onTaskClick={setEditingTask}
        />
      )}

      {/* ---- Risk badges ---- */}
      {riskTasks.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-gray-500">
            Risk warnings
          </p>
          <div className="flex flex-wrap gap-2">
            {riskTasks.map((rt) => {
              const riskTask = tasks.find((t) => t.id === rt.taskId);
              return (
                <RiskBadge
                  key={rt.taskId}
                  level={rt.level}
                  taskTitle={rt.taskTitle}
                  onClick={riskTask ? () => setEditingTask(riskTask) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ---- Edit Task Dialog ---- */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          courses={courses}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* ---- Add/Edit Block Dialog ---- */}
      {blockFormData && (
        <BlockFormDialog
          tasks={tasks.filter((t) => t.status !== "done").map((t) => ({
            id: t.id,
            title: t.title,
            courseName: t.courseName,
            type: t.type,
          }))}
          courses={courses}
          initialData={blockFormData}
          onClose={() => setBlockFormData(null)}
        />
      )}

      {/* ---- Generate Plan Confirmation Dialog ---- */}
      {showConfirmGenerate && (
        <dialog
          ref={confirmDialogRef}
          className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-0 shadow-[var(--shadow-dialog)] ring-1 ring-gray-900/5 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
          onClose={() => setShowConfirmGenerate(false)}
        >
          <div className="px-6 py-5">
            <h3 className="text-lg font-semibold text-gray-900">
              Regenerate Plan?
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              This will replace all your currently scheduled blocks with a new
              plan. Done and missed blocks will be kept.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  confirmDialogRef.current?.close();
                  setShowConfirmGenerate(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  confirmDialogRef.current?.close();
                  setShowConfirmGenerate(false);
                  handleGenerate();
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
