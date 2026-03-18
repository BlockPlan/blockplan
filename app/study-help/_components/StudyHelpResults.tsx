"use client";

import { useState } from "react";
import type { StudyHelp } from "@/lib/study-help/types";
import type { RegeneratableSection } from "@/lib/study-help/types";
import FlashcardViewer from "./FlashcardViewer";
import FlashcardStudyMode from "./FlashcardStudyMode";
import QuizViewer from "./QuizViewer";
import PracticeTestViewer from "./PracticeTestViewer";
import PracticeProblemsViewer from "./PracticeProblemsViewer";
import DiagramViewer from "./DiagramViewer";
import TutorChat from "./TutorChat";
import TutorUpgradePrompt from "./TutorUpgradePrompt";
import type { SubscriptionPlan } from "@/lib/subscription";
import type { DiagramType } from "@/lib/study-help/types";

const TABS = [
  { key: "summary", label: "Summary" },
  { key: "keyTerms", label: "Key Terms" },
  { key: "flashcards", label: "Flashcards" },
  { key: "quiz", label: "Quiz" },
  { key: "practiceTest", label: "Practice Test" },
  { key: "practiceProblems", label: "Practice Problems" },
  { key: "visualize", label: "Visualize" },
  { key: "tutor", label: "AI Tutor" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function StudyHelpResults({
  data,
  courseName,
  sessionId,
  onRegenerate,
  onEditFlashcard,
  onGenerateEli5,
  onGenerateDiagram,
  onGenerateIllustration,
  userPlan,
}: {
  data: StudyHelp;
  courseName?: string;
  sessionId?: string;
  onRegenerate?: (sections: RegeneratableSection[]) => Promise<void>;
  onEditFlashcard?: (index: number, front: string, back: string) => void;
  onGenerateEli5?: () => Promise<void>;
  onGenerateDiagram?: (type: DiagramType) => Promise<void>;
  onGenerateIllustration?: (mode: "cleanup" | "visualize", input: string) => Promise<void>;
  userPlan?: SubscriptionPlan;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [studyMode, setStudyMode] = useState(false);
  const [eli5Mode, setEli5Mode] = useState(false);
  const [generatingEli5, setGeneratingEli5] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<RegeneratableSection | null>(null);
  const [generatingDiagram, setGeneratingDiagram] = useState(false);
  const [generatingIllustration, setGeneratingIllustration] = useState(false);

  const hasEli5 = !!(data.eli5Summary && data.eli5Summary.length > 0);

  const handleEli5Toggle = async () => {
    if (eli5Mode) {
      setEli5Mode(false);
      return;
    }
    if (hasEli5) {
      setEli5Mode(true);
      return;
    }
    // Generate ELI5 on demand for old sessions
    if (onGenerateEli5) {
      setGeneratingEli5(true);
      try {
        await onGenerateEli5();
        setEli5Mode(true);
      } finally {
        setGeneratingEli5(false);
      }
    }
  };

  const handleGenerateDiagram = async (type: DiagramType) => {
    if (!onGenerateDiagram || generatingDiagram) return;
    setGeneratingDiagram(true);
    try {
      await onGenerateDiagram(type);
    } finally {
      setGeneratingDiagram(false);
    }
  };

  const handleRegenerate = async (section: RegeneratableSection) => {
    if (!onRegenerate || regeneratingSection) return;
    setRegeneratingSection(section);
    try {
      await onRegenerate([section]);
    } finally {
      setRegeneratingSection(null);
    }
  };

  const handleGenerateIllustration = async (mode: "cleanup" | "visualize", input: string) => {
    if (!onGenerateIllustration || generatingIllustration) return;
    setGeneratingIllustration(true);
    try {
      await onGenerateIllustration(mode, input);
    } finally {
      setGeneratingIllustration(false);
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

      {/* Tab navigation — scrollable on mobile, wraps on desktop */}
      <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200 bg-gray-100 p-1 -mx-1 sm:mx-0">
        <div className="flex gap-1 min-w-max sm:min-w-0 sm:flex-wrap">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                "whitespace-nowrap rounded-md px-2.5 py-2 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                activeTab === key
                  ? key === "tutor"
                    ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-sm"
                    : "bg-white text-gray-900 shadow-sm"
                  : key === "tutor"
                    ? "text-purple-600 hover:text-purple-800"
                    : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {label}
              {key === "tutor" && userPlan === "free" && (
                <span className="ml-1 text-[10px] align-super">PRO</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "summary" && (
          <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Summary</h2>
              <button
                onClick={handleEli5Toggle}
                disabled={generatingEli5}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  eli5Mode
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {generatingEli5 ? (
                  <>
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Simplifying...
                  </>
                ) : eli5Mode ? (
                  "Show Original"
                ) : (
                  "Simplify It"
                )}
              </button>
            </div>
            {eli5Mode && data.eli5Summary && data.eli5Summary.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-purple-600">Simplified version with everyday analogies</p>
                <ul className="space-y-2">
                  {data.eli5Summary.map((point, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <ul className="space-y-2">
                {data.summary.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-700">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "keyTerms" && (
          <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Key Terms</h2>
              <button
                onClick={handleEli5Toggle}
                disabled={generatingEli5}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  eli5Mode
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {generatingEli5 ? (
                  <>
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Simplifying...
                  </>
                ) : eli5Mode ? (
                  "Show Original"
                ) : (
                  "Simplify It"
                )}
              </button>
            </div>
            {eli5Mode && data.eli5KeyTerms && data.eli5KeyTerms.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-medium text-purple-600">Simplified definitions with analogies</p>
                <dl className="space-y-3">
                  {data.eli5KeyTerms.map((item, i) => (
                    <div key={i}>
                      <dt className="text-sm font-semibold text-gray-900">{item.term}</dt>
                      <dd className="mt-0.5 text-sm text-purple-700">{item.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <dl className="space-y-3">
                {data.keyTerms.map((item, i) => (
                  <div key={i}>
                    <dt className="text-sm font-semibold text-gray-900">{item.term}</dt>
                    <dd className="mt-0.5 text-sm text-gray-600">{item.definition}</dd>
                  </div>
                ))}
              </dl>
            )}
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
            <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-5">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Flashcards</h2>
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
              <FlashcardViewer flashcards={data.flashcards} onEditCard={onEditFlashcard} />
            </div>
          )
        )}

        {activeTab === "quiz" && (
          <div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
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
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
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

        {activeTab === "practiceProblems" && (
          <div>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                Practice Problems
              </h2>
              {onRegenerate && (
                <button
                  onClick={() => handleRegenerate("practiceProblems")}
                  disabled={regeneratingSection === "practiceProblems"}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  {regeneratingSection === "practiceProblems" ? (
                    <>
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "New Problems"
                  )}
                </button>
              )}
            </div>
            <PracticeProblemsViewer
              problems={data.practiceProblems ?? []}
              onRegenerate={onRegenerate ? () => handleRegenerate("practiceProblems") : undefined}
              isRegenerating={regeneratingSection === "practiceProblems"}
            />
            {(!data.practiceProblems || data.practiceProblems.length === 0) && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 text-center sm:p-8">
                <p className="text-sm text-gray-500">
                  No practice problems yet.
                  {onRegenerate && " Click \"New Problems\" above to generate step-by-step problems."}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "visualize" && (
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">Visualize</h2>
              <p className="text-sm text-gray-500">
                AI-generated study guides, mind maps, flowcharts, concept maps, and illustrations
              </p>
            </div>
            <DiagramViewer
              diagrams={data.diagrams ?? []}
              illustrations={data.illustrations}
              onGenerate={onGenerateDiagram ? handleGenerateDiagram : undefined}
              onGenerateIllustration={onGenerateIllustration ? handleGenerateIllustration : undefined}
              isGenerating={generatingDiagram}
              isGeneratingIllustration={generatingIllustration}
              userPlan={userPlan}
            />
          </div>
        )}

        {activeTab === "tutor" && (
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-gray-900 sm:text-lg">AI Tutor</h2>
              <p className="text-sm text-gray-500">
                Have a conversation about your study material
              </p>
            </div>
            {userPlan && userPlan !== "free" && sessionId ? (
              <TutorChat sessionId={sessionId} />
            ) : (
              <TutorUpgradePrompt />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
