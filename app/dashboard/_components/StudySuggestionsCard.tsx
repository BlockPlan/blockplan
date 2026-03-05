"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { generatePlan } from "@/app/plan/actions";
import type { SuggestionResult } from "@/lib/services/study-suggestions";
import UrgencyBadge from "./UrgencyBadge";

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatDueShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export default function StudySuggestionsCard({
  result,
}: {
  result: SuggestionResult;
}) {
  const [isPending, startTransition] = useTransition();
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    startTransition(async () => {
      await generatePlan();
      setGenerated(true);
    });
  };

  // State A: No availability set
  if (!result.hasAvailability) {
    return (
      <div className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Study Suggestions
        </p>
        <p className="mt-2 font-semibold text-gray-900">
          Set Up Your Schedule
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Add your available study times so we can suggest when to study.
        </p>
        <Link
          href="/settings"
          className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Set Up Availability &rarr;
        </Link>
      </div>
    );
  }

  // State B: No tasks
  if (!result.hasTasks) {
    return (
      <div className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Study Suggestions
        </p>
        <p className="mt-2 font-semibold text-gray-900">Add Your First Tasks</p>
        <p className="mt-1 text-sm text-gray-500">
          Import a syllabus or add tasks manually to start getting study suggestions.
        </p>
        <div className="mt-3 flex gap-3">
          <Link
            href="/tasks"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Add Tasks &rarr;
          </Link>
          <Link
            href="/syllabi/upload"
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Import Syllabus &rarr;
          </Link>
        </div>
      </div>
    );
  }

  // State C: Has tasks but no active plan
  if (!result.hasActivePlan && !generated) {
    return (
      <div className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          Study Suggestions
        </p>
        <p className="mt-2 font-semibold text-gray-900">
          Ready to Plan Your Week?
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Generate a study plan based on your tasks and availability.
        </p>

        {/* Top urgency suggestions */}
        {result.suggestions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-medium text-gray-400">Suggested focus:</p>
            {result.suggestions.slice(0, 3).map((s) => (
              <div key={`${s.taskId}-${s.suggestedStart}`} className="flex items-center gap-2 text-sm">
                <UrgencyBadge urgency={s.urgency} />
                <span className="truncate text-gray-700">{s.taskTitle}</span>
                <span className="flex-shrink-0 text-xs text-gray-400">
                  {s.remainingMinutes} min
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="btn-primary mt-4 text-sm disabled:opacity-50"
        >
          {isPending ? "Generating..." : "Generate Study Plan"}
        </button>
      </div>
    );
  }

  // State D: Active plan — show today's remaining blocks + suggestions
  const hasBlocksToday = result.todayRemainingBlocks.length > 0;
  const hasSuggestions = result.suggestions.length > 0;

  if (!hasBlocksToday && !hasSuggestions) {
    return (
      <div className="mb-4 rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-[var(--shadow-card)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Study Suggestions
        </p>
        <p className="mt-2 font-semibold text-gray-900">All caught up!</p>
        <p className="mt-1 text-sm text-gray-500">
          No study blocks remaining today. Great work!
        </p>
        <Link
          href="/plan"
          className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View Full Plan &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
          {hasBlocksToday ? "Today's Study Plan" : "Upcoming Study Blocks"}
        </p>
        <Link
          href="/plan"
          className="text-xs font-medium text-blue-600 hover:text-blue-800"
        >
          Full Plan &rarr;
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {/* Show today's scheduled blocks first */}
        {result.todayRemainingBlocks.map((block, i) => (
          <div
            key={block.id}
            className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2.5"
          >
            {i === 0 && (
              <span className="flex-shrink-0 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                Next
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">
                {block.taskTitle}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span>
                  {formatTime(block.startTime)} – {formatTime(block.endTime)}
                </span>
                {block.courseName && (
                  <>
                    <span>·</span>
                    <span>{block.courseName}</span>
                  </>
                )}
                {block.dueDate && (
                  <>
                    <span>·</span>
                    <span>Due {formatDueShort(block.dueDate)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Show suggestions for future blocks if fewer than 3 today blocks */}
        {result.todayRemainingBlocks.length < 3 &&
          result.suggestions
            .filter(
              (s) =>
                !result.todayRemainingBlocks.some(
                  (b) => b.taskId === s.taskId && b.startTime === s.suggestedStart
                )
            )
            .slice(0, 3 - result.todayRemainingBlocks.length)
            .map((s) => (
              <div
                key={`${s.taskId}-${s.suggestedStart}`}
                className="flex items-center gap-3 rounded-lg bg-white/40 px-3 py-2.5"
              >
                <UrgencyBadge urgency={s.urgency} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700">
                    {s.taskTitle}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>
                      {formatTime(s.suggestedStart)} – {formatTime(s.suggestedEnd)}
                    </span>
                    {s.courseName && (
                      <>
                        <span>·</span>
                        <span>{s.courseName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
