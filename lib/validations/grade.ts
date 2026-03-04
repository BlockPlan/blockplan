import { z } from "zod";

// Default grading scale (percentage thresholds)
export const DEFAULT_GRADING_SCALE: Record<string, number> = {
  "A":  93,
  "A-": 90,
  "B+": 87,
  "B":  83,
  "B-": 80,
  "C+": 77,
  "C":  73,
  "C-": 70,
  "D+": 67,
  "D":  63,
  "D-": 60,
  "F":  0,
};

// Schema for entering a grade on a task
export const gradeEntrySchema = z.object({
  task_id: z.string().uuid("Must be a valid task ID"),
  grade: z
    .string()
    .transform((val) => (val.trim() !== "" ? Number(val) : undefined))
    .pipe(z.number().min(0, "Grade cannot be negative").optional()),
  points: z
    .string()
    .transform((val) => (val.trim() !== "" ? Number(val) : undefined))
    .pipe(z.number().min(0.01, "Points must be greater than 0").optional()),
  weight: z
    .string()
    .transform((val) => (val.trim() !== "" ? Number(val) : undefined))
    .pipe(z.number().min(0, "Weight cannot be negative").optional()),
});

// Schema for a grading scale
export const gradingScaleSchema = z.record(z.string(), z.number().min(0).max(100));

export type GradeEntry = z.infer<typeof gradeEntrySchema>;
export type GradingScale = z.infer<typeof gradingScaleSchema>;

/**
 * Get the letter grade for a given percentage using a grading scale.
 */
export function getLetterGrade(
  percentage: number,
  scale: Record<string, number> = DEFAULT_GRADING_SCALE
): string {
  // Sort thresholds descending so we match the highest qualifying grade
  const sorted = Object.entries(scale).sort(([, a], [, b]) => b - a);
  for (const [letter, threshold] of sorted) {
    if (percentage >= threshold) return letter;
  }
  return "F";
}
