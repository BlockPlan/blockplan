"use client";

import { useState } from "react";
import type { StudyHelp } from "@/lib/study-help/types";
import FlashcardViewer from "./FlashcardViewer";
import FlashcardStudyMode from "./FlashcardStudyMode";
import QuizViewer from "./QuizViewer";
import PracticeTestViewer from "./PracticeTestViewer";

const TABS = [
  { key: "summary", label: "Summary" },
  { key: "keyTerms", label: "Key Terms" },
  { key: "flashcards", label: "Flashcards" },
  { key: "quiz", label: "Quiz" },
  { key: "practiceTest", label: "Practice Test" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function StudyHelpResults({
  data,
  courseName,
}: {
  data: StudyHelp;
  courseName?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [studyMode, setStudyMode] = useState(false);

  return (
    <div className="mt-8">
      {/* Course context */}
      {courseName && (
        <p className="mb-4 text-sm font-medium text-gray-500">
          Study materials for <span className="text-gray-900">{courseName}</span>
        </p>
      )}

      {/* Tab navigation */}
      <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "summary" && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Summary</h2>
            <ul className="space-y-2">
              {data.summary.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === "keyTerms" && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Key Terms</h2>
            <dl className="space-y-3">
              {data.keyTerms.map((item, i) => (
                <div key={i}>
                  <dt className="text-sm font-semibold text-gray-900">{item.term}</dt>
                  <dd className="mt-0.5 text-sm text-gray-600">{item.definition}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {activeTab === "flashcards" && (
          studyMode ? (
            <FlashcardStudyMode
              flashcards={data.flashcards}
              onExit={() => setStudyMode(false)}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Flashcards</h2>
                {data.flashcards.length > 0 && (
                  <button
                    onClick={() => setStudyMode(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <span>📖</span> Study Mode
                  </button>
                )}
              </div>
              <FlashcardViewer flashcards={data.flashcards} />
            </div>
          )
        )}

        {activeTab === "quiz" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Multiple Choice Quiz
            </h2>
            <QuizViewer questions={data.quiz} />
          </div>
        )}

        {activeTab === "practiceTest" && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Practice Test
            </h2>
            <PracticeTestViewer questions={data.practiceTest} />
          </div>
        )}
      </div>
    </div>
  );
}
