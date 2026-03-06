"use client";

import { useState, useRef, useEffect, useActionState, useTransition } from "react";
import { toast } from "sonner";
import { updateTaskGrade, updateCourseGradingScale, type GradeState } from "../actions";
import { DEFAULT_GRADING_SCALE } from "@/lib/validations/grade";
import type { CourseGradeResult } from "@/lib/services/grade-calculator";

// ── Types ────────────────────────────────────────────────────────────────

interface CourseInfo {
  id: string;
  name: string;
  gradingScale: Record<string, number> | null;
}

interface GradeOverviewProps {
  courseGrades: CourseGradeResult[];
  courses: CourseInfo[];
}

// ── Color helpers ────────────────────────────────────────────────────────

function getGradeColor(letter: string): string {
  if (letter.startsWith("A")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (letter.startsWith("B")) return "text-blue-700 bg-blue-50 border-blue-200";
  if (letter.startsWith("C")) return "text-amber-700 bg-amber-50 border-amber-200";
  if (letter.startsWith("D")) return "text-orange-700 bg-orange-50 border-orange-200";
  if (letter === "–") return "text-gray-500 bg-gray-50 border-gray-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function getProgressColor(pct: number | null): string {
  if (pct === null) return "bg-gray-200";
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 80) return "bg-blue-500";
  if (pct >= 70) return "bg-amber-500";
  if (pct >= 60) return "bg-orange-500";
  return "bg-red-500";
}

// ── Main Component ───────────────────────────────────────────────────────

export default function GradeOverview({ courseGrades, courses }: GradeOverviewProps) {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [scaleEditorCourse, setScaleEditorCourse] = useState<string | null>(null);

  if (courseGrades.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
        </svg>
        <h3 className="mt-3 text-sm font-semibold text-gray-700">No courses yet</h3>
        <p className="mt-1 text-sm text-gray-500">Add courses and tasks to start tracking grades.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {courseGrades.map((cg) => {
          const isExpanded = expandedCourse === cg.courseId;
          const courseInfo = courses.find((c) => c.id === cg.courseId);

          return (
            <div
              key={cg.courseId}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-card-hover)]"
            >
              {/* Course header */}
              <button
                type="button"
                onClick={() => setExpandedCourse(isExpanded ? null : cg.courseId)}
                className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold ${getGradeColor(cg.letterGrade)}`}>
                    {cg.letterGrade}
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">{cg.courseName}</p>
                    <p className="text-sm text-gray-500">
                      {cg.gradedCount} of {cg.totalGradableCount} graded
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Progress bar */}
                  <div className="hidden w-32 sm:block">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(cg.weightedAverage)}`}
                        style={{ width: `${cg.weightedAverage ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-right text-xs text-gray-500">
                      {cg.weightedAverage !== null ? `${cg.weightedAverage}%` : "–"}
                    </p>
                  </div>
                  {/* Chevron */}
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded task list */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Assignments & Grades
                    </p>
                    <button
                      type="button"
                      onClick={() => setScaleEditorCourse(cg.courseId)}
                      className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Edit grading scale
                    </button>
                  </div>

                  {cg.tasks.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-400">
                      No gradable tasks. Add points to tasks to track grades.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cg.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {task.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {task.points} pts{task.weight ? ` | Weight: ${task.weight}` : ""}
                            </p>
                          </div>

                          {editingTaskId === task.id ? (
                            <InlineGradeForm
                              taskId={task.id}
                              currentGrade={task.grade}
                              currentPoints={task.points}
                              currentWeight={task.weight}
                              onDone={() => setEditingTaskId(null)}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditingTaskId(task.id)}
                              className={`ml-3 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                                task.grade !== null
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {task.grade !== null
                                ? `${task.grade}/${task.points}`
                                : "Enter grade"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grading scale editor dialog */}
      {scaleEditorCourse && (
        <GradingScaleEditor
          courseId={scaleEditorCourse}
          currentScale={
            courses.find((c) => c.id === scaleEditorCourse)?.gradingScale ?? DEFAULT_GRADING_SCALE
          }
          onClose={() => setScaleEditorCourse(null)}
        />
      )}
    </>
  );
}

// ── Inline Grade Entry ───────────────────────────────────────────────────

function InlineGradeForm({
  taskId,
  currentGrade,
  currentPoints,
  currentWeight,
  onDone,
}: {
  taskId: string;
  currentGrade: number | null;
  currentPoints: number | null;
  currentWeight: number | null;
  onDone: () => void;
}) {
  const initialState: GradeState = {};
  const [state, formAction, isPending] = useActionState(updateTaskGrade, initialState);

  useEffect(() => {
    if (state.success) {
      toast.success("Grade saved");
      onDone();
    }
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="ml-3 flex items-center gap-2">
      <input type="hidden" name="task_id" value={taskId} />
      <input
        name="grade"
        type="number"
        step="any"
        min="0"
        defaultValue={currentGrade ?? ""}
        placeholder="Score"
        className="input w-16 sm:w-20 py-1 text-sm"
        autoFocus
      />
      <span className="text-gray-400">/</span>
      <input
        name="points"
        type="number"
        step="any"
        min="0.01"
        defaultValue={currentPoints ?? ""}
        placeholder="Max"
        className="input w-16 sm:w-20 py-1 text-sm"
      />
      <input
        name="weight"
        type="hidden"
        value={currentWeight ?? ""}
      />
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary px-2 py-1 text-xs disabled:opacity-50"
      >
        {isPending ? "..." : "Save"}
      </button>
      <button
        type="button"
        onClick={onDone}
        className="px-1 py-1 text-xs text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}

// ── Grading Scale Editor Dialog ──────────────────────────────────────────

function GradingScaleEditor({
  courseId,
  currentScale,
  onClose,
}: {
  courseId: string;
  currentScale: Record<string, number>;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [scale, setScale] = useState<Record<string, number>>({ ...currentScale });
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const handleClose = () => onClose();
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  const sortedEntries = Object.entries(scale).sort(([, a], [, b]) => b - a);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateCourseGradingScale(courseId, scale);
      if (result.success) {
        toast.success("Grading scale updated");
        dialogRef.current?.close();
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  };

  const handleReset = () => {
    setScale({ ...DEFAULT_GRADING_SCALE });
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-0 shadow-[var(--shadow-dialog)] ring-1 ring-gray-900/5 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">Grading Scale</h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto px-6 py-4">
        <div className="space-y-2">
          {sortedEntries.map(([letter, threshold]) => (
            <div key={letter} className="flex items-center gap-3">
              <span className="w-8 text-sm font-semibold text-gray-700">{letter}</span>
              <input
                type="number"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) =>
                  setScale((prev) => ({
                    ...prev,
                    [letter]: Number(e.target.value) || 0,
                  }))
                }
                className="input w-24 py-1 text-sm"
              />
              <span className="text-xs text-gray-400">% and above</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Reset to default
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="btn-secondary px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
