"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { addBlock, updateBlock, deleteBlock } from "../actions";
import { updateTaskStatus } from "@/app/tasks/actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TaskOption {
  id: string;
  title: string;
  courseName: string | null;
  type: string;
}

interface BlockFormData {
  blockId?: string; // present when editing
  taskId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status?: string;
  taskStatus?: "todo" | "doing" | "done";
}

interface CourseOption {
  id: string;
  name: string;
}

interface BlockFormDialogProps {
  /** Tasks available for selection */
  tasks: TaskOption[];
  /** Courses available for custom blocks */
  courses?: CourseOption[];
  /** Pre-filled data (for editing or pre-selecting a date/time) */
  initialData?: Partial<BlockFormData>;
  /** Called after successful save or delete */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toLocalTimeString(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toLocalDateString(isoString: string): string {
  const d = new Date(isoString);
  return format(d, "yyyy-MM-dd");
}

function buildISO(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BlockFormDialog({
  tasks,
  courses = [],
  initialData,
  onClose,
}: BlockFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  const isEditing = !!initialData?.blockId;

  // Form state
  const [mode, setMode] = useState<"existing" | "custom">(
    initialData?.taskId ? "existing" : "existing"
  );
  const [taskId, setTaskId] = useState(initialData?.taskId ?? tasks[0]?.id ?? "");
  const [customTitle, setCustomTitle] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [date, setDate] = useState(
    initialData?.date ?? format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(initialData?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initialData?.endTime ?? "10:00");
  const [taskStatus, setTaskStatus] = useState<"todo" | "doing" | "done">(
    initialData?.taskStatus ?? "todo"
  );
  const [error, setError] = useState<string | null>(null);

  // Open dialog on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    const handleClose = () => onClose();
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  // Validate and submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "existing" && !taskId) {
      setError("Please select a task");
      return;
    }
    if (mode === "custom" && !customTitle.trim()) {
      setError("Please enter a name for this block");
      return;
    }

    const startISO = buildISO(date, startTime);
    const endISO = buildISO(date, endTime);

    if (new Date(endISO) <= new Date(startISO)) {
      setError("End time must be after start time");
      return;
    }

    startTransition(async () => {
      let result;
      if (isEditing) {
        result = await updateBlock(initialData!.blockId!, taskId, startISO, endISO);
      } else if (mode === "custom") {
        result = await addBlock(null, startISO, endISO, customTitle.trim(), courseId || undefined);
      } else {
        result = await addBlock(taskId, startISO, endISO);
      }

      if (result.success) {
        toast(isEditing ? "Block updated" : "Block added");
        dialogRef.current?.close();
      } else {
        setError(result.error ?? "Something went wrong");
      }
    });
  };

  const handleDelete = () => {
    if (!initialData?.blockId) return;

    startTransition(async () => {
      const result = await deleteBlock(initialData!.blockId!);
      if (result.success) {
        toast("Block deleted");
        dialogRef.current?.close();
      } else {
        setError(result.error ?? "Failed to delete block");
      }
    });
  };

  // Group tasks by course for a nicer dropdown
  const tasksByCourse = tasks.reduce<Record<string, TaskOption[]>>(
    (acc, task) => {
      const course = task.courseName ?? "No Course";
      if (!acc[course]) acc[course] = [];
      acc[course].push(task);
      return acc;
    },
    {}
  );
  const courseNames = Object.keys(tasksByCourse).sort();

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-0 shadow-[var(--shadow-dialog)] ring-1 ring-gray-900/5 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing ? "Edit Study Block" : "Add Study Block"}
        </h2>
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
        {/* Mode toggle — existing task or custom name */}
        {!isEditing && (
          <div className="flex rounded-lg border border-gray-300 p-0.5">
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "existing"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Existing Task
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "custom"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Custom Block
            </button>
          </div>
        )}

        {/* Task selector (existing mode) */}
        {(mode === "existing" || isEditing) && (
          <div>
            <label htmlFor="block-task" className="block text-sm font-medium text-gray-700 mb-1">
              Task
            </label>
            <select
              id="block-task"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {tasks.length === 0 && (
                <option value="">No tasks available</option>
              )}
              {courseNames.map((course) => (
                <optgroup key={course} label={course}>
                  {tasksByCourse[course].map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* Custom block name (custom mode) */}
        {mode === "custom" && !isEditing && (
          <div>
            <label htmlFor="block-custom" className="block text-sm font-medium text-gray-700 mb-1">
              Block Name
            </label>
            <input
              id="block-custom"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g., Review lecture notes, Group study session"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will create a personal task on your calendar.
            </p>

            {/* Course selector for custom blocks */}
            {courses.length > 0 && (
              <div className="mt-3">
                <label htmlFor="block-course" className="block text-sm font-medium text-gray-700 mb-1">
                  Course (optional)
                </label>
                <select
                  id="block-course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Task status toggle (only when editing a block with an assigned task) */}
        {isEditing && taskId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Status
            </label>
            <div className="flex rounded-lg border border-gray-300 p-0.5">
              {([
                { value: "todo" as const, label: "To Do", icon: "○" },
                { value: "doing" as const, label: "In Progress", icon: "◑" },
                { value: "done" as const, label: "Completed", icon: "●" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTaskStatus(opt.value);
                    startTransition(async () => {
                      const result = await updateTaskStatus(taskId, opt.value);
                      if (result.error) {
                        setError(result.error);
                      } else {
                        toast(`Task marked as ${opt.label.toLowerCase()}`);
                      }
                    });
                  }}
                  disabled={isPending}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    taskStatus === opt.value
                      ? opt.value === "done"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : opt.value === "doing"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-gray-700 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div>
          <label htmlFor="block-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            id="block-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Time range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="block-start" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              id="block-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="block-end" className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              id="block-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Duration preview */}
        {(() => {
          const s = new Date(`${date}T${startTime}:00`);
          const e = new Date(`${date}T${endTime}:00`);
          const diffMin = Math.round((e.getTime() - s.getTime()) / 60000);
          if (diffMin > 0) {
            const hrs = Math.floor(diffMin / 60);
            const mins = diffMin % 60;
            return (
              <p className="text-xs text-gray-500">
                Duration: {hrs > 0 ? `${hrs}h ` : ""}{mins > 0 ? `${mins}m` : hrs > 0 ? "" : "0m"}
              </p>
            );
          }
          return null;
        })()}

        {/* Error message */}
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Delete Block
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || (mode === "existing" && !taskId) || (mode === "custom" && !customTitle.trim())}
              className="btn-primary disabled:opacity-60"
            >
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Add Block"}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}

export type { TaskOption, BlockFormData };
