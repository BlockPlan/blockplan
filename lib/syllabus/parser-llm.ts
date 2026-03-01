import { generateText, Output, NoObjectGeneratedError } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { ParsedItem } from "@/lib/syllabus/types";

// ---------------------------------------------------------------------------
// Inline Zod schema for LLM structured output
// ---------------------------------------------------------------------------

const llmItemSchema = z.object({
  title: z.string(),
  type: z.enum(["assignment", "exam", "reading", "other"]),
  dueDate: z.string().nullable(),
  estimatedMinutes: z.number().nullable(),
  needsReview: z.boolean(),
  confidence: z.enum(["high", "medium", "low"]),
});

const llmOutputSchema = z.object({
  items: z.array(llmItemSchema),
});

// Maximum characters sent to the LLM to stay within context limits
const MAX_TEXT_CHARS = 12_000;

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Parse syllabus text using an LLM (gpt-4o-mini).
 *
 * Feature-gated: returns an empty array immediately when OPENAI_API_KEY is
 * not set so the app functions without LLM integration.
 *
 * @param text - Raw syllabus text (will be truncated to 12,000 chars)
 * @param termContext - Human-readable term description (e.g. "Spring 2026, Apr 6 – Jul 24")
 * @returns Parsed items or empty array on failure / missing key
 */
export async function parseWithLLM(
  text: string,
  termContext: string
): Promise<ParsedItem[]> {
  // Feature gate — no key, no LLM
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }

  const truncatedText = text.slice(0, MAX_TEXT_CHARS);

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema: llmOutputSchema }),
      prompt: [
        "Extract all assignments, exams, and readings from this course syllabus.",
        `Term context: ${termContext}.`,
        "For each item extract: title, type (assignment/exam/reading/other),",
        "due date (ISO date string YYYY-MM-DD or null), estimated minutes to complete (or null),",
        "and whether parsing was uncertain (needsReview boolean) and confidence level.",
        "",
        "Syllabus text:",
        truncatedText,
      ].join("\n"),
    });

    const parsed = experimental_output;

    if (!parsed?.items) return [];

    // Map to ParsedItem, generating fresh UUIDs
    return parsed.items.map(
      (item): ParsedItem => ({
        id: crypto.randomUUID(),
        title: item.title,
        type: item.type,
        dueDate: item.dueDate ?? null,
        estimatedMinutes: item.estimatedMinutes ?? null,
        points: null,
        weight: null,
        needsReview: item.needsReview,
        confidence: item.confidence,
        source: "llm",
      })
    );
  } catch (err) {
    if (err instanceof NoObjectGeneratedError) {
      console.warn("[parseWithLLM] NoObjectGeneratedError — falling back to rule-based only");
    } else {
      console.error("[parseWithLLM] Unexpected error:", err);
    }
    return [];
  }
}
