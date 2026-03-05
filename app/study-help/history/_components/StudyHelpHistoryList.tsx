"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteStudyHelpSession } from "../../actions";

interface Session {
  id: string;
  title: string;
  course_id: string | null;
  created_at: string;
}

export default function StudyHelpHistoryList({
  sessions,
}: {
  sessions: Session[];
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localSessions, setLocalSessions] = useState(sessions);

  const confirmDelete = () => {
    if (!deletingId) return;
    const idToDelete = deletingId;
    startTransition(async () => {
      await deleteStudyHelpSession(idToDelete);
      setLocalSessions((prev) => prev.filter((s) => s.id !== idToDelete));
      setDeletingId(null);
    });
  };

  if (localSessions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">
          No saved study sessions yet. Generate your first one!
        </p>
        <Link
          href="/study-help"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          Create a study session
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {localSessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:bg-gray-50"
          >
            <Link href={`/study-help/${session.id}`} className="min-w-0 flex-1">
              <p className="truncate font-medium text-gray-900">
                {session.title}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {new Date(session.created_at).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </Link>
            <button
              onClick={() => setDeletingId(session.id)}
              className="ml-4 flex-shrink-0 text-sm text-gray-400 hover:text-red-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Delete session?
            </h3>
            <p className="mb-6 text-sm text-gray-600">
              This will permanently remove this study session.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isPending}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
