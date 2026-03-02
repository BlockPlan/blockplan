"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import { generateSubtaskSuggestions } from "@/lib/services/subtask-suggestions";
import { createSubtasks } from "../actions";

interface SubtaskSuggestionDialogProps {
  taskId: string;
  taskDueDate: string;
  taskEstimatedMinutes: number;
  onClose: () => void;
}

interface EditableSuggestion {
  title: string;
  due_date: string;
  estimated_minutes: number;
  sort_order: number;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function SubtaskSuggestionDialog({
  taskId,
  taskDueDate,
  taskEstimatedMinutes,
  onClose,
}: SubtaskSuggestionDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  const [suggestions, setSuggestions] = useState<EditableSuggestion[]>(() => {
    const raw = generateSubtaskSuggestions(
      new Date(taskDueDate),
      taskEstimatedMinutes,
    );
    return raw.map((s) => ({
      title: s.title,
      due_date: formatDate(s.due_date),
      estimated_minutes: s.estimated_minutes,
      sort_order: s.sort_order,
    }));
  });

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleAccept = () => {
    startTransition(async () => {
      const result = await createSubtasks(
        suggestions.map((s) => ({
          task_id: taskId,
          title: s.title,
          due_date: s.due_date || null,
          estimated_minutes: s.estimated_minutes,
          sort_order: s.sort_order,
        })),
      );
      if (result.success) {
        toast.success(`${result.count} subtasks created`);
        onClose();
      } else {
        toast.error(result.error ?? "Failed to create subtasks");
      }
    });
  };

  const updateSuggestion = (
    index: number,
    field: keyof EditableSuggestion,
    value: string | number,
  ) => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/50"
      onClose={onClose}
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Suggested Subtasks
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          This is a large assignment. Breaking it into subtasks can help you stay
          on track.
        </p>

        <div className="mt-4 space-y-3">
          {suggestions.map((s, i) => (
            <div
              key={s.sort_order}
              className="rounded-lg border border-gray-200 p-3"
            >
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Title
                  </label>
                  <input
                    type="text"
                    value={s.title}
                    onChange={(e) =>
                      updateSuggestion(i, "title", e.target.value)
                    }
                    className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Due date
                    </label>
                    <input
                      type="date"
                      value={s.due_date}
                      onChange={(e) =>
                        updateSuggestion(i, "due_date", e.target.value)
                      }
                      className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={s.estimated_minutes}
                      onChange={(e) =>
                        updateSuggestion(
                          i,
                          "estimated_minutes",
                          Number(e.target.value) || 1,
                        )
                      }
                      className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              onClose();
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Dismiss
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Accept All"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
