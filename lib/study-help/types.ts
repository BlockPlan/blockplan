import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schema for LLM structured output — comprehensive study help
// ---------------------------------------------------------------------------

// Schema used for OpenAI structured output generation (all fields required — OpenAI limitation)
export const studyHelpGenerationSchema = z.object({
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

  eli5Summary: z.array(z.string()).describe("Simplified 'Explain Like I'm 5' version of the summary using everyday analogies"),

  eli5KeyTerms: z.array(
    z.object({
      term: z.string(),
      definition: z.string().describe("Simple, analogy-rich definition a child could understand"),
    })
  ).describe("Simplified key terms with everyday analogies"),

  practiceProblems: z.array(
    z.object({
      question: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
      steps: z.array(z.string()).describe("Step-by-step solution walkthrough"),
      finalAnswer: z.string(),
    })
  ).describe("4-6 step-by-step practice problems with varying difficulty"),
});

// Storage schema — optional fields for data that may not exist on older sessions
export const studyHelpSchema = studyHelpGenerationSchema.extend({
  eli5Summary: z.array(z.string()).optional(),
  eli5KeyTerms: z.array(z.object({ term: z.string(), definition: z.string() })).optional(),
  practiceProblems: z.array(z.object({
    question: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    steps: z.array(z.string()),
    finalAnswer: z.string(),
  })).optional(),
  diagrams: z.array(
    z.object({
      type: z.enum(["mindmap", "flowchart", "conceptMap", "infographic"]),
      title: z.string().describe("Short descriptive title for the diagram"),
      mermaidCode: z.string().describe("Valid Mermaid.js syntax or JSON content for the diagram"),
    })
  ).optional(),
});

// Inferred TypeScript types
export type StudyHelp = z.infer<typeof studyHelpSchema>;
export type Flashcard = StudyHelp["flashcards"][number];
export type MultipleChoice = StudyHelp["quiz"][number];
export type PracticeTestQuestion = StudyHelp["practiceTest"][number];
export type PracticeProblem = NonNullable<StudyHelp["practiceProblems"]>[number];
export type Diagram = NonNullable<StudyHelp["diagrams"]>[number];
export type DiagramType = Diagram["type"];

// ---------------------------------------------------------------------------
// Partial schema for regenerating specific sections only
// ---------------------------------------------------------------------------

export type RegeneratableSection = "flashcards" | "quiz" | "practiceTest" | "practiceProblems";

export function buildRegenerateSchema(sections: RegeneratableSection[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  if (sections.includes("flashcards")) {
    shape.flashcards = studyHelpSchema.shape.flashcards;
  }
  if (sections.includes("quiz")) {
    shape.quiz = studyHelpSchema.shape.quiz;
  }
  if (sections.includes("practiceTest")) {
    shape.practiceTest = studyHelpSchema.shape.practiceTest;
  }
  if (sections.includes("practiceProblems")) {
    shape.practiceProblems = z.array(
      z.object({
        question: z.string(),
        difficulty: z.enum(["easy", "medium", "hard"]),
        steps: z.array(z.string()),
        finalAnswer: z.string(),
      })
    );
  }
  return z.object(shape);
}
