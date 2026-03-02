"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface Course {
  id: string;
  name: string;
}

interface TaskFiltersProps {
  courses: Course[];
  currentCourse?: string;
  currentType?: string;
  currentStatus?: string;
  currentSort?: string;
}

const TASK_TYPES = [
  { value: "", label: "All types" },
  { value: "assignment", label: "Assignment" },
  { value: "exam", label: "Exam" },
  { value: "reading", label: "Reading" },
  { value: "other", label: "Other" },
];

const TASK_STATUSES = [
  { value: "", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "doing", label: "In progress" },
  { value: "done", label: "Done" },
];

const SORT_OPTIONS = [
  { value: "due_date", label: "Due date" },
  { value: "course", label: "Course" },
  { value: "status", label: "Status" },
  { value: "created", label: "Recently added" },
];

export default function TaskFilters({
  courses,
  currentCourse,
  currentType,
  currentStatus,
  currentSort,
}: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`/tasks?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.replace("/tasks");
  }, [router]);

  const hasActiveFilters = currentCourse || currentType || currentStatus;

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        {/* Course filter */}
        <div className="w-full sm:min-w-[160px] sm:flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Course
          </label>
          <select
            value={currentCourse ?? ""}
            onChange={(e) => updateParam("course", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type filter */}
        <div className="w-full sm:min-w-[140px] sm:flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Type
          </label>
          <select
            value={currentType ?? ""}
            onChange={(e) => updateParam("type", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm"
          >
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="w-full sm:min-w-[140px] sm:flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Status
          </label>
          <select
            value={currentStatus ?? ""}
            onChange={(e) => updateParam("status", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm"
          >
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="w-full sm:min-w-[160px] sm:flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Sort by
          </label>
          <select
            value={currentSort ?? "due_date"}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none sm:text-sm"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
