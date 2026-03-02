"use client";

import { useActionState } from "react";
import Link from "next/link";
import { generateStudyAidsAction, type StudyState } from "../actions";

interface StudySessionProps {
  taskId: string;
  taskTitle: string;
}

export default function StudySession({ taskId, taskTitle }: StudySessionProps) {
  const [state, formAction, isPending] = useActionState<StudyState, FormData>(
    generateStudyAidsAction,
    {}
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tasks"
          className="mb-2 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <svg
            className="mr-1 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Tasks
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Study Session</h1>
        <p className="mt-1 text-sm text-gray-500">{taskTitle}</p>
      </div>

      {/* Input form */}
      <form action={formAction}>
        <input type="hidden" name="taskId" value={taskId} />

        <div className="mb-4">
          <label
            htmlFor="notes"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Paste your notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Paste your notes or chapter headings here..."
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating...
            </>
          ) : (
            "Generate Study Aids"
          )}
        </button>
      </form>

      {/* Error display */}
      {state.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Mock mode banner */}
      {state.data && state.isMock && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Mock mode — configure OpenAI API key for real study aids
        </div>
      )}

      {/* Study aids output */}
      {state.data && (
        <div className="mt-6 space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Summary
            </h2>
            <ul className="space-y-2">
              {state.data.summary.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Key Terms */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Key Terms
            </h2>
            <dl className="space-y-3">
              {state.data.keyTerms.map((item, i) => (
                <div key={i}>
                  <dt className="text-sm font-semibold text-gray-900">
                    {item.term}
                  </dt>
                  <dd className="mt-0.5 text-sm text-gray-600">
                    {item.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Practice Questions */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Practice Questions
            </h2>
            <ol className="space-y-3">
              {state.data.questions.map((q, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 font-medium text-gray-400">
                    {i + 1}.
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-700">{q.question}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        q.type === "recall"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-teal-100 text-teal-700"
                      }`}
                    >
                      {q.type}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
