"use client";

import { useState } from "react";
import Link from "next/link";
import TaskForm from "./TaskForm";
import StatusToggle from "./StatusToggle";
import DeleteConfirm from "./DeleteConfirm";
import RecurrenceDeleteDialog from "./RecurrenceDeleteDialog";
import { toggleSubtaskStatus } from "../actions";

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
  recurrence_parent_id?: string | null;
  recurrence_rule?: Record<string, unknown> | null;
  courses: { id: string; name: string } | null;
}

interface Subtask {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  estimated_minutes: number;
  sort_order: number;
  task_id: string;
}

interface TaskListProps {
  tasks: Task[];
  courses: Course[];
  subtasksByTask?: Record<string, Subtask[]>;
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

export default function TaskList({ tasks, courses, subtasksByTask = {} }: TaskListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

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
          className="btn-primary"
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
          className="btn-primary"
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
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)]"
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
                    {(task.recurrence_parent_id || task.recurrence_rule) && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600" title="Recurring task">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Recurring
                      </span>
                    )}
                    {task.reminder_minutes_before != null && task.reminder_minutes_before > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600" title="Reminder set">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </span>
                    )}
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
                  {(task.type === "exam" || task.type === "reading") && (
                    <Link
                      href={`/study?task_id=${task.id}`}
                      className="rounded-lg px-2 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                      title="Start study session"
                    >
                      Study
                    </Link>
                  )}
                  <button
                    onClick={() => setEditingTask(task)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
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
                    className="rounded-lg p-1.5 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-500"
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

            {/* Subtask milestones section */}
            {(() => {
              const subs = subtasksByTask[task.id];
              if (!subs || subs.length === 0) return null;
              const doneCount = subs.filter((s) => s.status === "done").length;
              const isExpanded = expandedTasks.has(task.id);

              return (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <button
                    onClick={() => toggleExpand(task.id)}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>🏁</span>
                    <span className="font-medium">
                      {doneCount}/{subs.length} milestones
                    </span>
                    {/* Progress bar */}
                    <div className="h-1.5 w-20 rounded-full bg-gray-200">
                      <div
                        className="h-1.5 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${(doneCount / subs.length) * 100}%` }}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-2 ml-5 space-y-1.5">
                      {subs.map((sub) => (
                        <div key={sub.id} className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              const newStatus = sub.status === "done" ? "todo" : "done";
                              await toggleSubtaskStatus(sub.id, newStatus);
                            }}
                            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                              sub.status === "done"
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-gray-300 hover:border-blue-400"
                            }`}
                          >
                            {sub.status === "done" && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <span
                            className={`text-sm ${
                              sub.status === "done" ? "text-gray-400 line-through" : "text-gray-700"
                            }`}
                          >
                            {sub.title}
                          </span>
                          {sub.due_date && (
                            <span className="text-xs text-gray-400">
                              {formatDueDate(sub.due_date)}
                            </span>
                          )}
                          {sub.estimated_minutes > 0 && (
                            <span className="text-xs text-gray-400">
                              {sub.estimated_minutes >= 60
                                ? `${Math.floor(sub.estimated_minutes / 60)}h${sub.estimated_minutes % 60 > 0 ? ` ${sub.estimated_minutes % 60}m` : ""}`
                                : `${sub.estimated_minutes}m`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deletingTask && (
        deletingTask.recurrence_parent_id || deletingTask.recurrence_rule ? (
          <RecurrenceDeleteDialog
            taskId={deletingTask.id}
            taskTitle={deletingTask.title}
            onClose={() => setDeletingTask(null)}
          />
        ) : (
          <DeleteConfirm
            task={deletingTask}
            onClose={() => setDeletingTask(null)}
          />
        )
      )}
    </div>
  );
}
