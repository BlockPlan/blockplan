"use client";

import { useState } from "react";
import TaskForm from "./TaskForm";
import StatusToggle from "./StatusToggle";
import DeleteConfirm from "./DeleteConfirm";

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
  courses: { id: string; name: string } | null;
}

interface TaskListProps {
  tasks: Task[];
  courses: Course[];
}

const TYPE_BADGE_COLORS: Record<Task["type"], string> = {
  assignment: "bg-blue-100 text-blue-700",
  exam: "bg-red-100 text-red-700",
  reading: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-600",
};

const TYPE_LABELS: Record<Task["type"], string> = {
  assignment: "Assignment",
  exam: "Exam",
  reading: "Reading",
  other: "Other",
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const due = new Date(dateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 3;
}

function isPastDue(dateStr: string | null, status: Task["status"]): boolean {
  if (!dateStr || status === "done") return false;
  return new Date(dateStr) < new Date();
}

export default function TaskList({ tasks, courses }: TaskListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  if (tasks.length === 0 && !showCreateForm) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-7 w-7 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="mb-1 text-base font-semibold text-gray-900">
          No tasks yet
        </h3>
        <p className="mb-5 text-sm text-gray-500">
          Create your first task to start tracking your work.
        </p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <svg
            className="mr-1.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Task
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header row with Add Task button */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </p>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <svg
            className="mr-1.5 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Task
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">New Task</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <TaskForm
            courses={courses}
            onSuccess={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border border-gray-200 bg-white p-4"
          >
            {editingTask?.id === task.id ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Edit Task</h3>
                  <button
                    onClick={() => setEditingTask(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <TaskForm
                  task={task}
                  courses={courses}
                  onSuccess={() => setEditingTask(null)}
                />
              </div>
            ) : (
              <div className="flex items-start gap-3">
                {/* Status toggle */}
                <div className="mt-0.5 flex-shrink-0">
                  <StatusToggle taskId={task.id} currentStatus={task.status} />
                </div>

                {/* Task content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-base font-medium ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-900"}`}
                    >
                      {task.title}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLORS[task.type]}`}
                    >
                      {TYPE_LABELS[task.type]}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {/* Course name */}
                    {task.courses && (
                      <span className="font-medium text-gray-600">
                        {task.courses.name}
                      </span>
                    )}

                    {/* Due date */}
                    {task.due_date ? (
                      <span
                        className={
                          isPastDue(task.due_date, task.status)
                            ? "font-medium text-red-600"
                            : isDueSoon(task.due_date)
                              ? "font-medium text-amber-600"
                              : ""
                        }
                      >
                        Due {formatDueDate(task.due_date)}
                      </span>
                    ) : (
                      <span className="text-gray-400">No due date</span>
                    )}

                    {/* Estimated time */}
                    {task.estimated_minutes && (
                      <span className="text-gray-400">
                        {task.estimated_minutes >= 60
                          ? `${Math.floor(task.estimated_minutes / 60)}h ${task.estimated_minutes % 60 > 0 ? `${task.estimated_minutes % 60}m` : ""}`.trim()
                          : `${task.estimated_minutes}m`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Edit task"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setDeletingTask(task)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Delete task"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deletingTask && (
        <DeleteConfirm
          task={deletingTask}
          onClose={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
