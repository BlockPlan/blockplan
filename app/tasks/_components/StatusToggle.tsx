"use client";

import { useOptimistic, useTransition } from "react";
import { updateTaskStatus } from "../actions";

type Status = "todo" | "doing" | "done";

interface StatusToggleProps {
  taskId: string;
  currentStatus: Status;
}

const STATUS_CYCLE: Record<Status, Status> = {
  todo: "doing",
  doing: "done",
  done: "todo",
};

const STATUS_STYLES: Record<Status, string> = {
  todo: "bg-gray-100 text-gray-500 hover:bg-gray-200",
  doing: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  done: "bg-green-100 text-green-700 hover:bg-green-200",
};

const STATUS_LABELS: Record<Status, string> = {
  todo: "To do",
  doing: "In progress",
  done: "Done",
};

export default function StatusToggle({ taskId, currentStatus }: StatusToggleProps) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const nextStatus = STATUS_CYCLE[optimisticStatus];
    startTransition(async () => {
      setOptimisticStatus(nextStatus);
      await updateTaskStatus(taskId, nextStatus);
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      title={`Status: ${STATUS_LABELS[optimisticStatus]} — click to advance`}
      className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-sm transition-all duration-150 disabled:opacity-60 ${STATUS_STYLES[optimisticStatus]}`}
    >
      {STATUS_LABELS[optimisticStatus]}
    </button>
  );
}
