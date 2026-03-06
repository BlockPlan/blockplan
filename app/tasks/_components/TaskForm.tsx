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
  notes?: string | null;
  grade?: number | null;
  points?: number | null;
  weight?: number | null;
  reminder_minutes_before?: number | null;
}

interface TaskFormProps {
  task?: Task;
  courses: Course[];
  onSuccess?: () => void;
}

const TASK_STATUSES = [
  { value: "todo", label: "To Do", icon: "○", color: "border-gray-300 bg-gray-50 text-gray-700" },
  { value: "doing", label: "In Progress", icon: "◑", color: "border-blue-300 bg-blue-50 text-blue-700" },
  { value: "done", label: "Completed", icon: "●", color: "border-emerald-300 bg-emerald-50 text-emerald-700" },
] as const;

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
  const [selectedStatus, setSelectedStatus] = useState(task?.status ?? "todo");
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatFrequency, setRepeatFrequency] = useState<"daily" | "weekly">("weekly");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

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

      {/* Status toggle — edit mode only */}
      {isEdit && (
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Status
          </label>
          <input type="hidden" name="status" value={selectedStatus} />
          <div className="flex gap-2">
            {TASK_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSelectedStatus(s.value)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  selectedStatus === s.value
                    ? s.color + " ring-2 ring-offset-1 ring-current/25 shadow-sm"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="text-base leading-none">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
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
            className="input"
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
            className="input cursor-pointer"
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
            className="input cursor-pointer"
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
            className="input"
          />
          {state.errors?.due_date && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.due_date[0]}
            </p>
          )}
        </div>

        {/* Recurrence — create mode only */}
        {!isEdit && (
          <div className="sm:col-span-2">
            <div className="flex items-center gap-2">
              <input
                id="repeat_toggle"
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="repeat_toggle" className="text-sm font-medium text-gray-700">
                Repeat task
              </label>
            </div>
            {repeatEnabled && (
              <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <input type="hidden" name="recurrence_frequency" value={repeatFrequency} />
                <input type="hidden" name="recurrence_days" value={selectedDays.join(",")} />
                {/* Frequency toggle */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-600">Frequency</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRepeatFrequency("daily")}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        repeatFrequency === "daily"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepeatFrequency("weekly")}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                        repeatFrequency === "weekly"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Weekly
                    </button>
                  </div>
                </div>
                {/* Day selector — weekly only */}
                {repeatFrequency === "weekly" && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-600">Repeat on</p>
                    <div className="flex gap-1.5">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setSelectedDays((prev) =>
                              prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
                            )
                          }
                          className={`h-8 w-10 rounded-lg text-xs font-medium transition-all ${
                            selectedDays.includes(i)
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-100"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="recurrence_end_date"
                    className="mb-1 block text-xs font-medium text-gray-600"
                  >
                    Repeat until
                  </label>
                  <input
                    id="recurrence_end_date"
                    name="recurrence_end_date"
                    type="date"
                    className="input w-full sm:w-48"
                  />
                </div>
              </div>
            )}
          </div>
        )}

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
            className="input"
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
        {/* Grade section */}
        <div className="sm:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Grading (optional)
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="points"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Points possible
              </label>
              <input
                id="points"
                name="points"
                type="number"
                step="any"
                min="0.01"
                defaultValue={task?.points ?? ""}
                placeholder="e.g. 100"
                className="input"
              />
            </div>
            <div>
              <label
                htmlFor="weight"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Weight
              </label>
              <input
                id="weight"
                name="weight"
                type="number"
                step="any"
                min="0"
                defaultValue={task?.weight ?? ""}
                placeholder="e.g. 10"
                className="input"
              />
            </div>
            <div>
              <label
                htmlFor="grade"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Grade earned
              </label>
              <input
                id="grade"
                name="grade"
                type="number"
                step="any"
                min="0"
                defaultValue={task?.grade ?? ""}
                placeholder="e.g. 95"
                className="input"
              />
            </div>
          </div>
        </div>
        {/* Reminder */}
        <div>
          <label
            htmlFor="reminder_minutes_before"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Reminder
          </label>
          <select
            id="reminder_minutes_before"
            name="reminder_minutes_before"
            defaultValue={task?.reminder_minutes_before?.toString() ?? ""}
            className="input cursor-pointer"
          >
            <option value="">None</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="120">2 hours before</option>
            <option value="1440">1 day before</option>
            <option value="2880">2 days before</option>
            <option value="10080">1 week before</option>
          </select>
          {state.errors?.reminder_minutes_before && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.reminder_minutes_before[0]}
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label
            htmlFor="notes"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={task?.notes ?? ""}
            placeholder="Add any notes, reminders, or details..."
            className="input"
          />
          {state.errors?.notes && (
            <p className="mt-1 text-xs text-red-600">{state.errors.notes[0]}</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full disabled:opacity-50 sm:w-auto"
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
