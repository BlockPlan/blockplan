"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createTask, updateTask, TaskState } from "../actions";
import { DEFAULT_MINUTES } from "@/lib/validations/task";
import { shouldSuggestSubtasks } from "@/lib/services/subtask-suggestions";
import SubtaskSuggestionDialog from "./SubtaskSuggestionDialog";

interface Course {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  type: "assignment" | "exam" | "reading" | "other";
  status: "todo" | "doing" | "done";
  due_date: string | null;
  estimated_minutes: number | null;
  course_id: string;
}

interface TaskFormProps {
  task?: Task;
  courses: Course[];
  onSuccess?: () => void;
}

const TASK_TYPES = [
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "reading", label: "Reading" },
  { value: "other", label: "Other" },
] as const;

const initialState: TaskState = {};

function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  // Handle TIMESTAMPTZ (ISO format) — convert to YYYY-MM-DD for date input
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

export default function TaskForm({ task, courses, onSuccess }: TaskFormProps) {
  const isEdit = !!task;
  const action = isEdit ? updateTask : createTask;

  const [state, formAction, isPending] = useActionState(action, initialState);

  const formRef = useRef<HTMLFormElement>(null);

  // State for subtask suggestion dialog
  const [subtaskSuggestion, setSubtaskSuggestion] = useState<{
    taskId: string;
    dueDate: string;
    estimatedMinutes: number;
  } | null>(null);

  useEffect(() => {
    if (state.success) {
      // Check if the created task qualifies for subtask suggestions
      if (
        !isEdit &&
        state.task &&
        state.task.due_date &&
        shouldSuggestSubtasks(state.task.type, state.task.estimated_minutes)
      ) {
        setSubtaskSuggestion({
          taskId: state.task.id,
          dueDate: state.task.due_date,
          estimatedMinutes: state.task.estimated_minutes,
        });
      }
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [state.success, state.task, isEdit, onSuccess]);

  const defaultType = task?.type ?? "assignment";

  return (
    <>
    <form
      ref={formRef}
      action={formAction}
      key={state.success ? `success-${Date.now()}` : isEdit ? `edit-${task?.id}` : "create"}
    >
      {/* Hidden task id for edit mode */}
      {isEdit && <input type="hidden" name="id" value={task.id} />}

      {/* General error */}
      {state.error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Title */}
        <div className="sm:col-span-2">
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={task?.title ?? ""}
            placeholder="e.g. Chapter 5 Reading"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
          {state.errors?.title && (
            <p className="mt-1 text-xs text-red-600">{state.errors.title[0]}</p>
          )}
        </div>

        {/* Type */}
        <div>
          <label
            htmlFor="type"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            defaultValue={defaultType}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {state.errors?.type && (
            <p className="mt-1 text-xs text-red-600">{state.errors.type[0]}</p>
          )}
        </div>

        {/* Course */}
        <div>
          <label
            htmlFor="course_id"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Course <span className="text-red-500">*</span>
          </label>
          <select
            id="course_id"
            name="course_id"
            defaultValue={task?.course_id ?? ""}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          >
            <option value="" disabled>
              Select a course
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state.errors?.course_id && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.course_id[0]}
            </p>
          )}
        </div>

        {/* Due date */}
        <div>
          <label
            htmlFor="due_date"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Due date
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={formatDateForInput(task?.due_date ?? null)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
          {state.errors?.due_date && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.due_date[0]}
            </p>
          )}
        </div>

        {/* Estimated minutes */}
        <div>
          <label
            htmlFor="estimated_minutes"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Estimated time (minutes)
          </label>
          <input
            id="estimated_minutes"
            name="estimated_minutes"
            type="number"
            min="1"
            max="1440"
            defaultValue={task?.estimated_minutes ?? ""}
            placeholder={`Default: ${DEFAULT_MINUTES[defaultType]}m for ${defaultType}`}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
          {state.errors?.estimated_minutes && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.estimated_minutes[0]}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Leave blank to use default ({DEFAULT_MINUTES[defaultType]}m for{" "}
            {defaultType})
          </p>
        </div>
      </div>

      {/* Submit */}
      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save changes"
              : "Create task"}
        </button>
      </div>
    </form>

    {subtaskSuggestion && (
      <SubtaskSuggestionDialog
        taskId={subtaskSuggestion.taskId}
        taskDueDate={subtaskSuggestion.dueDate}
        taskEstimatedMinutes={subtaskSuggestion.estimatedMinutes}
        onClose={() => setSubtaskSuggestion(null)}
      />
    )}
    </>
  );
}
