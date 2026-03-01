// Core types for syllabus parsing pipeline

export interface ParsedItem {
  /** Client-side UUID generated at parse time */
  id: string;
  title: string;
  type: "assignment" | "exam" | "reading" | "other";
  /** ISO date string or null if no date was detected */
  dueDate: string | null;
  estimatedMinutes: number | null;
  points: number | null;
  weight: number | null;
  /** True when the parser could not confidently detect a due date or type */
  needsReview: boolean;
  confidence: "high" | "medium" | "low";
  source: "rule-based" | "llm" | "user-added";
}

export interface ExtractionResult {
  text: string;
  totalPages: number;
  isEmpty: boolean;
}

export interface ParserResult {
  items: ParsedItem[];
  source: "rule-based" | "llm" | "merged";
}
