"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addCourse, deleteCourse, type CourseState } from "../actions";

type Course = {
  id: string;
  name: string;
  meeting_times: unknown;
};

type MeetingTimeInput = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type StepCoursesProps = {
  termId: string;
  existingCourses: Course[];
  onNext: () => void;
  onCourseAdded: (course: Course) => void;
  onCourseDeleted: (courseId: string) => void;
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

const initialState: CourseState = {};

export default function StepCourses({
  termId,
  existingCourses,
  onNext,
  onCourseAdded,
  onCourseDeleted,
}: StepCoursesProps) {
  const [state, formAction, isPending] = useActionState(addCourse, initialState);
  const [meetingTimes, setMeetingTimes] = useState<MeetingTimeInput[]>([]);
  const [showMeetingTimes, setShowMeetingTimes] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const lastProcessedCourseId = useRef<string | null>(null);

  // Reset form on successful course add
  useEffect(() => {
    const course = state.course as Course | undefined;
    if (state.success && course && course.id !== lastProcessedCourseId.current) {
      lastProcessedCourseId.current = course.id;
      onCourseAdded(course);
      setMeetingTimes([]);
      setShowMeetingTimes(false);
    }
  }, [state.success, state.course, onCourseAdded]);

  function addMeetingTimeSlot() {
    setMeetingTimes((prev) => [
      ...prev,
      { day_of_week: 1, start_time: "09:00", end_time: "10:00" },
    ]);
  }

  function removeMeetingTimeSlot(index: number) {
    setMeetingTimes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateMeetingTime(
    index: number,
    field: keyof MeetingTimeInput,
    value: string | number
  ) {
    setMeetingTimes((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    );
  }

  function handleDelete(courseId: string) {
    setDeletingId(courseId);
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCourse(courseId);
      if (result.error) {
        setDeleteError(result.error);
        setDeletingId(null);
      } else {
        onCourseDeleted(courseId);
        setDeletingId(null);
      }
    });
  }

  // Build hidden field value for meeting times
  const meetingTimesJson =
    meetingTimes.length > 0 ? JSON.stringify(meetingTimes) : "";

  const canAdvance = existingCourses.length > 0;

  // Key to reset form inputs after successful submit
  const formKey = state.success ? String(Date.now()) : "course-form";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Add Your Courses</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add at least one course for this term. You can add meeting times
          optionally — they help with scheduling in future phases.
        </p>
      </div>

      {/* Already-added courses list */}
      {existingCourses.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Added courses ({existingCourses.length})
          </h3>
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 bg-gray-50">
            {existingCourses.map((course) => {
              const times = Array.isArray(course.meeting_times)
                ? (course.meeting_times as MeetingTimeInput[])
                : [];
              return (
                <li
                  key={course.id}
                  className="flex items-start justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {course.name}
                    </p>
                    {times.length > 0 && (
                      <p className="mt-0.5 text-xs text-gray-500">
                        {times
                          .map(
                            (t) =>
                              `${DAY_NAMES[t.day_of_week]} ${t.start_time}–${t.end_time}`
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(course.id)}
                    disabled={deletingId === course.id}
                    className="ml-4 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Delete ${course.name}`}
                  >
                    {deletingId === course.id ? "Deleting..." : "Delete"}
                  </button>
                </li>
              );
            })}
          </ul>
          {deleteError && (
            <p className="mt-1 text-xs text-red-600">{deleteError}</p>
          )}
        </div>
      )}

      {/* Add course form */}
      <div className="rounded-md border border-gray-200 bg-white p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Add a course
        </h3>

        {state.error && (
          <div className="mb-3 rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        )}

        <form key={formKey} action={formAction} className="space-y-4">
          {/* Hidden fields */}
          <input type="hidden" name="term_id" value={termId} />
          {meetingTimesJson && (
            <input
              type="hidden"
              name="meeting_times"
              value={meetingTimesJson}
            />
          )}

          {/* Course name */}
          <div>
            <label
              htmlFor="course-name"
              className="block text-sm font-medium text-gray-700"
            >
              Course name <span className="text-red-500">*</span>
            </label>
            <input
              id="course-name"
              name="name"
              type="text"
              required
              placeholder="e.g., Calculus II, World History"
              className={[
                "mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                state.errors?.name
                  ? "border-red-300 bg-red-50 text-red-900 placeholder-red-300"
                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-400",
              ].join(" ")}
            />
            {state.errors?.name && (
              <p className="mt-1 text-xs text-red-600">
                {state.errors.name[0]}
              </p>
            )}
          </div>

          {/* Meeting times toggle */}
          {!showMeetingTimes ? (
            <button
              type="button"
              onClick={() => {
                setShowMeetingTimes(true);
                if (meetingTimes.length === 0) addMeetingTimeSlot();
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add meeting times (optional)
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Meeting times
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowMeetingTimes(false);
                    setMeetingTimes([]);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Remove all
                </button>
              </div>

              {meetingTimes.map((slot, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 flex-wrap"
                >
                  <select
                    value={slot.day_of_week}
                    onChange={(e) =>
                      updateMeetingTime(
                        index,
                        "day_of_week",
                        Number(e.target.value)
                      )
                    }
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DAY_NAMES.map((day, i) => (
                      <option key={i} value={i}>
                        {day}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={slot.start_time}
                    onChange={(e) =>
                      updateMeetingTime(index, "start_time", e.target.value)
                    }
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={slot.end_time}
                    onChange={(e) =>
                      updateMeetingTime(index, "end_time", e.target.value)
                    }
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeMeetingTimeSlot(index)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addMeetingTimeSlot}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add another time slot
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className={[
              "rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "transition-colors",
              isPending
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700",
            ].join(" ")}
          >
            {isPending ? "Adding..." : "Add Course"}
          </button>
        </form>
      </div>

      {/* Next step button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvance}
          className={[
            "rounded-md px-6 py-2.5 text-sm font-semibold shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "transition-colors",
            canAdvance
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-400 cursor-not-allowed",
          ].join(" ")}
          title={
            !canAdvance ? "Add at least one course to continue" : undefined
          }
        >
          Continue to Availability
        </button>
      </div>
    </div>
  );
}
