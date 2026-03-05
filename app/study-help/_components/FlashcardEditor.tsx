"use client";

import type { Flashcard } from "@/lib/study-help/types";

interface FlashcardEditorProps {
  flashcards: Flashcard[];
  onChange: (cards: Flashcard[]) => void;
}

export default function FlashcardEditor({
  flashcards,
  onChange,
}: FlashcardEditorProps) {
  const updateCard = (index: number, field: keyof Flashcard, value: string) => {
    const updated = [...flashcards];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addCard = () => {
    onChange([...flashcards, { front: "", back: "" }]);
  };

  const removeCard = (index: number) => {
    onChange(flashcards.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {flashcards.length === 0 && (
        <p className="text-sm text-gray-400">
          No flashcards yet. Click &ldquo;Add Card&rdquo; to create one.
        </p>
      )}

      {flashcards.map((card, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400">
              Card {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeCard(i)}
              className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label={`Remove card ${i + 1}`}
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Front (Question)
              </label>
              <textarea
                value={card.front}
                onChange={(e) => updateCard(i, "front", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter question or term..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Back (Answer)
              </label>
              <textarea
                value={card.back}
                onChange={(e) => updateCard(i, "back", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter answer or definition..."
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addCard}
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
        Add Card
      </button>
    </div>
  );
}
