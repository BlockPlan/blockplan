import * as chrono from "chrono-node";
import { DEFAULT_MINUTES } from "@/lib/validations/task";
import type { ParsedItem } from "@/lib/syllabus/types";

// ---------------------------------------------------------------------------
// Keyword regex patterns
// ---------------------------------------------------------------------------

const ASSIGNMENT_KEYWORDS =
  /\b(homework|assignment|quiz|project|paper|essay|report|lab|worksheet)\b/i;

// "test" must not be preceded by "pre-" or followed by "ing", "ed", "s " (contextual)
const EXAM_KEYWORDS = /\b(exam|midterm|final|(?<!pre-)test(?!ing\b|ed\b))\b/i;

const READING_KEYWORDS = /\b(read(?:ing)?|chapter|ch\.|pages|pp\.)\b/i;

const POINTS_PATTERN = /(\d+)\s*(?:pts?|points?)\b/i;
const WEIGHT_PATTERN = /(\d+(?:\.\d+)?)\s*%/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Remove date text, points text, and excess whitespace from a line
 * to produce a clean human-readable title.
 */
function cleanTitle(line: string, dateText?: string): string {
  let title = line;

  // Remove the matched date string if provided
  if (dateText) {
    title = title.replace(dateText, "");
  }

  // Remove points/percentage references
  title = title.replace(/\d+\s*(?:pts?|points?)\b/gi, "");
  title = title.replace(/\d+(?:\.\d+)?\s*%/g, "");

  // Remove common leading bullets / numbering
  title = title.replace(/^[\s\-•*\d.]+/, "");

  // Collapse excess whitespace
  title = title.replace(/\s{2,}/g, " ").trim();

  return title || line.trim();
}

/**
 * Detect the type of a syllabus line based on keyword matches.
 * Priority: exam > assignment > reading > other
 */
function detectType(
  line: string
): "assignment" | "exam" | "reading" | "other" {
  if (EXAM_KEYWORDS.test(line)) return "exam";
  if (ASSIGNMENT_KEYWORDS.test(line)) return "assignment";
  if (READING_KEYWORDS.test(line)) return "reading";
  return "other";
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parse syllabus text using regex + chrono-node date extraction.
 *
 * @param text - Raw text extracted from the PDF
 * @param termStartDate - The first day of the academic term (used as chrono reference)
 * @returns Array of ParsedItems extracted from the text
 */
export function parseWithRules(
  text: string,
  termStartDate: Date
): ParsedItem[] {
  const lines = text.split("\n");
  const items: ParsedItem[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip lines that are too short or too long to be meaningful
    if (line.length < 5 || line.length > 500) continue;

    // Detect item type — skip "other" lines with no recognisable keywords
    // to avoid flooding with non-item text
    const type = detectType(line);
    if (type === "other") continue;

    // Date extraction — chrono.parse with instant so relative dates resolve
    // against the term start date rather than today's date
    const dateResults = chrono.parse(line, { instant: termStartDate });
    const firstDate = dateResults.length > 0 ? dateResults[0] : null;

    const dueDate = firstDate
      ? firstDate.start.date().toISOString().split("T")[0]
      : null;

    const needsReview = dueDate === null;
    const confidence: "high" | "low" = dueDate ? "high" : "low";

    // Extract points
    const pointsMatch = POINTS_PATTERN.exec(line);
    const points = pointsMatch ? Number(pointsMatch[1]) : null;

    // Extract weight
    const weightMatch = WEIGHT_PATTERN.exec(line);
    const weight = weightMatch ? Number(weightMatch[1]) : null;

    // Build clean title
    const title = cleanTitle(line, firstDate?.text);

    if (!title) continue;

    items.push({
      id: crypto.randomUUID(),
      title,
      type,
      dueDate,
      estimatedMinutes: DEFAULT_MINUTES[type],
      points,
      weight,
      needsReview,
      confidence,
      source: "rule-based",
    });
  }

  return items;
}
