"use client";

import { useRef, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { deleteRecurringTask } from "../actions";

interface RecurrenceDeleteDialogProps {
  taskId: string;
  taskTitle: string;
  onClose: () => void;
}

export default function RecurrenceDeleteDialog({
  taskId,
  taskTitle,
  onClose,
}: RecurrenceDeleteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const handleClose = () => onClose();
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleDelete = (scope: "this" | "future" | "all") => {
    startTransition(async () => {
      const result = await deleteRecurringTask(taskId, scope);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          scope === "this"
            ? "Task deleted"
            : scope === "future"
              ? "This and future tasks deleted"
              : "All recurring tasks deleted"
        );
        dialogRef.current?.close();
      }
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-0 shadow-[var(--shadow-dialog)] ring-1 ring-gray-900/5 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900">Delete Recurring Task</h3>
        <p className="mt-1 text-sm text-gray-500">
          &ldquo;{taskTitle}&rdquo; is part of a recurring series.
        </p>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={() => handleDelete("this")}
            disabled={isPending}
            className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="text-lg">1</span>
            <div>
              <p>This task only</p>
              <p className="text-xs font-normal text-gray-400">Other instances stay</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleDelete("future")}
            disabled={isPending}
            className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="text-lg">&#8811;</span>
            <div>
              <p>This and future tasks</p>
              <p className="text-xs font-normal text-gray-400">Keep past instances</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleDelete("all")}
            disabled={isPending}
            className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
          >
            <span className="text-lg">&#8734;</span>
            <div>
              <p>All tasks in series</p>
              <p className="text-xs font-normal text-red-400">Delete everything</p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </dialog>
  );
}
