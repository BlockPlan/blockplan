import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schema for LLM structured output — study aids
// ---------------------------------------------------------------------------

export const studyAidsSchema = z.object({
  summary: z.array(z.string()),
  keyTerms: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    })
  ),
  questions: z.array(
    z.object({
      question: z.string(),
      type: z.enum(["recall", "conceptual"]),
    })
  ),
});

// Inferred TypeScript type
export type StudyAids = z.infer<typeof studyAidsSchema>;
