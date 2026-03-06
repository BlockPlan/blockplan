"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TASK_TYPES as SHARED_TYPES, TASK_STATUSES as SHARED_STATUSES } from "@/lib/constants/tasks";

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

const TASK_TYPES = [{ value: "", label: "All types" }, ...SHARED_TYPES];
const TASK_STATUSES = [{ value: "", label: "All statuses" }, ...SHARED_STATUSES.map(s => ({ value: s.value, label: s.label }))];

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
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
        {/* Course filter */}
        <div className="w-full sm:min-w-[160px] sm:flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Course
          </label>
          <select
            value={currentCourse ?? ""}
            onChange={(e) => updateParam("course", e.target.value)}
            className="input cursor-pointer"
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
            className="input cursor-pointer"
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
            className="input cursor-pointer"
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
            className="input cursor-pointer"
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
            className="btn-secondary"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
