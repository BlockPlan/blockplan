"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/study-help/types";

export default function FlashcardViewer({ flashcards }: { flashcards: Flashcard[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (flashcards.length === 0) return null;

  const card = flashcards[currentIndex];

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div>
      {/* Card counter */}
      <p className="mb-3 text-center text-sm text-gray-500">
        Card {currentIndex + 1} of {flashcards.length}
      </p>

      {/* Flashcard */}
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="mx-auto block w-full max-w-md cursor-pointer"
      >
        <div
          className="relative h-44 w-full sm:h-56"
          style={{ perspective: "1000px" }}
        >
          <div
            className="absolute inset-0 transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50 p-6"
              style={{ backfaceVisibility: "hidden" }}
            >
              <div className="text-center">
                <p className="mb-2 text-xs font-medium uppercase text-blue-400">
                  Question
                </p>
                <p className="text-lg font-medium text-gray-900">{card.front}</p>
                <p className="mt-4 text-xs text-gray-400">Click to flip</p>
              </div>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-green-200 bg-green-50 p-6"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="text-center">
                <p className="mb-2 text-xs font-medium uppercase text-green-500">
                  Answer
                </p>
                <p className="text-base text-gray-800">{card.back}</p>
                <p className="mt-4 text-xs text-gray-400">Click to flip back</p>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={goPrev}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          ← Previous
        </button>
        <button
          onClick={goNext}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Next →
        </button>
      </div>

      {/* Progress dots */}
      <div className="mt-3 flex justify-center gap-1">
        {flashcards.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setFlipped(false);
              setCurrentIndex(i);
            }}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === currentIndex ? "bg-blue-500" : "bg-gray-300"
            }`}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
