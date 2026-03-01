"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ParsedItem } from "@/lib/syllabus/types";
import { confirmSyllabusItems } from "../actions";

// --- Badge color maps (mirrors TaskList.tsx) ---
const TYPE_BADGE_COLORS: Record<ParsedItem["type"], string> = {
  assignment: "bg-blue-100 text-blue-700",
  exam: "bg-red-100 text-red-700",
  reading: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-600",
};

const TYPE_LABELS: Record<ParsedItem["type"], string> = {
  assignment: "Assignment",
  exam: "Exam",
  reading: "Reading",
  other: "Other",
};

const CONFIDENCE_COLORS: Record<ParsedItem["confidence"], string> = {
  high: "text-green-600",
  medium: "text-amber-600",
  low: "text-red-500",
};

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "No date";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMinutes(mins: number | null): string {
  if (!mins) return "—";
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins}m`;
}

// --- Blank item for add form ---
function blankItem(): Omit<ParsedItem, "id"> {
  return {
    title: "",
    type: "assignment",
    dueDate: null,
    estimatedMinutes: null,
    points: null,
    weight: null,
    needsReview: false,
    confidence: "high",
    source: "user-added",
  };
}

interface ItemFormValues {
  title: string;
  type: ParsedItem["type"];
  dueDate: string;
  estimatedMinutes: string;
}

// --- Inline edit / add form ---
function ItemForm({
  initial,
  onSave,
  onCancel,
  saveLabel,
}: {
  initial?: ItemFormValues;
  onSave: (values: ItemFormValues) => void;
  onCancel: () => void;
  saveLabel: string;
}) {
  const [values, setValues] = useState<ItemFormValues>(
    initial ?? { title: "", type: "assignment", dueDate: "", estimatedMinutes: "" }
  );

  function set(field: keyof ItemFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.title.trim()) return;
    onSave(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Assignment title"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Type
          </label>
          <select
            value={values.type}
            onChange={(e) => set("type", e.target.value as ParsedItem["type"])}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="assignment">Assignment</option>
            <option value="exam">Exam</option>
            <option value="reading">Reading</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Due date
          </label>
          <input
            type="date"
            value={values.dueDate}
            onChange={(e) => set("dueDate", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Est. minutes
          </label>
          <input
            type="number"
            min={1}
            max={1440}
            value={values.estimatedMinutes}
            onChange={(e) => set("estimatedMinutes", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="60"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function itemToFormValues(item: ParsedItem): ItemFormValues {
  return {
    title: item.title,
    type: item.type,
    dueDate: item.dueDate ?? "",
    estimatedMinutes: item.estimatedMinutes?.toString() ?? "",
  };
}

function applyFormValues(item: ParsedItem, values: ItemFormValues): ParsedItem {
  return {
    ...item,
    title: values.title.trim(),
    type: values.type,
    dueDate: values.dueDate || null,
    estimatedMinutes: values.estimatedMinutes
      ? parseInt(values.estimatedMinutes, 10)
      : null,
    // If user edits an item they've confirmed the date — clear needsReview
    needsReview: false,
  };
}

// --- Main ReviewScreen component ---
interface ReviewScreenProps {
  courseId: string;
  courseName: string;
}

export default function ReviewScreen({ courseId, courseName }: ReviewScreenProps) {
  const router = useRouter();
  const [items, setItems] = useState<ParsedItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Load from sessionStorage on mount
  useEffect(() => {
    const key = `parsedItems-${courseId}`;
    const raw = sessionStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ParsedItem[];
        // Sort by dueDate ascending, nulls last
        const sorted = [...parsed].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        setItems(sorted);
      } catch {
        // Malformed data — start empty
        setItems([]);
      }
    }
    setLoaded(true);
  }, [courseId]);

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) setEditingId(null);
  }

  function handleEditSave(id: string, values: ItemFormValues) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? applyFormValues(item, values) : item
      )
    );
    setEditingId(null);
  }

  function handleAddSave(values: ItemFormValues) {
    const blank = blankItem();
    const newItem: ParsedItem = {
      ...blank,
      id: crypto.randomUUID(),
      title: values.title.trim(),
      type: values.type,
      dueDate: values.dueDate || null,
      estimatedMinutes: values.estimatedMinutes
        ? parseInt(values.estimatedMinutes, 10)
        : null,
    };
    setItems((prev) => {
      const next = [...prev, newItem];
      // Re-sort after add
      return next.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    });
    setShowAddForm(false);
  }

  async function handleConfirmAll() {
    if (items.length === 0 || isConfirming) return;
    setIsConfirming(true);
    setConfirmError(null);

    const result = await confirmSyllabusItems(courseId, items);

    if (!result.success) {
      setIsConfirming(false);
      setConfirmError(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    // Clear sessionStorage handoff key
    sessionStorage.removeItem(`parsedItems-${courseId}`);
    router.push(`/tasks?course_id=${courseId}`);
  }

  // Loading state before sessionStorage is read
  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900">BlockPlan</h1>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <a href="/tasks" className="hover:text-gray-900 transition-colors">
              Tasks
            </a>
            <a href="/courses" className="hover:text-gray-900 transition-colors">
              Courses
            </a>
            <a href="/settings" className="hover:text-gray-900 transition-colors">
              Settings
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/syllabi/upload" className="hover:text-blue-600 hover:underline">
              Back to Upload
            </Link>
            <span>/</span>
            <span>Review</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Review Syllabus — {courseName}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Confirm, edit, or remove parsed items before saving them as tasks.
            Nothing is saved until you click Confirm.
          </p>
        </div>

        {/* Empty state: sessionStorage was empty or all items deleted */}
        {items.length === 0 && !showAddForm && (
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
              No items to review
            </h3>
            <p className="mb-5 text-sm text-gray-500">
              All items removed. Add items manually or go back to upload a new syllabus.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={() => setShowAddForm(true)}
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
                Add Item Manually
              </button>
              <Link
                href="/syllabi/upload"
                className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Re-upload Syllabus
              </Link>
              <Link
                href="/tasks"
                className="text-sm text-gray-500 hover:text-blue-600 hover:underline"
              >
                Go to Tasks
              </Link>
            </div>
          </div>
        )}

        {/* Item list + controls */}
        {(items.length > 0 || showAddForm) && (
          <>
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {items.length} {items.length === 1 ? "item" : "items"} parsed
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowAddForm((v) => !v);
                    setEditingId(null);
                  }}
                  className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                  Add Item
                </button>
                <button
                  onClick={handleConfirmAll}
                  disabled={items.length === 0 || isConfirming}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    `Confirm ${items.length} ${items.length === 1 ? "item" : "items"}`
                  )}
                </button>
              </div>
            </div>

            {/* Confirm error */}
            {confirmError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {confirmError}
              </div>
            )}

            {/* Add item form */}
            {showAddForm && (
              <div className="mb-4 rounded-xl border border-blue-200 bg-white p-5">
                <h3 className="mb-3 font-semibold text-gray-900">Add New Item</h3>
                <ItemForm
                  onSave={handleAddSave}
                  onCancel={() => setShowAddForm(false)}
                  saveLabel="Add Item"
                />
              </div>
            )}

            {/* Item list */}
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border bg-white p-4 ${
                    item.needsReview
                      ? "border-amber-200"
                      : "border-gray-200"
                  }`}
                >
                  {editingId === item.id ? (
                    /* Edit mode */
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Edit Item</h3>
                      </div>
                      <ItemForm
                        initial={itemToFormValues(item)}
                        onSave={(values) => handleEditSave(item.id, values)}
                        onCancel={() => setEditingId(null)}
                        saveLabel="Save Changes"
                      />
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="flex items-start gap-3">
                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-medium text-gray-900">
                            {item.title}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_COLORS[item.type]}`}
                          >
                            {TYPE_LABELS[item.type]}
                          </span>
                          {item.needsReview && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Needs review
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                          {/* Due date */}
                          <span className={item.dueDate ? "" : "text-gray-400"}>
                            {item.dueDate
                              ? `Due ${formatDueDate(item.dueDate)}`
                              : "No date"}
                          </span>

                          {/* Estimated time */}
                          <span className="text-gray-400">
                            {formatMinutes(item.estimatedMinutes)}
                          </span>

                          {/* Confidence indicator */}
                          <span
                            className={`text-xs font-medium ${CONFIDENCE_COLORS[item.confidence]}`}
                          >
                            {item.confidence} confidence
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setShowAddForm(false);
                          }}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit item"
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
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title="Delete item"
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

            {/* Bottom confirm button for long lists */}
            {items.length > 5 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleConfirmAll}
                  disabled={items.length === 0 || isConfirming}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConfirming
                    ? "Saving..."
                    : `Confirm ${items.length} ${items.length === 1 ? "item" : "items"}`}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
