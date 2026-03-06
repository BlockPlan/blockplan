"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Flashcard } from "@/lib/study-help/types";
import {
  getFlashcardProgress,
  saveFlashcardResults,
  type CardProgress,
} from "@/app/study-help/actions";

type CardResult = "got_it" | "learning";

const BOX_LABELS: Record<number, string> = {
  1: "New",
  2: "Learning",
  3: "Familiar",
  4: "Strong",
  5: "Mastered",
};

const BOX_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-amber-100 text-amber-700",
  3: "bg-yellow-100 text-yellow-700",
  4: "bg-blue-100 text-blue-700",
  5: "bg-emerald-100 text-emerald-700",
};

interface StudyCard {
  flashcard: Flashcard;
  originalIndex: number; // index in the original flashcards array (for DB key)
}

interface FlashcardStudyModeProps {
  flashcards: Flashcard[];
  sessionId?: string;
  onExit: () => void;
}

export default function FlashcardStudyMode({
  flashcards,
  sessionId,
  onExit,
}: FlashcardStudyModeProps) {
  const [studyCards, setStudyCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Map<number, CardResult>>(new Map());
  const [phase, setPhase] = useState<"loading" | "studying" | "results">(
    sessionId ? "loading" : "studying"
  );
  const [round, setRound] = useState(1);
  const [cardProgress, setCardProgress] = useState<Record<number, CardProgress>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Track cards that need re-queuing within the session
  const requeueBuffer = useRef<StudyCard[]>([]);

  // Build initial study cards (sorted by box for spaced repetition)
  useEffect(() => {
    if (sessionId) {
      // Load progress from DB then sort
      getFlashcardProgress(sessionId).then(({ progress }) => {
        setCardProgress(progress);
        const cards = flashcards.map((f, i) => ({
          flashcard: f,
          originalIndex: i,
        }));
        // Sort: lower box first (harder cards first)
        cards.sort((a, b) => {
          const boxA = progress[a.originalIndex]?.box ?? 1;
          const boxB = progress[b.originalIndex]?.box ?? 1;
          return boxA - boxB;
        });
        setStudyCards(cards);
        setPhase("studying");
      });
    } else {
      // No session — just use cards in order
      setStudyCards(flashcards.map((f, i) => ({ flashcard: f, originalIndex: i })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const card = studyCards[currentIndex];
  const reviewed = results.size;
  const total = studyCards.length;

  const markCard = useCallback(
    (result: CardResult) => {
      if (phase !== "studying") return;

      const currentCard = studyCards[currentIndex];

      setResults((prev) => {
        const next = new Map(prev);
        next.set(currentIndex, result);
        return next;
      });

      // Within-session re-queue: if "learning", insert card back ~4 positions later
      if (result === "learning") {
        const insertPos = Math.min(currentIndex + 4, studyCards.length);
        // Only re-queue if we haven't already re-queued this card too many times
        const timesQueued = requeueBuffer.current.filter(
          (c) => c.originalIndex === currentCard.originalIndex
        ).length;
        if (timesQueued < 2) {
          requeueBuffer.current.push(currentCard);
          setStudyCards((prev) => {
            const next = [...prev];
            next.splice(insertPos, 0, { ...currentCard });
            return next;
          });
        }
      }

      setFlipped(false);

      // Check if we've reached the end (account for any cards that may have been inserted)
      const newTotal = studyCards.length + (result === "learning" ? 1 : 0);
      if (currentIndex + 1 < newTotal) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 150);
      } else {
        setTimeout(() => setPhase("results"), 150);
      }
    },
    [currentIndex, studyCards, phase]
  );

  const handleFlip = useCallback(() => {
    if (phase === "studying") setFlipped((f) => !f);
  }, [phase]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (phase === "loading") return;
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

  // Results calculations — deduplicate by originalIndex (take last result for re-queued cards)
  const uniqueResults = new Map<number, CardResult>();
  for (const [idx, result] of results) {
    const origIdx = studyCards[idx]?.originalIndex;
    if (origIdx !== undefined) {
      uniqueResults.set(origIdx, result);
    }
  }

  const gotItCount = Array.from(uniqueResults.values()).filter(
    (r) => r === "got_it"
  ).length;
  const learningCount = Array.from(uniqueResults.values()).filter(
    (r) => r === "learning"
  ).length;
  const uniqueTotal = uniqueResults.size;
  const percent = uniqueTotal > 0 ? Math.round((gotItCount / uniqueTotal) * 100) : 0;

  // Save results to DB when reaching results phase
  useEffect(() => {
    if (phase !== "results" || !sessionId || saving || saved) return;

    setSaving(true);
    const resultArray = Array.from(uniqueResults.entries()).map(
      ([cardIndex, result]) => ({ cardIndex, result })
    );
    saveFlashcardResults(sessionId, resultArray).then(() => {
      setSaving(false);
      setSaved(true);
      // Update local progress state for display
      setCardProgress((prev) => {
        const next = { ...prev };
        for (const { cardIndex, result } of resultArray) {
          const prevBox = next[cardIndex]?.box ?? 1;
          next[cardIndex] = {
            box: result === "got_it" ? Math.min(prevBox + 1, 5) : 1,
            reviewCount: (next[cardIndex]?.reviewCount ?? 0) + 1,
            lastReviewed: new Date().toISOString(),
          };
        }
        return next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function reviewMissed() {
    const missedOriginalIndices = new Set<number>();
    for (const [origIdx, result] of uniqueResults) {
      if (result === "learning") missedOriginalIndices.add(origIdx);
    }
    const missedCards = flashcards
      .map((f, i) => ({ flashcard: f, originalIndex: i }))
      .filter((c) => missedOriginalIndices.has(c.originalIndex));
    if (missedCards.length === 0) return;
    // Sort by box (lower first)
    missedCards.sort((a, b) => {
      const boxA = cardProgress[a.originalIndex]?.box ?? 1;
      const boxB = cardProgress[b.originalIndex]?.box ?? 1;
      return boxA - boxB;
    });
    setStudyCards(missedCards);
    setCurrentIndex(0);
    setFlipped(false);
    setResults(new Map());
    requeueBuffer.current = [];
    setPhase("studying");
    setRound((r) => r + 1);
    setSaved(false);
  }

  function restartAll() {
    const cards = flashcards.map((f, i) => ({ flashcard: f, originalIndex: i }));
    cards.sort((a, b) => {
      const boxA = cardProgress[a.originalIndex]?.box ?? 1;
      const boxB = cardProgress[b.originalIndex]?.box ?? 1;
      return boxA - boxB;
    });
    setStudyCards(cards);
    setCurrentIndex(0);
    setFlipped(false);
    setResults(new Map());
    requeueBuffer.current = [];
    setPhase("studying");
    setRound(1);
    setSaved(false);
  }

  // ── Loading Screen ──────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-gray-500">Loading your progress...</p>
      </div>
    );
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
            {gotItCount} of {uniqueTotal} cards mastered
          </p>
          {sessionId && (
            <p className="mt-1 text-xs text-gray-400">
              {saving ? "Saving progress..." : saved ? "✓ Progress saved" : ""}
            </p>
          )}
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

        {/* Mastery breakdown (only for saved sessions) */}
        {sessionId && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-sm font-medium text-gray-700">Card Mastery</p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((box) => {
                const count = Array.from(uniqueResults.keys()).filter(
                  (idx) => (cardProgress[idx]?.box ?? 1) === box
                ).length;
                if (count === 0) return null;
                return (
                  <span
                    key={box}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${BOX_COLORS[box]}`}
                  >
                    {BOX_LABELS[box]} ({count})
                  </span>
                );
              })}
            </div>
          </div>
        )}

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
  const currentBox = card ? (cardProgress[card.originalIndex]?.box ?? 1) : 1;

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
        <div className="flex items-center gap-2">
          {sessionId && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${BOX_COLORS[currentBox]}`}
            >
              {BOX_LABELS[currentBox]}
            </span>
          )}
          <p className="text-sm font-medium text-gray-600">
            {Math.min(reviewed + 1, total)} of {total}
            {round > 1 && (
              <span className="ml-1 text-xs text-amber-500">Round {round}</span>
            )}
          </p>
        </div>
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
                  {card?.flashcard.front}
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
                <p className="text-base text-gray-800">{card?.flashcard.back}</p>
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
