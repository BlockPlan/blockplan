import * as chrono from "chrono-node";
import { DEFAULT_MINUTES } from "@/lib/validations/task";
import type { ParsedItem } from "@/lib/syllabus/types";

// ---------------------------------------------------------------------------
// Keyword regex patterns
// ---------------------------------------------------------------------------

const ASSIGNMENT_KEYWORDS =
  /\b(homework|assignment|quiz|project|paper|essay|report|lab|worksheet|submission|portfolio|bibliography|proposal|draft|discussion|presentation|reflection|review)\b/i;

// "test" must not be preceded by "pre-" or followed by "ing", "ed" (contextual)
const EXAM_KEYWORDS = /\b(exam|midterm|(?<!pre-)test(?!ing\b|ed\b))\b/i;

// "final" only when it looks like an exam context (e.g., "Final Exam")
// NOT matching "Final Research Paper" or "Final Portfolio"
const FINAL_EXAM_PATTERN = /\bfinal\s+exam\b/i;

const READING_KEYWORDS = /\b(read(?:ing)?|chapter|ch\.\s*\d|pages?\s*\d|pp\.\s*\d)\b/i;

const POINTS_PATTERN = /(\d+)\s*(?:pts?|points?)\b/i;
const WEIGHT_PATTERN = /(\d+(?:\.\d+)?)\s*%/;

// Lines that are clearly NOT assignments — section headers, descriptions, etc.
const SKIP_PATTERNS = [
  /^(course\s+description|grading\s+(breakdown|policy|scale)|meeting\s+times?|office\s+hours?|instructor|professor|contact|email|phone|textbook|required\s+materials?|learning\s+outcomes?|policies|attendance|academic\s+integrity|disability|accommodation)/i,
  /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+\d{1,2}:\d{2}/i, // Meeting time lines like "Monday 09:00–10:00"
  /^focuses\s+on\b/i, // Description sentences
  /^(this\s+course|students\s+will|by\s+the\s+end)/i, // Description sentences
];

// Pattern for grading breakdown lines like "- Participation: 15%"
// These have a percentage but no date — skip them
const GRADING_LINE_PATTERN = /^[-•*]?\s*[\w\s]+:\s*\d+(?:\.\d+)?\s*%\s*$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize Unicode dashes/hyphens to a standard hyphen-minus for easier parsing.
 */
function normalizeDashes(text: string): string {
  // Replace em-dash (—), en-dash (–), minus sign (−) with standard hyphen
  return text.replace(/[\u2013\u2014\u2212]/g, "-");
}

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

  // Remove common leading bullets / numbering and dashes
  title = title.replace(/^[\s\-–—•*\d.]+/, "");

  // Also remove trailing dashes left after date removal
  title = title.replace(/^\s*[-–—]\s*/, "");

  // Remove empty parentheses left after date removal (e.g., "Assignments ():")
  title = title.replace(/\(\s*\)/g, "");

  // Remove trailing colons (from section headers that slipped through)
  title = title.replace(/:\s*$/, "");

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
  if (FINAL_EXAM_PATTERN.test(line)) return "exam";
  if (EXAM_KEYWORDS.test(line)) return "exam";
  if (ASSIGNMENT_KEYWORDS.test(line)) return "assignment";
  if (READING_KEYWORDS.test(line)) return "reading";
  return "other";
}

/**
 * Check if a line should be skipped entirely (headers, descriptions, etc.)
 */
function shouldSkipLine(line: string): boolean {
  // Skip section headers and descriptive text
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(line)) return true;
  }

  // Skip grading breakdown lines (e.g., "- Participation: 15%")
  if (GRADING_LINE_PATTERN.test(line)) return true;

  // Skip section header lines that end with ":" (e.g., "Assignments (July 15 – Sept 1, 2026):")
  // These are headings, not actual tasks
  if (/:\s*$/.test(line)) return true;

  return false;
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
  // Normalize dashes throughout the text before splitting lines
  const normalizedText = normalizeDashes(text);
  const lines = normalizedText.split("\n");
  const items: ParsedItem[] = [];

  console.log("[parser] Total lines to process:", lines.length);
  console.log("[parser] Term start date:", termStartDate.toISOString());

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip lines that are too short or too long to be meaningful
    if (line.length < 5 || line.length > 500) continue;

    // Skip known non-assignment lines
    if (shouldSkipLine(line)) {
      console.log("[parser] SKIP (header/desc):", line.slice(0, 80));
      continue;
    }

    // Detect item type
    const type = detectType(line);

    // Date extraction — chrono.parse with instant so relative dates resolve
    // against the term start date rather than today's date
    const dateResults = chrono.parse(line, {
      instant: termStartDate,
    });
    const firstDate = dateResults.length > 0 ? dateResults[0] : null;

    // If no keyword match AND no date found, skip the line
    // But if a date IS found, keep it even without keyword match — it's likely
    // a schedule item (e.g. "July 17 - Diagnostic Essay")
    if (type === "other" && !firstDate) {
      console.log("[parser] SKIP (no keyword, no date):", line.slice(0, 80));
      continue;
    }

    const dueDate = firstDate
      ? firstDate.start.date().toISOString().split("T")[0]
      : null;

    // Lines with no keyword match but a date get "assignment" as default type
    // and are flagged for user review
    const resolvedType = type === "other" ? "assignment" : type;
    const needsReview = type === "other" || dueDate === null;
    const confidence: "high" | "low" =
      type !== "other" && dueDate ? "high" : "low";

    // Extract points
    const pointsMatch = POINTS_PATTERN.exec(line);
    const points = pointsMatch ? Number(pointsMatch[1]) : null;

    // Extract weight
    const weightMatch = WEIGHT_PATTERN.exec(line);
    const weight = weightMatch ? Number(weightMatch[1]) : null;

    // Build clean title
    const title = cleanTitle(line, firstDate?.text);

    // Skip items with empty or generic/meaningless titles
    if (!title || title.length < 3) continue;
    // Skip if title is just a generic keyword with no specifics (e.g., "Assignments", "Assignments ():", etc.)
    if (/^(assignments?|homework|quizzes?|readings?|exams?|projects?)\s*(\(.*?\))?\s*:?\s*$/i.test(title)) continue;

    console.log(
      `[parser] MATCH: type=${resolvedType}, date=${dueDate}, title="${title}"`
    );

    items.push({
      id: crypto.randomUUID(),
      title,
      type: resolvedType,
      dueDate,
      estimatedMinutes: DEFAULT_MINUTES[resolvedType],
      points,
      weight,
      needsReview,
      confidence,
      source: "rule-based",
    });
  }

  console.log("[parser] Total items found:", items.length);
  return items;
}
