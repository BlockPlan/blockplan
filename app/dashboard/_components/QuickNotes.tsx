"use client";

import { useState, useTransition } from "react";
import { addQuickNote, deleteQuickNote } from "../actions";

interface QuickNote {
  id: string;
  content: string;
  created_at: string;
}

interface QuickNotesProps {
  initialNotes: QuickNote[];
}

export default function QuickNotes({ initialNotes }: QuickNotesProps) {
  const [notes, setNotes] = useState<QuickNote[]>(initialNotes);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    const content = input.trim();
    if (!content) return;

    // Optimistic update
    const tempNote: QuickNote = {
      id: `temp-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [tempNote, ...prev]);
    setInput("");

    startTransition(async () => {
      const result = await addQuickNote(content);
      if (result.error) {
        // Revert on error
        setNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
      }
    });
  }

  function handleDelete(noteId: string) {
    // Optimistic update
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    startTransition(async () => {
      const result = await deleteQuickNote(noteId);
      if (result.error) {
        // Revert — re-fetch would be better but this is simpler
        setNotes(initialNotes);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  }

  function formatTime(isoStr: string): string {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoStr));
  }

  return (
    <div data-tour="quick-notes" className="mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Quick Notes
      </p>

      {/* Input */}
      <div className="mb-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Jot down a note..."
          maxLength={500}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim() || isPending}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-400">No notes yet. Add one above!</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {note.content}
                </p>
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatTime(note.created_at)}
                </p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                className="flex-shrink-0 rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
                aria-label="Delete note"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
