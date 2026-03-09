"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/study-help/types";

interface FlashcardViewerProps {
  flashcards: Flashcard[];
  onEditCard?: (index: number, front: string, back: string) => void;
}

export default function FlashcardViewer({ flashcards, onEditCard }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  // Track confidence per card: true = "Got It", false = "Still Learning", undefined = not rated
  const [confidence, setConfidence] = useState<Record<number, boolean>>({});

  if (flashcards.length === 0) return null;

  const card = flashcards[currentIndex];
  const isEditing = editingIndex === currentIndex;

  const gotItCount = Object.values(confidence).filter((v) => v === true).length;
  const stillLearningCount = Object.values(confidence).filter((v) => v === false).length;

  const startEditing = () => {
    setEditFront(card.front);
    setEditBack(card.back);
    setEditingIndex(currentIndex);
    setFlipped(false);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
  };

  const saveEdit = () => {
    if (onEditCard && editingIndex !== null) {
      onEditCard(editingIndex, editFront, editBack);
    }
    setEditingIndex(null);
  };

  const goNext = () => {
    setFlipped(false);
    setEditingIndex(null);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const goPrev = () => {
    setFlipped(false);
    setEditingIndex(null);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const markConfidence = (gotIt: boolean) => {
    setConfidence((prev) => ({ ...prev, [currentIndex]: gotIt }));
    // Auto-advance to next card
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const resetProgress = () => {
    setConfidence({});
    setCurrentIndex(0);
    setFlipped(false);
  };

  return (
    <div>
      {/* Card counter + progress */}
      <div className="mb-3 text-center">
        <p className="text-sm text-gray-500">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
        {(gotItCount > 0 || stillLearningCount > 0) && (
          <div className="mt-1 flex items-center justify-center gap-3 text-xs">
            <span className="text-emerald-600">{gotItCount} Got It</span>
            <span className="text-amber-600">{stillLearningCount} Still Learning</span>
            <span className="text-gray-400">
              {flashcards.length - gotItCount - stillLearningCount} remaining
            </span>
          </div>
        )}
      </div>

      {isEditing ? (
        /* Edit mode */
        <div className="mx-auto w-full max-w-md rounded-xl border-2 border-amber-200 bg-amber-50 p-5">
          <div className="mb-3">
            <label className="mb-1 block text-xs font-semibold uppercase text-amber-600">
              Front (Question)
            </label>
            <textarea
              value={editFront}
              onChange={(e) => setEditFront(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase text-amber-600">
              Back (Answer)
            </label>
            <textarea
              value={editBack}
              onChange={(e) => setEditBack(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={cancelEditing}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        /* Normal card view */
        <div className="relative mx-auto block w-full max-w-md">
          {/* Edit button */}
          {onEditCard && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                startEditing();
              }}
              className="absolute right-2 top-2 z-10 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/80 hover:text-gray-600"
              title="Edit this card"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
              </svg>
            </button>
          )}

          {/* Confidence indicator dot */}
          {confidence[currentIndex] !== undefined && (
            <div
              className={`absolute left-2 top-2 z-10 h-3 w-3 rounded-full ${
                confidence[currentIndex] ? "bg-emerald-400" : "bg-amber-400"
              }`}
              title={confidence[currentIndex] ? "Got It" : "Still Learning"}
            />
          )}

          <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className="block w-full cursor-pointer"
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
                  </div>
                </div>
              </div>
            </div>
          </button>

          {/* Confidence buttons — shown when card is flipped */}
          {flipped && (
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                onClick={() => markConfidence(false)}
                className="flex items-center gap-1.5 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Still Learning
              </button>
              <button
                onClick={() => markConfidence(true)}
                className="flex items-center gap-1.5 rounded-lg border-2 border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Got It
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={goPrev}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Previous
        </button>
        <button
          onClick={goNext}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Next
        </button>
      </div>

      {/* Progress dots — colored by confidence */}
      <div className="mt-3 flex justify-center gap-1">
        {flashcards.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setFlipped(false);
              setEditingIndex(null);
              setCurrentIndex(i);
            }}
            className={`h-2 w-2 rounded-full transition-colors ${
              i === currentIndex
                ? "bg-blue-500"
                : confidence[i] === true
                  ? "bg-emerald-400"
                  : confidence[i] === false
                    ? "bg-amber-400"
                    : "bg-gray-300"
            }`}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>

      {/* Reset button when all cards have been rated */}
      {gotItCount + stillLearningCount === flashcards.length && (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-sm font-medium text-gray-900">
            You&apos;ve gone through all {flashcards.length} cards!
          </p>
          <p className="mt-1 text-sm text-gray-500">
            <span className="text-emerald-600">{gotItCount} Got It</span>
            {" · "}
            <span className="text-amber-600">{stillLearningCount} Still Learning</span>
          </p>
          {stillLearningCount > 0 && (
            <button
              onClick={() => {
                // Jump to first "still learning" card
                const firstStillLearning = Object.entries(confidence).find(
                  ([, v]) => v === false
                );
                if (firstStillLearning) {
                  setCurrentIndex(Number(firstStillLearning[0]));
                  setFlipped(false);
                }
              }}
              className="mt-3 mr-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Review Missed Cards
            </button>
          )}
          <button
            onClick={resetProgress}
            className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}
