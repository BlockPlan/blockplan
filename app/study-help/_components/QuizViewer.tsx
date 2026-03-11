"use client";

import { useState } from "react";
import type { MultipleChoice } from "@/lib/study-help/types";

export default function QuizViewer({
  questions,
  onRegenerate,
  isRegenerating,
}: {
  questions: MultipleChoice[];
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}) {
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showScore, setShowScore] = useState(false);

  if (questions.length === 0) return null;

  const handleSelect = (questionIdx: number, optionIdx: number) => {
    if (revealed.has(questionIdx)) return; // Already answered
    setAnswers((prev) => new Map(prev).set(questionIdx, optionIdx));
  };

  const handleCheck = (questionIdx: number) => {
    setRevealed((prev) => new Set(prev).add(questionIdx));
  };

  const handleShowScore = () => setShowScore(true);

  const correctCount = questions.filter(
    (q, i) => revealed.has(i) && answers.get(i) === q.correctIndex
  ).length;

  const allAnswered = revealed.size === questions.length;

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const selected = answers.get(qi);
        const isRevealed = revealed.has(qi);
        const isCorrect = isRevealed && selected === q.correctIndex;

        return (
          <div key={qi} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="mb-3 text-sm font-medium text-gray-900">
              <span className="mr-2 text-gray-400">{qi + 1}.</span>
              {q.question}
            </p>

            <div className="space-y-2">
              {q.options.map((option, oi) => {
                let optionClass = "border-gray-200 bg-white hover:bg-gray-50";
                if (isRevealed) {
                  if (oi === q.correctIndex) {
                    optionClass = "border-green-300 bg-green-50";
                  } else if (oi === selected && oi !== q.correctIndex) {
                    optionClass = "border-red-300 bg-red-50";
                  } else {
                    optionClass = "border-gray-200 bg-gray-50 opacity-60";
                  }
                } else if (oi === selected) {
                  optionClass = "border-blue-300 bg-blue-50";
                }

                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => handleSelect(qi, oi)}
                    disabled={isRevealed}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${optionClass}`}
                  >
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-medium text-gray-500">
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="text-gray-700">{option}</span>
                    {isRevealed && oi === q.correctIndex && (
                      <span className="ml-auto text-green-600">✓</span>
                    )}
                    {isRevealed && oi === selected && oi !== q.correctIndex && (
                      <span className="ml-auto text-red-500">✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Check answer button */}
            {selected !== undefined && !isRevealed && (
              <button
                onClick={() => handleCheck(qi)}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Check Answer
              </button>
            )}

            {/* Explanation */}
            {isRevealed && (
              <div
                className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                  isCorrect
                    ? "border border-green-200 bg-green-50 text-green-800"
                    : "border border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <p className="font-medium">{isCorrect ? "Correct!" : "Incorrect"}</p>
                <p className="mt-1 text-xs opacity-80 sm:text-sm">{q.explanation}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Score summary */}
      {allAnswered && !showScore && (
        <button
          onClick={handleShowScore}
          className="mx-auto block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Show Final Score
        </button>
      )}

      {showScore && (
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4 text-center sm:p-6">
          <p className="text-3xl font-bold text-blue-700">
            {correctCount} / {questions.length}
          </p>
          <p className="mt-1 text-sm text-blue-600">
            {correctCount === questions.length
              ? "Perfect score! 🎉"
              : correctCount >= questions.length * 0.7
                ? "Great job! Keep reviewing the ones you missed."
                : "Keep studying — you'll get there!"}
          </p>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
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
                "Generate New Quiz"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
