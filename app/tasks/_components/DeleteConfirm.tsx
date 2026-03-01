"use client";

import { useRef, useEffect, useTransition } from "react";
import { deleteTask } from "../actions";

interface Task {
  id: string;
  title: string;
}

interface DeleteConfirmProps {
  task: Task;
  onClose: () => void;
}

export default function DeleteConfirm({ task, onClose }: DeleteConfirmProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleConfirm = () => {
    startTransition(async () => {
      await deleteTask(task.id);
      onClose();
    });
  };

  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className="rounded-2xl border border-gray-200 p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="p-6">
        <h3 className="mb-2 text-base font-semibold text-gray-900">
          Delete task?
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-medium text-gray-900">&quot;{task.title}&quot;</span>?
          This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isPending}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete task"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
