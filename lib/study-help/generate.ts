import { generateText, Output, NoObjectGeneratedError } from "ai";
import { openai } from "@ai-sdk/openai";
import { studyHelpSchema, type StudyHelp } from "./types";
import { getMockStudyHelp } from "./mock";

// Maximum characters for text content sent to the LLM
const MAX_TEXT_CHARS = 15_000;

// ---------------------------------------------------------------------------
// Content part types — supports multi-modal input (text + images)
// ---------------------------------------------------------------------------

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string }; // base64 data URL

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate comprehensive study help (summary, key terms, flashcards, quiz,
 * practice test) from multi-modal content.
 *
 * Feature-gated: returns deterministic mock output when OPENAI_API_KEY is
 * not set so the app functions without LLM integration.
 *
 * @param contentParts - Array of text and/or image content parts
 * @param courseName - Optional course name for context
 * @returns Study help data and whether mock mode was used
 */
export async function generateStudyHelp(
  contentParts: ContentPart[],
  courseName?: string
): Promise<{ data: StudyHelp; isMock: boolean }> {
  // Feature gate — no key, no LLM
  if (!process.env.OPENAI_API_KEY) {
    return { data: getMockStudyHelp(), isMock: true };
  }

  if (contentParts.length === 0) {
    return { data: getMockStudyHelp(), isMock: true };
  }

  const courseContext = courseName ? `Course: ${courseName}. ` : "";

  // Detect if any content is a video transcript
  const hasVideoTranscript = contentParts.some(
    (p) => p.type === "text" && p.text.startsWith("[YouTube Video Transcript]")
  );

  const sourceDescription = hasVideoTranscript
    ? "content that may include YouTube video transcripts, text notes, and/or images of textbook pages. Video transcripts are auto-generated captions — they may contain filler words, repeated phrases, and informal language. Focus on extracting the actual educational content, key concepts, and factual information from the transcript rather than following its exact wording."
    : "text and/or images of textbook pages.";

  const systemMessage = [
    "You are a study aid generator for college students.",
    courseContext,
    `Generate comprehensive study materials from the provided ${sourceDescription}`,
    "",
    "IMPORTANT: Generate study aids only. Do not provide answers to graded assignments, write essays, or complete homework. Focus on comprehension, recall, and conceptual understanding.",
    "",
    "Generate ALL of the following:",
    "1. summary: 5-10 bullet points capturing the most important ideas",
    "2. keyTerms: important terms with brief, clear definitions",
    "3. flashcards: 10-15 flashcards with front (question/term) and back (answer/definition). Each flashcard should test a specific fact, concept, or definition from the material.",
    "4. quiz: 8-12 multiple-choice questions, each with exactly 4 options, correctIndex (0-3), and a brief explanation of why the answer is correct. Questions should test understanding of the actual content.",
    "5. practiceTest: 6-10 open-ended questions mixing recall, conceptual, and application types, each with a suggestedAnswer",
  ].join("\n");

  // Truncate text parts to stay within context limits, keep image parts as-is
  const userParts = contentParts.map((part) => {
    if (part.type === "text") {
      return { type: "text" as const, text: part.text.slice(0, MAX_TEXT_CHARS) };
    }
    return part;
  });

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema: studyHelpSchema }),
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userParts },
      ],
    });

    if (!experimental_output) {
      return { data: getMockStudyHelp(), isMock: true };
    }

    return { data: experimental_output, isMock: false };
  } catch (err) {
    if (err instanceof NoObjectGeneratedError) {
      console.warn("[generateStudyHelp] NoObjectGeneratedError — returning mock");
    } else {
      console.error("[generateStudyHelp] Unexpected error:", err);
    }
    return { data: getMockStudyHelp(), isMock: true };
  }
}
