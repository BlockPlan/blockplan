import { DEFAULT_GRADING_SCALE, getLetterGrade } from "@/lib/validations/grade";

// ── Types ────────────────────────────────────────────────────────────────

export interface GradableTask {
  id: string;
  title: string;
  type: string;
  grade: number | null;   // earned score
  points: number | null;  // max possible score
  weight: number | null;  // category weight (optional)
}

export interface CourseGradeResult {
  courseId: string;
  courseName: string;
  weightedAverage: number | null; // 0-100 percentage
  letterGrade: string;
  gpaPoints: number;
  gradedCount: number;
  totalGradableCount: number;
  tasks: GradableTask[];
}

export interface GPAResult {
  gpa: number | null;        // 0.0 – 4.0
  courseGrades: CourseGradeResult[];
  totalGraded: number;
  totalGradable: number;
}

// ── GPA Scale ────────────────────────────────────────────────────────────

const LETTER_TO_GPA: Record<string, number> = {
  "A":  4.0,
  "A-": 3.7,
  "B+": 3.3,
  "B":  3.0,
  "B-": 2.7,
  "C+": 2.3,
  "C":  2.0,
  "C-": 1.7,
  "D+": 1.3,
  "D":  1.0,
  "D-": 0.7,
  "F":  0.0,
};

export function letterToGPA(letter: string): number {
  return LETTER_TO_GPA[letter] ?? 0.0;
}

// ── Course Grade ─────────────────────────────────────────────────────────

/**
 * Compute the weighted (or simple) average for a set of tasks in one course.
 */
export function computeCourseGrade(
  courseId: string,
  courseName: string,
  tasks: GradableTask[],
  gradingScale: Record<string, number> = DEFAULT_GRADING_SCALE
): CourseGradeResult {
  // Only tasks with points > 0 are "gradable"
  const gradable = tasks.filter((t) => t.points != null && t.points > 0);
  const graded = gradable.filter((t) => t.grade != null);

  if (graded.length === 0) {
    return {
      courseId,
      courseName,
      weightedAverage: null,
      letterGrade: "–",
      gpaPoints: 0,
      gradedCount: 0,
      totalGradableCount: gradable.length,
      tasks: gradable,
    };
  }

  // Check if any graded task has a weight set
  const hasWeights = graded.some((t) => t.weight != null && t.weight > 0);

  let average: number;

  if (hasWeights) {
    // Weighted average: sum(grade/points * weight) / sum(weight)
    let numerator = 0;
    let denominator = 0;
    for (const t of graded) {
      const w = t.weight ?? 1;
      numerator += (t.grade! / t.points!) * w;
      denominator += w;
    }
    average = denominator > 0 ? (numerator / denominator) * 100 : 0;
  } else {
    // Simple average of percentages
    let sum = 0;
    for (const t of graded) {
      sum += (t.grade! / t.points!) * 100;
    }
    average = sum / graded.length;
  }

  // Clamp to 0-100 range (grades could exceed points for extra credit)
  const clamped = Math.min(Math.max(average, 0), 100);
  const letter = getLetterGrade(clamped, gradingScale);

  return {
    courseId,
    courseName,
    weightedAverage: Math.round(clamped * 100) / 100,
    letterGrade: letter,
    gpaPoints: letterToGPA(letter),
    gradedCount: graded.length,
    totalGradableCount: gradable.length,
    tasks: gradable,
  };
}

// ── Semester GPA ─────────────────────────────────────────────────────────

/**
 * Compute overall GPA from multiple course grades.
 * Only courses with at least one graded task are included.
 */
export function computeGPA(courseGrades: CourseGradeResult[]): GPAResult {
  const withGrades = courseGrades.filter((c) => c.weightedAverage !== null);

  const totalGraded = courseGrades.reduce((s, c) => s + c.gradedCount, 0);
  const totalGradable = courseGrades.reduce((s, c) => s + c.totalGradableCount, 0);

  if (withGrades.length === 0) {
    return { gpa: null, courseGrades, totalGraded, totalGradable };
  }

  const gpaSum = withGrades.reduce((s, c) => s + c.gpaPoints, 0);
  const gpa = Math.round((gpaSum / withGrades.length) * 100) / 100;

  return { gpa, courseGrades, totalGraded, totalGradable };
}
