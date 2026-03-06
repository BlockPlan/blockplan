"use client";

import { useState, useEffect, useCallback } from "react";
import type { Flashcard } from "@/lib/study-help/types";

type CardResult = "got_it" | "learning";

interface FlashcardStudyModeProps {
  flashcards: Flashcard[];
  onExit: () => void;
}

export default function FlashcardStudyMode({
  flashcards,
  onExit,
}: FlashcardStudyModeProps) {
  const [studyCards, setStudyCards] = useState<Flashcard[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Map<number, CardResult>>(new Map());
  const [phase, setPhase] = useState<"studying" | "results">("studying");
  const [round, setRound] = useState(1);

  const card = studyCards[currentIndex];
  const reviewed = results.size;
  const total = studyCards.length;

  const markCard = useCallback(
    (result: CardResult) => {
      if (phase !== "studying") return;

      setResults((prev) => {
        const next = new Map(prev);
        next.set(currentIndex, result);
        return next;
      });

      setFlipped(false);

      if (currentIndex + 1 < total) {
        // Small delay so flip resets visually before advancing
        setTimeout(() => setCurrentIndex((i) => i + 1), 150);
      } else {
        // All cards reviewed — show results
        setTimeout(() => setPhase("results"), 150);
      }
    },
    [currentIndex, total, phase]
  );

  const handleFlip = useCallback(() => {
    if (phase === "studying") setFlipped((f) => !f);
  }, [phase]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (phase !== "studying") {
        if (e.key === "Escape") onExit();
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          handleFlip();
          break;
        case "ArrowRight":
          e.preventDefault();
          if (flipped) markCard("got_it");
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (flipped) markCard("learning");
          break;
        case "Escape":
          onExit();
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, flipped, handleFlip, markCard, onExit]);

  // Results calculations
  const gotItCount = Array.from(results.values()).filter(
    (r) => r === "got_it"
  ).length;
  const learningCount = Array.from(results.values()).filter(
    (r) => r === "learning"
  ).length;
  const percent = total > 0 ? Math.round((gotItCount / total) * 100) : 0;

  function reviewMissed() {
    const missedCards = studyCards.filter((_, i) => results.get(i) === "learning");
    if (missedCards.length === 0) return;
    setStudyCards(missedCards);
    setCurrentIndex(0);
    setFlipped(false);
    setResults(new Map());
    setPhase("studying");
    setRound((r) => r + 1);
  }

  function restartAll() {
    setStudyCards(flashcards);
    setCurrentIndex(0);
    setFlipped(false);
    setResults(new Map());
    setPhase("studying");
    setRound(1);
  }

  // ── Results Screen ──────────────────────────────────────────────────
  if (phase === "results") {
    return (
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <span className="text-3xl">
              {percent >= 80 ? "🎉" : percent >= 50 ? "💪" : "📚"}
            </span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {round > 1 ? `Round ${round} Complete!` : "Study Session Complete!"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {gotItCount} of {total} cards mastered
          </p>
        </div>

        {/* Score bar */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Score</span>
            <span className="font-bold text-blue-600">{percent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div className="flex h-full">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${100 - percent}%` }}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Got It ({gotItCount})
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              Still Learning ({learningCount})
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {learningCount > 0 && (
            <button
              onClick={reviewMissed}
              className="rounded-lg bg-amber-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              Review Missed Cards ({learningCount})
            </button>
          )}
          <button
            onClick={restartAll}
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Start Over (All Cards)
          </button>
          <button
            onClick={onExit}
            className="rounded-lg px-4 py-3 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
          >
            Exit Study Mode
          </button>
        </div>
      </div>
    );
  }

  // ── Study Screen ────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-md">
      {/* Header with progress */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-sm text-gray-400 transition-colors hover:text-gray-600"
        >
          ✕ Exit
        </button>
        <p className="text-sm font-medium text-gray-600">
          {reviewed + 1} of {total}
          {round > 1 && (
            <span className="ml-1 text-xs text-amber-500">Round {round}</span>
          )}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${(reviewed / total) * 100}%` }}
        />
      </div>

      {/* Flashcard */}
      <button
        type="button"
        onClick={handleFlip}
        className="mx-auto block w-full cursor-pointer"
      >
        <div
          className="relative h-64 w-full"
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
                <p className="text-lg font-medium text-gray-900">
                  {card.front}
                </p>
                <p className="mt-4 text-xs text-gray-400">
                  Click or press Space to flip
                </p>
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
                <p className="mt-4 text-xs text-gray-400">
                  Rate your knowledge below
                </p>
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Action buttons — only visible when flipped */}
      <div
        className={`mt-5 flex gap-3 transition-opacity duration-200 ${
          flipped ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <button
          onClick={() => markCard("learning")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
        >
          <span>←</span> Still Learning
        </button>
        <button
          onClick={() => markCard("got_it")}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
        >
          Got It <span>→</span>
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-3 text-center text-xs text-gray-400">
        Space to flip · ← Still Learning · → Got It · Esc to exit
      </p>
    </div>
  );
}
