"use client";

import { useState, useTransition } from "react";
import type { StudyHelp, Flashcard, MultipleChoice } from "@/lib/study-help/types";
import FlashcardEditor from "./FlashcardEditor";
import QuizEditor from "./QuizEditor";

type TabKey = "flashcards" | "quiz";

interface SessionEditorProps {
  /** null when creating a new session */
  sessionId: string | null;
  initialData: Pick<StudyHelp, "flashcards" | "quiz">;
  onSave: (data: {
    flashcards: Flashcard[];
    quiz: MultipleChoice[];
  }) => Promise<{ error?: string }>;
  onCancel: () => void;
}

export default function SessionEditor({
  initialData,
  onSave,
  onCancel,
}: SessionEditorProps) {
  const [tab, setTab] = useState<TabKey>("flashcards");
  const [flashcards, setFlashcards] = useState<Flashcard[]>(initialData.flashcards);
  const [quiz, setQuiz] = useState<MultipleChoice[]>(initialData.quiz);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await onSave({ flashcards, quiz });
      if (result.error) {
        setError(result.error);
      }
    });
  };

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "flashcards", label: "Flashcards", count: flashcards.length },
    { key: "quiz", label: "Quiz", count: quiz.length },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Editor content */}
      <div className="min-h-[200px]">
        {tab === "flashcards" && (
          <FlashcardEditor flashcards={flashcards} onChange={setFlashcards} />
        )}
        {tab === "quiz" && (
          <QuizEditor questions={quiz} onChange={setQuiz} />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
