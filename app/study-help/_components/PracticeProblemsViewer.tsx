"use client";

import { useState } from "react";
import type { PracticeProblem } from "@/lib/study-help/types";

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export default function PracticeProblemsViewer({
  problems,
  onRegenerate,
  isRegenerating,
}: {
  problems: PracticeProblem[];
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}) {
  // Track how many steps are revealed per problem (0 = none)
  const [revealedSteps, setRevealedSteps] = useState<Record<number, number>>({});

  if (problems.length === 0) return null;

  const showNextStep = (idx: number) => {
    setRevealedSteps((prev) => ({
      ...prev,
      [idx]: Math.min((prev[idx] ?? 0) + 1, problems[idx].steps.length),
    }));
  };

  const hideSteps = (idx: number) => {
    setRevealedSteps((prev) => ({ ...prev, [idx]: 0 }));
  };

  return (
    <div className="space-y-4">
      {problems.map((p, i) => {
        const stepsShown = revealedSteps[i] ?? 0;
        const allStepsRevealed = stepsShown >= p.steps.length;

        return (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 text-sm font-medium text-gray-400">
                {i + 1}.
              </span>
              <div className="flex-1">
                {/* Question + difficulty badge */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{p.question}</p>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[p.difficulty] ?? DIFFICULTY_BADGE.medium}`}
                  >
                    {p.difficulty}
                  </span>
                </div>

                {/* Revealed steps */}
                {stepsShown > 0 && (
                  <div className="mt-3 space-y-2">
                    {p.steps.slice(0, stepsShown).map((step, si) => (
                      <div
                        key={si}
                        className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2"
                      >
                        <span className="flex-shrink-0 text-xs font-semibold text-blue-500">
                          Step {si + 1}:
                        </span>
                        <p className="text-sm text-blue-800">{step}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final answer (shown after all steps) */}
                {allStepsRevealed && (
                  <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <p className="text-xs font-medium text-green-700">Final Answer:</p>
                    <p className="mt-1 text-sm text-green-800">{p.finalAnswer}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-3 flex items-center gap-3">
                  {!allStepsRevealed && (
                    <button
                      onClick={() => showNextStep(i)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      {stepsShown === 0
                        ? "Show First Step"
                        : `Show Step ${stepsShown + 1} of ${p.steps.length}`}
                    </button>
                  )}
                  {stepsShown > 0 && (
                    <button
                      onClick={() => hideSteps(i)}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Hide Steps
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Generate new problems button */}
      {onRegenerate && (
        <div className="mt-6 text-center">
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isRegenerating ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              "Generate New Problems"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
