"use client";

import { useState } from "react";
import type { StudyHelp } from "@/lib/study-help/types";
import type { RegeneratableSection } from "@/lib/study-help/types";
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
  sessionId,
  onRegenerate,
}: {
  data: StudyHelp;
  courseName?: string;
  sessionId?: string;
  onRegenerate?: (sections: RegeneratableSection[]) => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [studyMode, setStudyMode] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<RegeneratableSection | null>(null);

  const handleRegenerate = async (section: RegeneratableSection) => {
    if (!onRegenerate || regeneratingSection) return;
    setRegeneratingSection(section);
    try {
      await onRegenerate([section]);
    } finally {
      setRegeneratingSection(null);
    }
  };

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
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
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
              sessionId={sessionId}
              onExit={() => setStudyMode(false)}
              onRegenerate={onRegenerate ? () => handleRegenerate("flashcards") : undefined}
              isRegenerating={regeneratingSection === "flashcards"}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Flashcards</h2>
                <div className="flex items-center gap-2">
                  {onRegenerate && (
                    <button
                      onClick={() => handleRegenerate("flashcards")}
                      disabled={regeneratingSection === "flashcards"}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                      {regeneratingSection === "flashcards" ? (
                        <>
                          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Generating...
                        </>
                      ) : (
                        "New Cards"
                      )}
                    </button>
                  )}
                  {data.flashcards.length > 0 && (
                    <button
                      onClick={() => setStudyMode(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <span>📖</span> Study Mode
                    </button>
                  )}
                </div>
              </div>
              <FlashcardViewer flashcards={data.flashcards} />
            </div>
          )
        )}

        {activeTab === "quiz" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Multiple Choice Quiz
              </h2>
              {onRegenerate && (
                <button
                  onClick={() => handleRegenerate("quiz")}
                  disabled={regeneratingSection === "quiz"}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {regeneratingSection === "quiz" ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "New Quiz"
                  )}
                </button>
              )}
            </div>
            <QuizViewer
              questions={data.quiz}
              onRegenerate={onRegenerate ? () => handleRegenerate("quiz") : undefined}
              isRegenerating={regeneratingSection === "quiz"}
            />
          </div>
        )}

        {activeTab === "practiceTest" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Practice Test
              </h2>
              {onRegenerate && (
                <button
                  onClick={() => handleRegenerate("practiceTest")}
                  disabled={regeneratingSection === "practiceTest"}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {regeneratingSection === "practiceTest" ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "New Test"
                  )}
                </button>
              )}
            </div>
            <PracticeTestViewer
              questions={data.practiceTest}
              onRegenerate={onRegenerate ? () => handleRegenerate("practiceTest") : undefined}
              isRegenerating={regeneratingSection === "practiceTest"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
