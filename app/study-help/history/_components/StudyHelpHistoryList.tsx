"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { deleteStudyHelpSession, updateStudyHelpSession } from "../../actions";

interface Session {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  created_at: string;
}

export default function StudyHelpHistoryList({
  sessions,
}: {
  sessions: Session[];
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isPending, startTransition] = useTransition();
  const [localSessions, setLocalSessions] = useState(sessions);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [editingId]);

  const startEditing = (session: Session) => {
    setEditingId(session.id);
    setEditTitle(session.title);
    setEditDescription(session.description ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const saveEditing = () => {
    if (!editingId || !editTitle.trim()) return;
    const id = editingId;
    const title = editTitle.trim();
    const description = editDescription.trim();
    startTransition(async () => {
      await updateStudyHelpSession(id, { title, description });
      setLocalSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, title, description: description || null } : s
        )
      );
      setEditingId(null);
    });
  };

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
            className="rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:bg-gray-50"
          >
            {editingId === session.id ? (
              /* Edit mode */
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Title
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditing();
                      if (e.key === "Escape") cancelEditing();
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Notes
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") cancelEditing();
                    }}
                    rows={2}
                    placeholder="Add a note about this session..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelEditing}
                    disabled={isPending}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEditing}
                    disabled={isPending || !editTitle.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="flex items-center justify-between">
                <Link
                  href={`/study-help/${session.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="truncate font-medium text-gray-900">
                    {session.title}
                  </p>
                  {session.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">
                      {session.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(session.created_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </Link>
                <div className="ml-4 flex flex-shrink-0 gap-2">
                  {/* Edit button */}
                  <button
                    onClick={() => startEditing(session)}
                    className="text-gray-400 hover:text-blue-500"
                    title="Edit"
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
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => setDeletingId(session.id)}
                    className="text-gray-400 hover:text-red-500"
                    title="Delete"
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
              </div>
            )}
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
