"use client";

import { useActionState, useEffect, useState } from "react";
import AvailabilityGrid from "./AvailabilityGrid";
import { saveAvailabilityRules, type AvailabilityState } from "../actions";
import type { AvailabilityRule } from "@/lib/validations/availability";

type StepAvailabilityProps = {
  initialRules: AvailabilityRule[];
  onNext: () => void;
};

const initialState: AvailabilityState = {};

export default function StepAvailability({
  initialRules,
  onNext,
}: StepAvailabilityProps) {
  const [state, formAction, isPending] = useActionState(
    saveAvailabilityRules,
    initialState
  );
  const [rules, setRules] = useState<AvailabilityRule[]>(initialRules);

  // On successful save, advance to next step
  useEffect(() => {
    if (state.success) {
      onNext();
    }
  }, [state.success, onNext]);

  const rulesJson = JSON.stringify(rules);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Set Your Weekly Availability
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Paint your typical weekly schedule so BlockPlan can find ideal study
          windows. Use <strong>Available</strong> for open study time,{" "}
          <strong>Blocked</strong> for commitments (work, church, class), and{" "}
          <strong>Preferred</strong> for your ideal study times.
        </p>
      </div>

      {/* Availability grid */}
      <AvailabilityGrid initialRules={initialRules} onChange={setRules} />

      {/* Server-side errors */}
      {state.error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      {/* Save form — hidden input carries the JSON rules */}
      <form action={formAction} className="mt-6">
        <input type="hidden" name="rules" value={rulesJson} />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className={[
              "rounded-md px-6 py-2.5 text-sm font-semibold text-white shadow-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "transition-colors",
              isPending
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700",
            ].join(" ")}
          >
            {isPending ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
