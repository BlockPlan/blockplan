import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schema for LLM structured output — comprehensive study help
// ---------------------------------------------------------------------------

export const studyHelpSchema = z.object({
  summary: z.array(z.string()).describe("5-10 bullet points capturing key ideas"),

  keyTerms: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    })
  ).describe("Important terms with clear definitions"),

  flashcards: z.array(
    z.object({
      front: z.string().describe("Question or term"),
      back: z.string().describe("Answer or definition"),
    })
  ).describe("10-15 flashcards for active recall practice"),

  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().int().min(0).max(3),
      explanation: z.string(),
    })
  ).describe("8-12 multiple-choice questions"),

  practiceTest: z.array(
    z.object({
      question: z.string(),
      type: z.enum(["recall", "conceptual", "application"]),
      suggestedAnswer: z.string(),
    })
  ).describe("6-10 open-ended practice test questions"),
});

// Inferred TypeScript types
export type StudyHelp = z.infer<typeof studyHelpSchema>;
export type Flashcard = StudyHelp["flashcards"][number];
export type MultipleChoice = StudyHelp["quiz"][number];
export type PracticeTestQuestion = StudyHelp["practiceTest"][number];
