"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createCourse,
  updateCourse,
  type CourseActionState,
} from "../actions";

type MeetingTimeInput = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type Course = {
  id: string;
  name: string;
  meeting_times: unknown;
};

type CourseFormProps = {
  course?: Course;
  onSuccess?: () => void;
  onCancel?: () => void;
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

const initialState: CourseActionState = {};

export default function CourseForm({
  course,
  onSuccess,
  onCancel,
}: CourseFormProps) {
  const isEdit = !!course;
  const action = isEdit ? updateCourse : createCourse;

  const [state, formAction, isPending] = useActionState(action, initialState);

  // Pre-fill meeting times from existing course
  const parsedMeetingTimes: MeetingTimeInput[] = Array.isArray(
    course?.meeting_times
  )
    ? (course.meeting_times as MeetingTimeInput[])
    : [];

  const [meetingTimes, setMeetingTimes] =
    useState<MeetingTimeInput[]>(parsedMeetingTimes);
  const [showMeetingTimes, setShowMeetingTimes] = useState(
    parsedMeetingTimes.length > 0
  );

  useEffect(() => {
    if (state.success && onSuccess) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

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

  const meetingTimesJson =
    meetingTimes.length > 0 ? JSON.stringify(meetingTimes) : "";

  return (
    <form
      action={formAction}
      key={state.success ? `success-${Date.now()}` : isEdit ? `edit-${course?.id}` : "create"}
      className="space-y-4"
    >
      {/* Hidden course id for edit */}
      {isEdit && <input type="hidden" name="id" value={course.id} />}

      {/* Hidden meeting times */}
      {meetingTimesJson && (
        <input type="hidden" name="meeting_times" value={meetingTimesJson} />
      )}

      {/* General error */}
      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Course name */}
      <div>
        <label
          htmlFor={isEdit ? `course-name-${course?.id}` : "course-name-new"}
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Course name <span className="text-red-500">*</span>
        </label>
        <input
          id={isEdit ? `course-name-${course?.id}` : "course-name-new"}
          name="name"
          type="text"
          required
          defaultValue={course?.name ?? ""}
          placeholder="e.g., Calculus II, World History"
          className={[
            "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            state.errors?.name
              ? "border-red-300 bg-red-50 text-red-900"
              : "border-gray-200 text-gray-900 placeholder-gray-400",
          ].join(" ")}
        />
        {state.errors?.name && (
          <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
        )}
      </div>

      {/* Meeting times */}
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
            <p className="text-sm font-medium text-gray-700">Meeting times</p>
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
            <div key={index} className="flex items-center gap-2 flex-wrap">
              <select
                value={slot.day_of_week}
                onChange={(e) =>
                  updateMeetingTime(index, "day_of_week", Number(e.target.value))
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

      {/* Form actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:opacity-50"
        >
          {isPending
            ? isEdit
              ? "Saving..."
              : "Adding..."
            : isEdit
              ? "Save changes"
              : "Add course"}
        </button>
      </div>
    </form>
  );
}
