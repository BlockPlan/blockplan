"use client";

import type { MultipleChoice } from "@/lib/study-help/types";

interface QuizEditorProps {
  questions: MultipleChoice[];
  onChange: (questions: MultipleChoice[]) => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuizEditor({
  questions,
  onChange,
}: QuizEditorProps) {
  const updateQuestion = (
    index: number,
    field: keyof MultipleChoice,
    value: string | number | string[]
  ) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    const newOptions = [...updated[qIndex].options];
    newOptions[oIndex] = value;
    updated[qIndex] = { ...updated[qIndex], options: newOptions };
    onChange(updated);
  };

  const addQuestion = () => {
    onChange([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {questions.length === 0 && (
        <p className="text-sm text-gray-400">
          No quiz questions yet. Click &ldquo;Add Question&rdquo; to create one.
        </p>
      )}

      {questions.map((q, qi) => (
        <div
          key={qi}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Question {qi + 1}
            </span>
            <button
              type="button"
              onClick={() => removeQuestion(qi)}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label={`Remove question ${qi + 1}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Question text */}
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Question
            </label>
            <textarea
              value={q.question}
              onChange={(e) => updateQuestion(qi, "question", e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter the question..."
            />
          </div>

          {/* Options */}
          <div className="mb-3 space-y-2">
            <label className="block text-xs font-medium text-gray-500">
              Options (select the correct answer)
            </label>
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <label
                  className={`flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    q.correctIndex === oi
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-300 text-gray-400 hover:border-emerald-400"
                  }`}
                >
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctIndex === oi}
                    onChange={() => updateQuestion(qi, "correctIndex", oi)}
                    className="sr-only"
                  />
                  {OPTION_LABELS[oi]}
                </label>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder={`Option ${OPTION_LABELS[oi]}...`}
                />
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Explanation
            </label>
            <textarea
              value={q.explanation}
              onChange={(e) =>
                updateQuestion(qi, "explanation", e.target.value)
              }
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Explain why the correct answer is right..."
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-blue-400 hover:text-blue-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        Add Question
      </button>
    </div>
  );
}
