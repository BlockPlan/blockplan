"use client";

import { useActionState, useEffect } from "react";
import { createTerm, type TermState } from "../actions";

type StepTermProps = {
  onSuccess: (termId: string) => void;
};

const initialState: TermState = {};

export default function StepTerm({ onSuccess }: StepTermProps) {
  const [state, formAction, isPending] = useActionState(createTerm, initialState);

  useEffect(() => {
    if (state.success && state.termId) {
      onSuccess(state.termId);
    }
  }, [state.success, state.termId, onSuccess]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Create Your Term</h2>
        <p className="mt-1 text-sm text-gray-500">
          Set up the academic term you want to plan. You can only have one active
          term at a time.
        </p>
      </div>

      {state.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      <form action={formAction} className="space-y-5">
        {/* Term Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Term name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g., Winter 2026, Spring Semester"
            className={[
              "mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              state.errors?.name
                ? "border-red-300 bg-red-50 text-red-900 placeholder-red-300"
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-400",
            ].join(" ")}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
          />
          {state.errors?.name && (
            <p id="name-error" className="mt-1 text-xs text-red-600">
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-gray-700"
          >
            Start date <span className="text-red-500">*</span>
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            required
            className={[
              "mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              state.errors?.start_date
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-gray-300 bg-white text-gray-900",
            ].join(" ")}
            aria-describedby={state.errors?.start_date ? "start-date-error" : undefined}
          />
          {state.errors?.start_date && (
            <p id="start-date-error" className="mt-1 text-xs text-red-600">
              {state.errors.start_date[0]}
            </p>
          )}
        </div>

        {/* End Date */}
        <div>
          <label
            htmlFor="end_date"
            className="block text-sm font-medium text-gray-700"
          >
            End date <span className="text-red-500">*</span>
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            required
            className={[
              "mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              state.errors?.end_date
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-gray-300 bg-white text-gray-900",
            ].join(" ")}
            aria-describedby={state.errors?.end_date ? "end-date-error" : undefined}
          />
          {state.errors?.end_date && (
            <p id="end-date-error" className="mt-1 text-xs text-red-600">
              {state.errors.end_date[0]}
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className={[
              "w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "transition-colors",
              isPending
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700",
            ].join(" ")}
          >
            {isPending ? "Saving..." : "Create Term"}
          </button>
        </div>
      </form>
    </div>
  );
}
