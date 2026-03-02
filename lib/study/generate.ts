import { generateText, Output, NoObjectGeneratedError } from "ai";
import { openai } from "@ai-sdk/openai";
import { studyAidsSchema, type StudyAids } from "./types";
import { getMockStudyAids } from "./mock";

// Maximum characters sent to the LLM to stay within context limits
const MAX_NOTES_CHARS = 12_000;

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate study aids (summary, key terms, practice questions) from notes.
 *
 * Feature-gated: returns deterministic mock output when OPENAI_API_KEY is
 * not set so the app functions without LLM integration.
 *
 * @param notes - User-pasted notes or chapter headings (truncated to 12,000 chars)
 * @returns Study aids data and whether mock mode was used
 */
export async function generateStudyAids(
  notes: string
): Promise<{ data: StudyAids; isMock: boolean }> {
  // Feature gate — no key, no LLM
  if (!process.env.OPENAI_API_KEY) {
    return { data: getMockStudyAids(), isMock: true };
  }

  const truncated = notes.slice(0, MAX_NOTES_CHARS);

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema: studyAidsSchema }),
      prompt: [
        "You are a study aid generator. Generate study materials from the following notes.",
        "",
        "IMPORTANT: Generate study aids only. Do not provide answers to graded assignments, write essays, or complete homework. Focus on comprehension, recall, and conceptual understanding.",
        "",
        "Generate the following:",
        "1. A bullet-point summary with 5-10 key points capturing the most important ideas",
        "2. Key terms with brief, clear definitions",
        "3. 8-12 practice questions mixing recall (factual) and conceptual (analytical) types",
        "",
        "Notes:",
        truncated,
      ].join("\n"),
    });

    if (!experimental_output) {
      return { data: getMockStudyAids(), isMock: true };
    }

    return { data: experimental_output, isMock: false };
  } catch (err) {
    if (err instanceof NoObjectGeneratedError) {
      console.warn(
        "[generateStudyAids] NoObjectGeneratedError — returning mock"
      );
    } else {
      console.error("[generateStudyAids] Unexpected error:", err);
    }
    return { data: getMockStudyAids(), isMock: true };
  }
}
