"use client";

import { useState, useActionState } from "react";
import {
  savePlannerSettings,
  type PlannerSettingsActionState,
} from "../actions";
import type { PlannerSettings } from "@/lib/validations/planner";

type PlannerSettingsProps = {
  initialSettings: PlannerSettings;
};

const initialState: PlannerSettingsActionState = {};

export default function PlannerSettingsForm({
  initialSettings,
}: PlannerSettingsProps) {
  const [backwardPlanning, setBackwardPlanning] = useState(
    initialSettings.backward_planning ?? false
  );
  const [state, formAction, isPending] = useActionState(
    savePlannerSettings,
    initialState
  );

  return (
    <form action={formAction} className="space-y-6">
      {/* General error */}
      {state.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Success message */}
      {state.success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Planning preferences saved.
        </div>
      )}

      {/* Max Block Length */}
      <div>
        <label
          htmlFor="max_block_minutes"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Max Block Length
        </label>
        <div className="flex items-center gap-2">
          <input
            id="max_block_minutes"
            name="max_block_minutes"
            type="number"
            min={25}
            max={120}
            step={5}
            defaultValue={initialSettings.max_block_minutes}
            className={[
              "w-28 rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm",
              state.errors?.max_block_minutes
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-gray-200 text-gray-900",
            ].join(" ")}
          />
          <span className="text-sm text-gray-500">minutes</span>
        </div>
        {state.errors?.max_block_minutes && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.max_block_minutes[0]}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">Range: 25–120 minutes</p>
      </div>

      {/* Min Block Length */}
      <div>
        <label
          htmlFor="min_block_minutes"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Min Block Length
        </label>
        <div className="flex items-center gap-2">
          <input
            id="min_block_minutes"
            name="min_block_minutes"
            type="number"
            min={15}
            max={60}
            step={5}
            defaultValue={initialSettings.min_block_minutes}
            className={[
              "w-28 rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm",
              state.errors?.min_block_minutes
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-gray-200 text-gray-900",
            ].join(" ")}
          />
          <span className="text-sm text-gray-500">minutes</span>
        </div>
        {state.errors?.min_block_minutes && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.min_block_minutes[0]}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">Range: 15–60 minutes</p>
      </div>

      {/* Buffer Time */}
      <div>
        <label
          htmlFor="buffer_minutes"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Buffer Time Between Blocks
        </label>
        <div className="flex items-center gap-2">
          <input
            id="buffer_minutes"
            name="buffer_minutes"
            type="number"
            min={0}
            max={30}
            step={5}
            defaultValue={initialSettings.buffer_minutes}
            className={[
              "w-28 rounded-lg border px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm",
              state.errors?.buffer_minutes
                ? "border-red-300 bg-red-50 text-red-900"
                : "border-gray-200 text-gray-900",
            ].join(" ")}
          />
          <span className="text-sm text-gray-500">minutes</span>
        </div>
        {state.errors?.buffer_minutes && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.buffer_minutes[0]}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">Range: 0–30 minutes</p>
      </div>

      {/* Backward Planning Toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-700">Backward Planning</p>
          <p className="mt-0.5 text-xs text-gray-400">
            Spread work evenly across days leading up to due dates
          </p>
        </div>
        <input type="hidden" name="backward_planning" value={backwardPlanning ? "true" : "false"} />
        <button
          type="button"
          role="switch"
          aria-checked={backwardPlanning}
          onClick={() => setBackwardPlanning((v) => !v)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            backwardPlanning ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              backwardPlanning ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save preferences"}
        </button>
      </div>
    </form>
  );
}
