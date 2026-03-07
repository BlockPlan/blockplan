import { generateText, Output, NoObjectGeneratedError } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  studyHelpSchema,
  buildRegenerateSchema,
  type StudyHelp,
  type RegeneratableSection,
} from "./types";
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

  const sourceDescription = "text and/or images of textbook pages.";

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

// ---------------------------------------------------------------------------
// Regenerate specific sections with different questions
// ---------------------------------------------------------------------------

/**
 * Regenerate flashcards, quiz, and/or practice test for an existing session.
 * Uses the session's summary + key terms as source context, and instructs
 * the AI to produce different questions from the existing ones.
 */
export async function regenerateStudyHelp(
  existingData: StudyHelp,
  sections: RegeneratableSection[],
  courseName?: string
): Promise<{ data: Partial<StudyHelp>; isMock: boolean }> {
  if (!process.env.OPENAI_API_KEY) {
    const mock = getMockStudyHelp();
    const partial: Partial<StudyHelp> = {};
    for (const s of sections) partial[s] = mock[s] as never;
    return { data: partial, isMock: true };
  }

  const courseContext = courseName ? `Course: ${courseName}. ` : "";

  // Build context from existing summary + key terms
  const summaryText = existingData.summary.join("\n- ");
  const keyTermsText = existingData.keyTerms
    .map((kt) => `${kt.term}: ${kt.definition}`)
    .join("\n");

  // Build list of existing questions to avoid
  const existingQuestions: string[] = [];
  if (sections.includes("flashcards")) {
    existingData.flashcards.forEach((f) =>
      existingQuestions.push(`Flashcard: ${f.front}`)
    );
  }
  if (sections.includes("quiz")) {
    existingData.quiz.forEach((q) =>
      existingQuestions.push(`Quiz: ${q.question}`)
    );
  }
  if (sections.includes("practiceTest")) {
    existingData.practiceTest.forEach((q) =>
      existingQuestions.push(`Practice: ${q.question}`)
    );
  }

  const sectionInstructions: string[] = [];
  if (sections.includes("flashcards")) {
    sectionInstructions.push(
      "flashcards: 10-15 NEW flashcards with front (question/term) and back (answer/definition)"
    );
  }
  if (sections.includes("quiz")) {
    sectionInstructions.push(
      "quiz: 8-12 NEW multiple-choice questions, each with exactly 4 options, correctIndex (0-3), and explanation"
    );
  }
  if (sections.includes("practiceTest")) {
    sectionInstructions.push(
      "practiceTest: 6-10 NEW open-ended questions mixing recall, conceptual, and application types, each with a suggestedAnswer"
    );
  }

  const systemMessage = [
    "You are a study aid generator for college students.",
    courseContext,
    "Using the summary and key terms below as source material, generate NEW study questions.",
    "",
    "CRITICAL: Generate DIFFERENT questions from the existing ones listed below. Cover the same topics but ask about different aspects, use different phrasing, and test different details.",
    "",
    "IMPORTANT: Generate study aids only. Do not provide answers to graded assignments.",
    "",
    `Generate the following:\n${sectionInstructions.map((s, i) => `${i + 1}. ${s}`).join("\n")}`,
  ].join("\n");

  const userMessage = [
    "## Source Material\n",
    "### Summary\n- " + summaryText,
    "\n### Key Terms\n" + keyTermsText,
    "\n## Existing Questions (generate DIFFERENT ones)\n" +
      existingQuestions.join("\n"),
  ].join("\n");

  const schema = buildRegenerateSchema(sections);

  try {
    const { experimental_output } = await generateText({
      model: openai("gpt-4o-mini"),
      experimental_output: Output.object({ schema }),
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
    });

    if (!experimental_output) {
      const mock = getMockStudyHelp();
      const partial: Partial<StudyHelp> = {};
      for (const s of sections) partial[s] = mock[s] as never;
      return { data: partial, isMock: true };
    }

    return { data: experimental_output as Partial<StudyHelp>, isMock: false };
  } catch (err) {
    if (err instanceof NoObjectGeneratedError) {
      console.warn("[regenerateStudyHelp] NoObjectGeneratedError — returning mock");
    } else {
      console.error("[regenerateStudyHelp] Unexpected error:", err);
    }
    const mock = getMockStudyHelp();
    const partial: Partial<StudyHelp> = {};
    for (const s of sections) partial[s] = mock[s] as never;
    return { data: partial, isMock: true };
  }
}
