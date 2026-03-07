"use client";

import { useState } from "react";
import type { PracticeTestQuestion } from "@/lib/study-help/types";

const TYPE_BADGE: Record<string, string> = {
  recall: "bg-purple-100 text-purple-700",
  conceptual: "bg-teal-100 text-teal-700",
  application: "bg-amber-100 text-amber-700",
};

export default function PracticeTestViewer({
  questions,
  onRegenerate,
  isRegenerating,
}: {
  questions: PracticeTestQuestion[];
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  if (questions.length === 0) return null;

  const toggleReveal = (idx: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 text-sm font-medium text-gray-400">
              {i + 1}.
            </span>
            <div className="flex-1">
              <p className="text-sm text-gray-900">{q.question}</p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[q.type] ?? TYPE_BADGE.recall}`}
              >
                {q.type}
              </span>

              {/* Answer textarea for student */}
              <textarea
                rows={3}
                placeholder="Write your answer here..."
                className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              {/* Reveal button */}
              <button
                onClick={() => toggleReveal(i)}
                className="mt-2 inline-block rounded-lg py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {revealed.has(i) ? "Hide Suggested Answer" : "Show Suggested Answer"}
              </button>

              {/* Suggested answer */}
              {revealed.has(i) && (
                <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                  <p className="text-xs font-medium text-green-700">
                    Suggested Answer:
                  </p>
                  <p className="mt-1 text-sm text-green-800">
                    {q.suggestedAnswer}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Generate new test button */}
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
              "Generate New Practice Test"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
