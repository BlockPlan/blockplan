# Phase 6: Study Sessions - Research

**Researched:** 2026-03-02
**Domain:** LLM-powered study aid generation (summaries, key terms, practice questions)
**Confidence:** HIGH

## Summary

Phase 6 adds an LLM-powered study session feature for exam and reading tasks. Users paste notes or chapter headings, and the system generates a bullet-point summary, key terms list, and 8-12 practice questions. The implementation follows the exact same AI SDK + OpenAI pattern already established in `lib/syllabus/parser-llm.ts` — feature-flagged on `OPENAI_API_KEY`, using `generateText` with `Output.object` for structured output via Zod schemas.

The primary technical challenge is straightforward: a new route (`/study`), a server action that calls the LLM with a structured output schema, and a mock mode that returns deterministic content when no API key is configured. The safety guardrail (no graded assignment answers) is enforced via the system prompt and by restricting the study session entry point to exam/reading task types only.

**Primary recommendation:** Follow the parser-llm.ts pattern exactly — same AI SDK imports, same Zod schema approach, same feature-gate pattern. Add a new route with a textarea for input and three output sections.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- "Start Study Session" button on exam and reading task cards (in task list or daily view)
- Route: `/study?task_id={id}` or `/study/{taskId}`
- User pastes notes or chapter headings into a textarea
- Click "Generate" to produce study aids
- Three output sections: Summary (bullets), Key Terms (term + definition pairs), Practice Questions (8-12 mixed recall + conceptual)
- User can regenerate with same or different input
- No persistence of study session content to database (ephemeral)
- Feature-flagged on `OPENAI_API_KEY` environment variable (same pattern as syllabus LLM parser)
- When LLM available: send notes to AI with structured output prompt
- Use AI SDK `generateObject` / `Output.object` pattern (same as parser-llm.ts)
- System prompt explicitly instructs: no answers to graded assignments, no essay content, study aids only
- When no `OPENAI_API_KEY` is configured, return deterministic mock output
- Mock output: generic study summary, sample key terms, sample practice questions
- Mock output should be clearly labeled as "Mock mode — configure OpenAI API key for real study aids"
- Mock mode allows the full UI to be tested without API costs
- Only available for exam and reading task types (not assignment or other)
- System prompt includes ethical boundary: "Generate study aids only. Do not provide answers to graded assignments, write essays, or complete homework."
- If user tries to start study session for an assignment task, show message explaining it's only for exam/reading prep

### Claude's Discretion
- Exact UI layout for study session page
- LLM prompt engineering for quality output
- Mock mode content (realistic but clearly labeled)
- Whether to stream LLM output or wait for complete response
- Practice question format (multiple choice, short answer, mix)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| STDY-01 | User can start a study session for exam or reading tasks | Route `/study?task_id={id}`, button on exam/reading task cards, task type validation |
| STDY-02 | User can paste notes or chapter headings as study input | Textarea component on study page, text passed to server action |
| STDY-03 | System generates brief bullet-point summary from pasted content | AI SDK `generateText` + `Output.object` with Zod schema for summary bullets |
| STDY-04 | System generates key terms list from pasted content | Same structured output schema includes key terms array |
| STDY-05 | System generates 8-12 practice questions from pasted content | Schema includes questions array with min/max constraints in prompt |
| STDY-06 | Study session works in mock mode when no LLM API key is set | Feature-gate pattern from parser-llm.ts; return deterministic mock data |
| STDY-07 | No solutions for graded assignments or essay completion are provided | System prompt guardrail + task type restriction (exam/reading only) |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (AI SDK) | ^6.0.105 | LLM integration with structured output | Already in project, `generateText` + `Output.object` pattern proven |
| @ai-sdk/openai | ^3.0.37 | OpenAI provider for AI SDK | Already in project, same provider used by parser-llm.ts |
| zod | ^3.25.76 | Schema definition for structured LLM output | Already in project, used for all validations |
| next | 16.1.6 | App Router, Server Actions, route handling | Already in project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react | 19.2.3 | UI components | Study session page components |
| tailwindcss | ^4 | Styling | Consistent with existing UI |

**No new dependencies required.** Everything needed is already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── study/
│   ├── page.tsx                    # Study session page (client component for interactivity)
│   ├── actions.ts                  # Server action: generateStudyAids
│   └── _components/
│       └── StudySession.tsx        # Main study session UI component
lib/
├── study/
│   ├── generate.ts                 # LLM call (follows parser-llm.ts pattern)
│   ├── mock.ts                     # Mock mode deterministic output
│   └── types.ts                    # Zod schemas + TypeScript types
```

### Pattern 1: Feature-Gated LLM Call
**What:** Check `OPENAI_API_KEY` at the start of the function; return mock data if missing
**When to use:** Every LLM-dependent function
**Example:**
```typescript
// Follows exact pattern from lib/syllabus/parser-llm.ts
export async function generateStudyAids(notes: string): Promise<StudyAids> {
  if (!process.env.OPENAI_API_KEY) {
    return getMockStudyAids();
  }
  // ... LLM call with generateText + Output.object
}
```

### Pattern 2: Structured Output with Zod
**What:** Define Zod schema for expected LLM output, use `Output.object({ schema })`
**When to use:** When LLM output needs to be typed and validated
**Example:**
```typescript
const studyAidsSchema = z.object({
  summary: z.array(z.string()),           // bullet points
  keyTerms: z.array(z.object({
    term: z.string(),
    definition: z.string(),
  })),
  questions: z.array(z.object({
    question: z.string(),
    type: z.enum(["recall", "conceptual"]),
  })),
});
```

### Pattern 3: Server Action with Form State
**What:** Server action called from client component, returns structured result
**When to use:** Study session generation triggered by user click
**Example:**
```typescript
// app/study/actions.ts
"use server";
export async function generateStudyAidsAction(formData: FormData) {
  const notes = formData.get("notes") as string;
  const taskId = formData.get("taskId") as string;
  // Validate task is exam or reading type
  // Call generateStudyAids(notes)
  // Return result
}
```

### Pattern 4: Task Type Validation
**What:** Query the task to verify it's exam or reading type before allowing study session
**When to use:** Both at the entry point (button visibility) and in the server action
**Example:**
```typescript
const { data: task } = await supabase
  .from("tasks")
  .select("id, type")
  .eq("id", taskId)
  .single();

if (!task || !["exam", "reading"].includes(task.type)) {
  return { error: "Study sessions are only available for exam and reading tasks" };
}
```

### Anti-Patterns to Avoid
- **Persisting study content to DB:** Context decisions say ephemeral — no database tables for study sessions
- **Allowing all task types:** Only exam and reading — must validate on server side, not just UI
- **Client-side LLM calls:** Always use Server Actions — API key must stay server-side
- **Generating essay content or assignment answers:** System prompt must explicitly forbid this

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| LLM structured output | Custom JSON parsing of LLM text | AI SDK `Output.object` + Zod | Handles retries, validation, type safety |
| LLM error handling | Custom try/catch for every error type | AI SDK's `NoObjectGeneratedError` | Standard error type, consistent with parser-llm.ts |
| Form state management | Custom useState for loading/error/result | React `useActionState` or `useTransition` | Built-in, handles pending states |

## Common Pitfalls

### Pitfall 1: Missing Server-Side Task Type Validation
**What goes wrong:** Only checking task type on the client; user can craft a request to bypass
**Why it happens:** Developer relies on button visibility as the only guard
**How to avoid:** Validate task type in the server action before calling LLM
**Warning signs:** No task type check in actions.ts

### Pitfall 2: Forgetting NoObjectGeneratedError Handling
**What goes wrong:** Unhandled error when LLM fails to produce valid structured output
**Why it happens:** AI SDK throws a specific error type when output doesn't match schema
**How to avoid:** Catch `NoObjectGeneratedError` separately (same as parser-llm.ts)
**Warning signs:** Generic catch block without specific AI SDK error handling

### Pitfall 3: Mock Mode Not Clearly Labeled
**What goes wrong:** Users think they're getting real AI-generated content when it's mock data
**Why it happens:** Mock output looks plausible
**How to avoid:** Include a visible banner: "Mock mode — configure OpenAI API key for real study aids"
**Warning signs:** No `isMock` flag returned from the server action

### Pitfall 4: System Prompt Leaking Assignment Answers
**What goes wrong:** LLM generates content that could be used as assignment submissions
**Why it happens:** System prompt not explicit enough about boundaries
**How to avoid:** System prompt must say: "Generate study aids only. Do not provide answers to graded assignments, write essays, or complete homework. Focus on comprehension, recall, and conceptual understanding."
**Warning signs:** No ethical boundary in system prompt text

### Pitfall 5: Text Too Long for LLM Context
**What goes wrong:** User pastes very long notes that exceed context window
**Why it happens:** No truncation or length validation
**How to avoid:** Truncate input (similar to MAX_TEXT_CHARS in parser-llm.ts) and inform user
**Warning signs:** No character limit on textarea or server-side truncation

## Code Examples

### LLM Study Aid Generation
```typescript
// lib/study/generate.ts — follows parser-llm.ts pattern exactly
import { generateText, Output, NoObjectGeneratedError } from "ai";
import { openai } from "@ai-sdk/openai";
import { studyAidsSchema, type StudyAids } from "./types";
import { getMockStudyAids } from "./mock";

const MAX_NOTES_CHARS = 12_000;

export async function generateStudyAids(notes: string): Promise<{
  data: StudyAids;
  isMock: boolean;
}> {
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
        "Generate study aids only. Do not provide answers to graded assignments, write essays, or complete homework.",
        "Focus on comprehension, recall, and conceptual understanding.",
        "",
        "Generate:",
        "1. A bullet-point summary (5-10 key points)",
        "2. Key terms with brief definitions",
        "3. 8-12 practice questions mixing recall and conceptual types",
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
      console.warn("[generateStudyAids] NoObjectGeneratedError — returning mock");
    } else {
      console.error("[generateStudyAids] Unexpected error:", err);
    }
    return { data: getMockStudyAids(), isMock: true };
  }
}
```

### Mock Mode Output
```typescript
// lib/study/mock.ts
import type { StudyAids } from "./types";

export function getMockStudyAids(): StudyAids {
  return {
    summary: [
      "Key concept 1: Overview of the main topic and its significance",
      "Key concept 2: Important relationships between subtopics",
      "Key concept 3: Critical dates, figures, or formulas to remember",
      "Key concept 4: Common applications and real-world examples",
      "Key concept 5: Summary of major themes and takeaways",
    ],
    keyTerms: [
      { term: "Sample Term 1", definition: "A placeholder definition for demonstration purposes" },
      { term: "Sample Term 2", definition: "Another example definition showing the expected format" },
      { term: "Sample Term 3", definition: "Third example term with its corresponding definition" },
    ],
    questions: [
      { question: "What are the main concepts covered in this material?", type: "recall" },
      { question: "How does concept A relate to concept B?", type: "conceptual" },
      { question: "List three key facts from the reading material.", type: "recall" },
      { question: "Why is this topic significant in the broader context?", type: "conceptual" },
      { question: "Define the primary term discussed in the notes.", type: "recall" },
      { question: "Compare and contrast the two main approaches described.", type: "conceptual" },
      { question: "What evidence supports the main argument?", type: "recall" },
      { question: "How would you apply this concept to a new situation?", type: "conceptual" },
    ],
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `generateObject` direct | `generateText` + `Output.object` | AI SDK v4+ | Unified API, better error handling |
| Custom JSON parsing | Zod schema validation | AI SDK v3+ | Type-safe structured output |

## Open Questions

1. **Streaming vs. waiting for complete response**
   - What we know: AI SDK supports both `generateText` (complete) and `streamText` (streaming)
   - What's unclear: Whether streaming improves UX enough to justify complexity
   - Recommendation: Start with `generateText` (simpler, matches parser-llm.ts pattern). Can upgrade to streaming later if generation feels slow.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `lib/syllabus/parser-llm.ts` — proven AI SDK + Output.object pattern
- Existing codebase: `package.json` — confirmed ai@^6.0.105, @ai-sdk/openai@^3.0.37 already installed
- Existing codebase: `app/plan/actions.ts`, `app/tasks/actions.ts` — Server Action patterns

### Secondary (MEDIUM confidence)
- AI SDK documentation — `generateText`, `Output.object`, `NoObjectGeneratedError` APIs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in the project, pattern proven
- Architecture: HIGH - follows exact same pattern as parser-llm.ts
- Pitfalls: HIGH - based on actual codebase patterns and common AI SDK issues

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable — no new dependencies, proven patterns)
