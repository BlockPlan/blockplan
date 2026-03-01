"use client";

import { useState, useTransition } from "react";
import CourseForm from "./CourseForm";
import { deleteCourse } from "../actions";

type MeetingTime = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type Course = {
  id: string;
  name: string;
  meeting_times: unknown;
};

type CourseListProps = {
  courses: Course[];
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function CourseList({ courses }: CourseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (courses.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <p className="text-sm text-gray-500">
          No courses yet. Add your first course below.
        </p>
      </div>
    );
  }

  function handleDeleteClick(courseId: string) {
    setConfirmDeleteId(courseId);
    setDeleteError(null);
  }

  function handleDeleteCancel() {
    setConfirmDeleteId(null);
    setDeleteError(null);
  }

  function handleDeleteConfirm(courseId: string) {
    startTransition(async () => {
      const result = await deleteCourse(courseId);
      if (result.error) {
        setDeleteError(result.error);
      } else {
        setConfirmDeleteId(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => {
        const times = Array.isArray(course.meeting_times)
          ? (course.meeting_times as MeetingTime[])
          : [];
        const isEditing = editingId === course.id;
        const isConfirmingDelete = confirmDeleteId === course.id;

        return (
          <div
            key={course.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Course card header */}
            {!isEditing && !isConfirmingDelete && (
              <div className="flex items-start justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {course.name}
                  </p>
                  {times.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {times
                        .map(
                          (t) =>
                            `${DAY_NAMES[t.day_of_week]} ${t.start_time}–${t.end_time}`
                        )
                        .join(" · ")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <button
                    type="button"
                    onClick={() => setEditingId(course.id)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(course.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Inline edit form */}
            {isEditing && (
              <div className="px-5 py-4">
                <p className="mb-3 text-sm font-semibold text-gray-700">
                  Edit course
                </p>
                <CourseForm
                  course={course}
                  onSuccess={() => setEditingId(null)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            )}

            {/* Delete confirmation */}
            {isConfirmingDelete && (
              <div className="px-5 py-4 bg-red-50 border-t border-red-100">
                <p className="text-sm font-semibold text-red-800 mb-1">
                  Delete &ldquo;{course.name}&rdquo;?
                </p>
                <p className="text-xs text-red-600 mb-3">
                  This will permanently delete the course and all its associated
                  tasks. This action cannot be undone.
                </p>
                {deleteError && (
                  <p className="mb-2 text-xs text-red-700">{deleteError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteConfirm(course.id)}
                    className="rounded-md bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Yes, delete
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
