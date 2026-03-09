"use client";

import { useActionState, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  generateStudyHelpAction,
  regenerateStudyMaterial,
  updateStudyHelpData,
  generateDiagramsForSession,
  type StudyHelpState,
} from "../actions";
import type { RegeneratableSection, DiagramType } from "@/lib/study-help/types";
import type { SubscriptionPlan } from "@/lib/subscription";
import FileUploader from "./FileUploader";
import StudyHelpResults from "./StudyHelpResults";

interface Course {
  id: string;
  name: string;
}

interface StudyHelpSessionProps {
  courses: Course[];
  initialCourseId?: string;
  userPlan?: SubscriptionPlan;
}

export default function StudyHelpSession({
  courses,
  initialCourseId,
  userPlan,
}: StudyHelpSessionProps) {
  const [state, formAction, isPending] = useActionState<StudyHelpState, FormData>(
    generateStudyHelpAction,
    {}
  );

  const [storagePaths, setStoragePaths] = useState<string[]>([]);
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  // Local data override for when sections are regenerated
  const [dataOverride, setDataOverride] = useState<Record<string, unknown> | null>(null);

  const handleFilesChange = useCallback((paths: string[]) => {
    setStoragePaths(paths);
  }, []);

  // Merge state.data with any local overrides from regeneration
  const displayData = state.data
    ? dataOverride
      ? { ...state.data, ...dataOverride }
      : state.data
    : null;

  const handleEditFlashcard = useCallback(
    (index: number, front: string, back: string) => {
      if (!state.sessionId || !displayData) return;
      const currentFlashcards = [...(displayData as import("@/lib/study-help/types").StudyHelp).flashcards];
      currentFlashcards[index] = { front, back };
      setDataOverride((prev) => ({ ...prev, flashcards: currentFlashcards }));
      // Persist to DB
      updateStudyHelpData(state.sessionId!, { flashcards: currentFlashcards }).then(
        (result) => {
          if (result.error) {
            toast.error("Failed to save edit");
          } else {
            toast.success("Card updated");
          }
        }
      );
    },
    [state.sessionId, displayData]
  );

  const handleGenerateDiagram = useCallback(
    async (diagramType: DiagramType) => {
      if (!state.sessionId) return;
      const result = await generateDiagramsForSession(state.sessionId, diagramType, state.courseName);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.diagrams) {
        setDataOverride((prev) => ({ ...prev, diagrams: result.diagrams }));
      }
      toast.success("Diagram generated!");
    },
    [state.sessionId, state.courseName]
  );

  const handleRegenerate = useCallback(
    async (sections: RegeneratableSection[]) => {
      if (!state.sessionId || !state.data) return;

      const currentData = displayData ?? state.data;
      const result = await regenerateStudyMaterial(
        state.sessionId,
        currentData as import("@/lib/study-help/types").StudyHelp,
        sections,
        state.courseName
      );

      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        setDataOverride((prev) => ({ ...prev, ...result.data }));
        const sectionNames = sections.map((s) =>
          s === "flashcards" ? "flashcards" : s === "quiz" ? "quiz" : "practice test"
        );
        toast.success(`New ${sectionNames.join(", ")} generated!`);
      }
    },
    [state.sessionId, state.data, state.courseName, displayData]
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">AI Study Help</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload PDFs, PowerPoints, or photos of your textbook, or paste your notes. AI will
          generate flashcards, quizzes, practice tests, and more.
        </p>
        <div className="mt-2 flex gap-4">
          <a
            href="/study-help/history"
            className="text-sm text-blue-600 hover:underline"
          >
            View saved sessions &rarr;
          </a>
          <a
            href="/study-help/create"
            className="text-sm text-blue-600 hover:underline"
          >
            Create your own &rarr;
          </a>
        </div>
      </div>

      {/* Input form */}
      <form action={formAction}>
        {/* Hidden field for storage paths */}
        <input type="hidden" name="storagePaths" value={JSON.stringify(storagePaths)} />

        {/* Course selector (optional) */}
        {courses.length > 0 && (
          <div className="mb-4">
            <label
              htmlFor="courseId"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Course <span className="text-gray-400">(optional)</span>
            </label>
            <select
              id="courseId"
              name="courseId"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="input cursor-pointer"
            >
              <option value="">No course selected</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File upload area */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Upload files
          </label>
          <FileUploader onFilesChange={handleFilesChange} />
        </div>

        {/* Text input area */}
        <div className="mb-4">
          <label
            htmlFor="notes"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Or paste your notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={6}
            className="input"
            placeholder="Paste your notes, chapter text, or study material here..."
          />
        </div>

        {/* Generate button */}
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary disabled:opacity-50"
        >
          {isPending ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating study materials...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Generate Study Materials
            </>
          )}
        </button>
      </form>

      {/* Error display */}
      {state.error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Mock mode banner */}
      {state.data && state.isMock && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Mock mode — configure OpenAI API key for real study materials
        </div>
      )}

      {/* Results */}
      {displayData && (
        <>
          {state.sessionId && (
            <p className="mt-4 text-xs text-green-600">
              &#10003; Saved to{" "}
              <a href="/study-help/history" className="underline">
                history
              </a>
            </p>
          )}
          <StudyHelpResults
            data={displayData as import("@/lib/study-help/types").StudyHelp}
            courseName={state.courseName}
            sessionId={state.sessionId}
            onRegenerate={state.sessionId ? handleRegenerate : undefined}
            onEditFlashcard={state.sessionId ? handleEditFlashcard : undefined}
            onGenerateDiagram={state.sessionId ? handleGenerateDiagram : undefined}
            userPlan={userPlan}
          />
        </>
      )}
    </div>
  );
}
