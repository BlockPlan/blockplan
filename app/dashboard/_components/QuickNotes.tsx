"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import {
  addQuickNote,
  deleteQuickNote,
  updateQuickNote,
  toggleQuickNoteComplete,
} from "../actions";

interface QuickNote {
  id: string;
  content: string;
  completed: boolean;
  created_at: string;
}

interface QuickNotesProps {
  initialNotes: QuickNote[];
}

export default function QuickNotes({ initialNotes }: QuickNotesProps) {
  const [notes, setNotes] = useState<QuickNote[]>(initialNotes);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const editRef = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<NodeJS.Timeout | null>(null);

  // Focus the edit input when editing starts (slight delay to avoid onBlur race)
  useEffect(() => {
    if (editingId) {
      const t = setTimeout(() => {
        editRef.current?.focus();
        editRef.current?.select();
      }, 10);
      return () => clearTimeout(t);
    }
  }, [editingId]);

  // ── Add ──────────────────────────────────────────────────────────────
  function handleAdd() {
    const content = input.trim();
    if (!content) return;

    const tempNote: QuickNote = {
      id: `temp-${Date.now()}`,
      content,
      completed: false,
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [tempNote, ...prev]);
    setInput("");

    startTransition(async () => {
      const result = await addQuickNote(content);
      if (result.error) {
        setNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
      }
    });
  }

  // ── Delete ───────────────────────────────────────────────────────────
  function handleDelete(noteId: string) {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    startTransition(async () => {
      const result = await deleteQuickNote(noteId);
      if (result.error) {
        setNotes(initialNotes);
      }
    });
  }

  // ── Toggle complete ──────────────────────────────────────────────────
  function handleToggle(noteId: string) {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, completed: !n.completed } : n
      )
    );

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    startTransition(async () => {
      const result = await toggleQuickNoteComplete(noteId, !note.completed);
      if (result.error) {
        setNotes(initialNotes);
      }
    });
  }

  // ── Edit ─────────────────────────────────────────────────────────────
  function startEdit(note: QuickNote) {
    setEditingId(note.id);
    setEditValue(note.content);
  }

  function cancelEdit() {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setEditingId(null);
    setEditValue("");
  }

  function saveEdit(noteId: string) {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    const content = editValue.trim();
    if (!content) {
      cancelEdit();
      return;
    }

    // Optimistic
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, content } : n))
    );
    setEditingId(null);
    setEditValue("");

    startTransition(async () => {
      const result = await updateQuickNote(noteId, content);
      if (result.error) {
        setNotes(initialNotes);
      }
    });
  }

  function handleEditKeyDown(e: React.KeyboardEvent, noteId: string) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (blurTimeout.current) clearTimeout(blurTimeout.current);
      saveEdit(noteId);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────
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
    <div
      data-tour="quick-notes"
      className="mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)]"
    >
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
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2"
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(note.id)}
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                  note.completed
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 bg-white hover:border-blue-400"
                }`}
                aria-label={note.completed ? "Mark incomplete" : "Mark complete"}
              >
                {note.completed && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3 w-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {editingId === note.id ? (
                  <input
                    ref={editRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, note.id)}
                    onBlur={() => {
                      blurTimeout.current = setTimeout(() => saveEdit(note.id), 150);
                    }}
                    maxLength={500}
                    className="w-full rounded border border-blue-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                ) : (
                  <p
                    className={`whitespace-pre-wrap break-words text-sm ${
                      note.completed
                        ? "text-gray-400 line-through"
                        : "text-gray-700"
                    }`}
                    onDoubleClick={() => startEdit(note)}
                  >
                    {note.content}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-gray-400">
                  {formatTime(note.created_at)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-shrink-0 items-center gap-1">
                <button
                  onClick={() => startEdit(note)}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="rounded px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
