# Phase 3: Syllabus Pipeline - Research

**Researched:** 2026-03-01
**Domain:** PDF upload, server-side text extraction, rule-based + LLM-assisted parsing, extraction review UI
**Confidence:** HIGH (core stack verified via live docs; patterns verified against official sources)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Upload Flow:**
- Upload from the onboarding wizard Step 4 ("Upload Syllabi" card, currently disabled) AND from a dedicated `/syllabi/upload` route accessible post-onboarding
- One PDF per course — user selects which course the syllabus belongs to
- PDF stored in Supabase Storage `syllabi` bucket under `{user_id}/{course_id}/{filename}`
- File size limit: 10MB (reasonable for syllabus PDFs)
- Upload progress indicator shown during upload
- After successful upload, automatically trigger text extraction and parsing
- Redirect to extraction review screen when parsing completes

**Text Extraction:**
- Use `unpdf` package (serverless-compatible, chosen in Phase 1 research over `pdf-parse`)
- Extract text server-side via Next.js API route or Server Action
- Handle extraction failures gracefully — show error message, let user retry or enter tasks manually
- No OCR for scanned PDFs in MVP — show clear message if no text extracted

**Parsing Strategy:**
- Rule-based parser (always available): Regex patterns for common syllabus formats
  - Detect date patterns (Month Day, MM/DD, etc.) and infer year from term dates
  - Identify assignment keywords (homework, assignment, quiz, project, paper, essay)
  - Identify exam keywords (exam, midterm, final, test)
  - Identify reading keywords (read, chapter, pages)
  - Extract points/weight if present (e.g., "50 points", "10%")
- LLM-assisted parser (feature-flagged): When `OPENAI_API_KEY` env var is set
  - Send extracted text to LLM with structured output prompt
  - LLM returns JSON array of parsed items
  - Merge/deduplicate with rule-based results
  - Mark LLM-only items with higher confidence than rule-based-only items
- Items with low confidence or ambiguous parsing flagged as `needs_review: true`
- Parser output is an intermediate format — not yet saved to `tasks` table

**Extraction Review Screen:**
- Route: `/syllabi/review?course_id={id}`
- Shows all parsed items in an editable list/table
- Each item shows: title, type (assignment/exam/reading/other), due date, estimated minutes, confidence indicator
- Items flagged as "needs review" highlighted with a warning badge
- User can: Edit any field inline or via edit form, Delete items they don't want, Add new items the parser missed, Change item type
- "Confirm All" button saves all reviewed items to the `tasks` table
- After confirmation, redirect to `/tasks` filtered by that course

### Claude's Discretion
- Exact regex patterns for rule-based parser
- LLM prompt engineering for structured extraction
- Extraction review UI layout (table vs cards vs list)
- Confidence scoring algorithm
- Error handling UX for failed extractions
- Whether to show raw extracted text to user
- Upload component styling

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SYLL-01 | User can upload a PDF syllabus per course | Signed URL upload pattern bypasses Vercel 4.5MB limit; client uploads directly to Supabase Storage; server generates signed URL |
| SYLL-02 | System extracts text from uploaded PDF on the server (no LLM required) | `unpdf@1.4.0` with `extractText(pdf, { mergePages: true })` in a Route Handler or Server Action called after upload completes |
| SYLL-03 | System parses extracted text to identify assignments | Rule-based regex engine with keyword detection + `chrono-node` for date extraction; confidence scoring per item |
| SYLL-04 | System parses extracted text to identify exams | Same rule-based engine; exam keyword list (exam, midterm, final, test) |
| SYLL-05 | System parses extracted text to identify readings | Same rule-based engine; reading keyword list (read, chapter, pages pp.) |
| SYLL-06 | LLM-assisted parsing available when API key is configured | Vercel AI SDK `generateText` with `Output.object()` and Zod schema; feature-gated on `process.env.OPENAI_API_KEY` |
| SYLL-07 | User sees extraction review screen showing all parsed items before they become tasks | `/syllabi/review?course_id={id}` — parsed items in session/URL state or temporary DB table; NOT saved to tasks yet |
| SYLL-08 | User can edit any parsed item before confirming | Per-item edit form matching existing TaskForm pattern; inline or modal |
| SYLL-09 | User can delete parsed items they don't want | Client-side array mutation before confirmation; no DB write until Confirm All |
| SYLL-10 | User can add items the parser missed on the review screen | Same form as edit; adds to client-side array |
| SYLL-11 | Items with uncertain parsing are flagged as "needs review" | `needs_review: boolean` in intermediate parsed item type; warning badge on review screen; tasks table already has `needs_review` column |
</phase_requirements>

---

## Summary

Phase 3 has three sequential steps: (1) PDF upload to Supabase Storage, (2) server-side text extraction and parsing, (3) user review and confirmation. The most critical technical constraint discovered in research is **Vercel's hard 4.5MB body size limit** on serverless functions — PDFs up to 10MB cannot pass through a Next.js Route Handler body. The correct pattern is a signed URL upload: the server generates a short-lived upload token, the client uploads the file directly to Supabase Storage, then the client calls a separate server endpoint to trigger extraction.

The `unpdf@1.4.0` library is the correct tool for extraction, wrapping pdfjs-dist in a serverless-compatible bundle. It handles empty text gracefully (returns empty string for scanned/image-only PDFs) and provides per-page extraction. For date parsing, `chrono-node@2.9.0` is the right tool for converting extracted text like "Due April 15" into actual Date objects, using the term's start date as the `instant` reference to correctly infer year. The Vercel AI SDK's `generateText` with `Output.object()` is the current pattern for LLM structured extraction in AI SDK v6 (not `generateObject` which was renamed/merged).

The review screen should hold parsed items in client-side React state (not committed to the tasks table) so users can freely edit, delete, and add without triggering DB writes. On "Confirm All," a single Server Action batch-inserts all items into `tasks`. The tasks table already has `needs_review` and `points`/`weight` columns from the initial schema, so no migration is needed.

**Primary recommendation:** Use a two-step upload flow (signed URL → client upload → server extraction trigger) to stay within Vercel limits. Hold parsed items in client state on the review screen. Batch-insert to tasks only on Confirm All.

---

## Standard Stack

### Core (already in package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.1.6 | Route Handlers for extraction, Server Actions for task creation | Already installed; Route Handler for multipart-adjacent pattern |
| `@supabase/supabase-js` | ^2.98.0 | Storage upload + signed URLs + tasks insert | Already installed; `createSignedUploadUrl` method handles the upload flow |
| `@supabase/ssr` | ^0.8.0 | Server-side Supabase client with user session | Already installed; required for user-scoped signed URL generation |
| `zod` | ^3.25.76 | Schema validation for parsed item types and LLM output | Already installed at v3 (project uses v3 throughout — DO NOT upgrade to v4 mid-project) |

### New Dependencies for Phase 3
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|-------------|
| `unpdf` | 1.4.0 | Server-side PDF text extraction | Serverless-compatible, wraps pdfjs-dist v5, no native binaries, chosen in Phase 1 research |
| `chrono-node` | 2.9.0 | Natural language date parsing from syllabus text | Handles "Due April 15", "Week 3 Monday", "MM/DD" patterns; reference date support for year inference |
| `ai` | 6.0.105 | Vercel AI SDK for LLM structured output | `generateText` with `Output.object()` for JSON-validated LLM extraction |
| `@ai-sdk/openai` | 3.0.37 | OpenAI provider for Vercel AI SDK | Pairs with `ai`; gpt-4o-mini for cost-effective parsing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | 4.1.0 | Date arithmetic for validation | Validate extracted due dates fall within term range; format dates for display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Signed URL client upload | Server-side Route Handler upload | Route Handler is simpler but hard-blocked by Vercel 4.5MB limit for 10MB PDFs |
| `chrono-node` for date parsing | Pure regex date parsing | Regex handles MM/DD and "Month Day" well but fails on relative expressions ("next Friday", "Week 3"); chrono-node handles both |
| Vercel AI SDK `Output.object()` | Raw `openai` SDK | Raw SDK requires manual JSON parsing; AI SDK validates against Zod schema automatically |
| Client-side state for review items | Temporary DB table | DB table adds round-trips and cleanup complexity; client state is simpler for the single-session review flow |

**Installation:**
```bash
npm install unpdf@1.4.0 chrono-node@2.9.0 ai@6.0.105 @ai-sdk/openai@3.0.37 date-fns@4.1.0
```

---

## Architecture Patterns

### Recommended Project Structure

```
app/
├── api/
│   ├── syllabi/
│   │   ├── upload-url/route.ts     # POST: generate signed upload URL
│   │   └── extract/route.ts        # POST: extract text + parse after upload
├── syllabi/
│   ├── upload/
│   │   └── page.tsx                # Standalone upload page (post-onboarding)
│   └── review/
│       └── page.tsx                # Review screen (client component with state)
├── onboarding/
│   └── _components/
│       └── StepNextAction.tsx      # Enable Upload Syllabi card (already exists, currently disabled)
lib/
├── syllabus/
│   ├── extract.ts                  # unpdf text extraction wrapper
│   ├── parser-rule-based.ts        # Regex + chrono-node rule-based parser
│   ├── parser-llm.ts               # Vercel AI SDK LLM parser (feature-flagged)
│   ├── parser-merge.ts             # Merge + deduplicate rule-based and LLM results
│   └── types.ts                    # ParsedItem, ConfidenceLevel, ParserResult types
├── validations/
│   └── syllabus.ts                 # Zod schemas for upload request + parsed items
```

### Pattern 1: Two-Step Signed URL Upload (CRITICAL — bypasses Vercel 4.5MB limit)

**What:** Client requests a signed upload URL from the server, uploads directly to Supabase Storage, then notifies server to trigger extraction.

**Why critical:** Vercel serverless functions (including Next.js Route Handlers) have a hard **4.5MB request body limit**. The project allows 10MB PDFs. Routing the file through the server will fail silently or return a 413 error on real syllabi.

**Step 1 — Server generates signed URL:**
```typescript
// app/api/syllabi/upload-url/route.ts
// Source: https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseId, filename } = await request.json();

  // Validate courseId belongs to user
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('user_id', user.id)
    .single();
  if (!course) return NextResponse.json({ error: 'Invalid course' }, { status: 403 });

  const storagePath = `${user.id}/${courseId}/${Date.now()}-${filename}`;
  const { data, error } = await supabase.storage
    .from('syllabi')
    .createSignedUploadUrl(storagePath);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ signedUrl: data.signedUrl, path: storagePath });
}
```

**Step 2 — Client uploads directly to Supabase (bypasses Vercel):**
```typescript
// Client-side upload component
async function uploadSyllabus(file: File, courseId: string) {
  // Get signed URL from server
  const { signedUrl, path } = await fetch('/api/syllabi/upload-url', {
    method: 'POST',
    body: JSON.stringify({ courseId, filename: file.name }),
    headers: { 'Content-Type': 'application/json' },
  }).then(r => r.json());

  // Upload directly to Supabase — BYPASSES Vercel function entirely
  await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': 'application/pdf' },
  });

  return path; // storage path for extraction trigger
}
```

**Step 3 — Client triggers server extraction (small JSON payload, well under 4.5MB):**
```typescript
// After upload, call extraction endpoint with just the storage path
const result = await fetch('/api/syllabi/extract', {
  method: 'POST',
  body: JSON.stringify({ storagePath, courseId }),
  headers: { 'Content-Type': 'application/json' },
});
```

### Pattern 2: unpdf Text Extraction

**What:** Download the PDF from Supabase Storage server-side, extract text with unpdf.

```typescript
// lib/syllabus/extract.ts
// Source: https://github.com/unjs/unpdf (verified 2026-03-01)
import { extractText, getDocumentProxy } from 'unpdf';
import { createClient } from '@/lib/supabase/server';

export interface ExtractionResult {
  text: string;
  totalPages: number;
  isEmpty: boolean;
}

export async function extractSyllabusText(storagePath: string): Promise<ExtractionResult> {
  const supabase = await createClient();

  // Download PDF bytes from private storage (user session scoped via RLS)
  const { data, error } = await supabase.storage
    .from('syllabi')
    .download(storagePath);
  if (error) throw new Error(`Storage download failed: ${error.message}`);

  const buffer = await data.arrayBuffer();
  const uint8 = new Uint8Array(buffer);

  // unpdf wraps pdfjs-dist v5; returns empty string for scanned/image-only PDFs
  const pdf = await getDocumentProxy(uint8);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });

  return {
    text: typeof text === 'string' ? text : text.join('\n'),
    totalPages,
    isEmpty: !text || (typeof text === 'string' ? text : text.join('')).trim().length < 50,
  };
}
```

**Note on Node.js version:** unpdf's serverless build includes polyfills for `Promise.withResolvers` (used by pdfjs-dist v5.x), so it works on Node.js < 22. No special configuration needed on Vercel.

### Pattern 3: Rule-Based Parser with chrono-node

**What:** Scan extracted text line-by-line with keyword and date detection.

```typescript
// lib/syllabus/parser-rule-based.ts
// Source: https://github.com/wanasit/chrono (verified 2026-03-01)
import * as chrono from 'chrono-node';
import { ParsedItem } from './types';

const ASSIGNMENT_KEYWORDS = /\b(homework|assignment|quiz|project|paper|essay|report|lab|worksheet)\b/i;
const EXAM_KEYWORDS = /\b(exam|midterm|final|test|review)\b/i;
const READING_KEYWORDS = /\b(read|reading|chapter|ch\.|pages?|pp\.)\b/i;
const POINTS_PATTERN = /(\d+)\s*(?:pts?|points?)/i;
const WEIGHT_PATTERN = /(\d+(?:\.\d+)?)\s*%/;

export function parseWithRules(text: string, termStartDate: Date): ParsedItem[] {
  const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const items: ParsedItem[] = [];

  for (const line of lines) {
    if (line.length < 5 || line.length > 500) continue; // skip noise

    const type = detectType(line);
    if (!type) continue;

    // chrono-node: use term start date as reference so "April 15" → correct year
    // parse() returns all date matches; take the first one
    const dateResults = chrono.parse(line, { instant: termStartDate });
    const dueDate = dateResults.length > 0 ? dateResults[0].date() : null;

    const pointsMatch = POINTS_PATTERN.exec(line);
    const weightMatch = WEIGHT_PATTERN.exec(line);

    const hasDate = dueDate !== null;
    const confidence = hasDate ? 'high' : 'low';

    items.push({
      title: cleanTitle(line),
      type,
      dueDate: dueDate?.toISOString() ?? null,
      estimatedMinutes: defaultMinutes(type),
      points: pointsMatch ? Number(pointsMatch[1]) : null,
      weight: weightMatch ? Number(weightMatch[1]) : null,
      needsReview: !hasDate,
      confidence,
      source: 'rule-based',
    });
  }

  return items;
}

function detectType(line: string): 'assignment' | 'exam' | 'reading' | null {
  if (EXAM_KEYWORDS.test(line)) return 'exam';
  if (ASSIGNMENT_KEYWORDS.test(line)) return 'assignment';
  if (READING_KEYWORDS.test(line)) return 'reading';
  return null;
}
```

**Key chrono-node gotcha:** Always use `parse()` (not `parseDate()`) when scanning document text — `parse()` returns all date matches with position info. `parseDate()` only returns the first match's Date without position, which is fine for single-line inputs but loses context for multi-date lines.

**Key chrono-node gotcha:** Pass `{ instant: termStartDate }` as the reference so "April 15" in a Spring 2026 syllabus resolves to April 15, 2026, not 2025. Without this, chrono defaults to today's date as the reference.

### Pattern 4: LLM Parser (Feature-Flagged)

**What:** When `OPENAI_API_KEY` is set, send extracted text to gpt-4o-mini and merge results.

**Note on AI SDK v6 API:** In AI SDK v6, `generateObject()` was unified with `generateText()`. Use `generateText()` with `Output.object()`:

```typescript
// lib/syllabus/parser-llm.ts
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data (verified 2026-03-01)
import { generateText, Output, NoObjectGeneratedError } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const ParsedItemSchema = z.object({
  items: z.array(z.object({
    title: z.string().max(200),
    type: z.enum(['assignment', 'exam', 'reading', 'other']),
    dueDate: z.string().nullable().describe('ISO date string or null if not found'),
    estimatedMinutes: z.number().nullable(),
    needsReview: z.boolean().describe('true if date or title is ambiguous'),
    confidence: z.enum(['high', 'medium', 'low']),
  })),
});

export async function parseWithLLM(text: string, termContext: string): Promise<z.infer<typeof ParsedItemSchema>['items']> {
  if (!process.env.OPENAI_API_KEY) return []; // feature gate

  // Trim text to avoid token limits — most syllabi under 8k tokens
  const truncated = text.slice(0, 12000);

  try {
    const { output } = await generateText({
      model: openai('gpt-4o-mini'),
      output: Output.object({ schema: ParsedItemSchema }),
      prompt: `Extract all assignments, exams, and readings from this course syllabus.
Term context: ${termContext}
For each item extract: title, type (assignment/exam/reading/other), due date (ISO format or null), estimated minutes (or null), and whether parsing was uncertain (needsReview).
Syllabus text:
${truncated}`,
    });
    return output.items;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error('LLM extraction failed:', error.cause);
      return []; // fall through to rule-based only
    }
    throw error;
  }
}
```

### Pattern 5: Intermediate Parsed Item State (NOT Tasks Table)

**What:** Parsed items are held in client-side React state on the review screen, never written to the tasks table until "Confirm All" is clicked.

```typescript
// lib/syllabus/types.ts
export interface ParsedItem {
  id: string;                    // client-side only, e.g. crypto.randomUUID()
  title: string;
  type: 'assignment' | 'exam' | 'reading' | 'other';
  dueDate: string | null;        // ISO string or null
  estimatedMinutes: number | null;
  points: number | null;
  weight: number | null;
  needsReview: boolean;
  confidence: 'high' | 'medium' | 'low';
  source: 'rule-based' | 'llm' | 'user-added';
}
```

The review screen is a `'use client'` component. Items are initialized from the extraction API response and stored in `useState<ParsedItem[]>`. Edits, deletions, and additions mutate local state. "Confirm All" calls a Server Action that batch-inserts the final array into `tasks`.

### Pattern 6: Batch Confirm Server Action

```typescript
// app/syllabi/review/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { ParsedItem } from '@/lib/syllabus/types';
import { DEFAULT_MINUTES } from '@/lib/validations/task';

export async function confirmSyllabusItems(
  courseId: string,
  items: ParsedItem[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify course belongs to user
  const { data: course } = await supabase
    .from('courses').select('id').eq('id', courseId).eq('user_id', user.id).single();
  if (!course) return { success: false, error: 'Invalid course' };

  const inserts = items.map(item => ({
    user_id: user.id,
    course_id: courseId,
    title: item.title,
    type: item.type,
    status: 'todo' as const,
    due_date: item.dueDate ?? null,
    estimated_minutes: item.estimatedMinutes ?? DEFAULT_MINUTES[item.type as keyof typeof DEFAULT_MINUTES] ?? 60,
    points: item.points ?? null,
    weight: item.weight ?? null,
    needs_review: item.needsReview,
  }));

  const { error } = await supabase.from('tasks').insert(inserts);
  if (error) return { success: false, error: error.message };
  return { success: true };
}
```

### Pattern 7: Onboarding Wizard — Enable Upload Card

The `StepNextAction.tsx` component already has the "Upload Syllabi" card as a disabled `div` with a "Coming soon" badge. Phase 3 converts it to an active `button` that routes to `/syllabi/upload`.

### Anti-Patterns to Avoid

- **Routing the PDF file body through a Next.js Route Handler:** Vercel's 4.5MB body limit will block 10MB PDFs. Always use signed URL client-direct uploads.
- **Server Action for file upload:** Server Actions have a 1MB payload default limit. Even smaller PDFs risk rejection.
- **Writing parsed items to the tasks table immediately after extraction:** Parser output has errors. The review screen must be a mandatory gate — never auto-commit.
- **Using `generateObject()` from AI SDK v6:** That function was unified into `generateText()` with `Output.object()` in v6. Using the old `generateObject` import will fail at runtime.
- **Calling `chrono.parseDate()` on full document text:** Returns only the first date. Use `chrono.parse()` to get all date occurrences with positions.
- **Omitting reference date from chrono-node:** Without `{ instant: termStartDate }`, "April 15" resolves relative to today's date, not the term. A Spring 2026 syllabus scanned in November 2025 would produce April 2026 — correct. But parsed in December 2026 would produce April 2027 — wrong. Always anchor to the term.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF text extraction | Custom pdfjs-dist integration | `unpdf` | Significant boilerplate; unpdf handles serverless worker bundling automatically |
| Natural language date parsing | Regex for "April 15", "Week 3 Mon", etc. | `chrono-node` | Hundreds of edge cases in date expression formats; chrono handles them |
| LLM output validation | Manual JSON.parse + type checking | AI SDK `Output.object()` with Zod | AI SDK retries on schema mismatch; manual parsing has no recovery |
| Signed upload URLs | Custom presigned URL generation | Supabase `createSignedUploadUrl()` | Already supported by `@supabase/supabase-js`; avoids exposing service role key |
| Upload progress tracking | XHR with progress events | Standard `fetch` + `ReadableStream` or Supabase JS client upload | Supabase JS client handles this natively |

**Key insight:** The date parsing problem in syllabus text is deceptively hard. Professors write dates as "1/15", "January 15th", "Week 3 (Mon)", "by the end of week 4", and "April 15 @ 11:59pm". Chrono-node handles the first three patterns reliably. The fourth ("by the end of week 4") requires term-start-date arithmetic that is out of scope for MVP — flag those as `needs_review: true`.

---

## Common Pitfalls

### Pitfall 1: Vercel 4.5MB Body Size Limit
**What goes wrong:** Developer tests PDF upload with a 2-page syllabus, it works. Real users upload 10-page PDFs (4-10MB). The Route Handler returns 413 with no useful error message.
**Why it happens:** Vercel's hard limit on serverless function request bodies is **4.5MB**. No configuration can raise this on any plan.
**How to avoid:** Use the signed URL pattern (Pattern 1 above). The file never goes through Vercel's infrastructure.
**Warning signs:** Upload handler calls `request.formData()` or `request.arrayBuffer()` — any approach that reads the full PDF body into the Vercel function is wrong.

### Pitfall 2: Scanned/Image PDFs Silently Return Empty Text
**What goes wrong:** A professor scans their syllabus to PDF. `unpdf` returns an empty string. Parser produces zero items. User sees an empty review screen with no explanation.
**Why it happens:** `extractText` returns empty string (not an error) for PDFs with no text layer. The parser interprets zero items as "nothing to parse."
**How to avoid:** Check `isEmpty` on the extraction result before parsing. If `text.trim().length < 50`, show a clear error: "This PDF appears to be a scanned image. It cannot be parsed automatically. Please enter your assignments manually."
**Warning signs:** No check on text length before calling the parser; empty extraction result flows through to an empty review screen.

### Pitfall 3: Year Resolution Without Term Reference Date
**What goes wrong:** A BYU-Idaho syllabus says "Final Exam: April 20". Without a reference date, chrono-node resolves this relative to `new Date()`. If the parser runs in December 2026, it produces April 2027. The student's task has the wrong year.
**How to avoid:** Always pass `{ instant: termStartDate }` to `chrono.parse()`. Use the term's `start_date` from the database as the anchor.
**Warning signs:** `chrono.parse(line)` called without a second argument.

### Pitfall 4: LLM API Failure with No Fallback
**What goes wrong:** `OPENAI_API_KEY` is set. The API returns a 429 (rate limit) or 500. The extraction endpoint throws and returns a 500 error. The user sees "Something went wrong" with no path forward.
**How to avoid:** Catch `NoObjectGeneratedError` and all other errors in `parseWithLLM`. On failure, return empty array and fall through to rule-based results only. Log the error server-side. Inform the user "LLM-assisted parsing failed — showing rule-based results only."
**Warning signs:** `parseWithLLM` not wrapped in try/catch; LLM failure propagates as an unhandled exception.

### Pitfall 5: Treating the Review Screen as Optional
**What goes wrong:** Product pressure shortens the flow. A "skip review" button is added, or the review screen is bypassed when "confidence is high." Students miss deadlines because of wrong dates that were never reviewed.
**How to avoid:** The review screen is a mandatory gate. Never auto-confirm. Never skip. The `needs_review` flag controls visual urgency, not whether review happens.
**Warning signs:** Any code path that calls `confirmSyllabusItems()` without the user clicking a button on the review screen.

### Pitfall 6: LLM Output Token Limits on Long Syllabi
**What goes wrong:** A 40-page syllabus (uncommon but possible) has 15,000+ tokens. gpt-4o-mini's context limit causes truncated or failed structured output.
**How to avoid:** Truncate extracted text to ~12,000 characters before sending to the LLM (most syllabi are under 6,000 characters). Rule-based parsing runs on the full text regardless.
**Warning signs:** `text` passed directly to LLM without truncation.

### Pitfall 7: Storage Path Security — Parsing Another User's PDF
**What goes wrong:** The extraction endpoint accepts a `storagePath` parameter from the client. A malicious user crafts a path pointing to another user's stored PDF.
**How to avoid:** In the extraction Route Handler, reconstruct the path from `user.id` and `courseId` after verifying `courseId` belongs to the authenticated user. Never trust client-provided `storagePath` directly. Or validate that the path starts with `${user.id}/`.
**Warning signs:** `storagePath` used directly from request body without ownership check.

---

## Code Examples

Verified patterns from official sources:

### unpdf: Extract text from Supabase Storage PDF
```typescript
// Source: https://github.com/unjs/unpdf (verified 2026-03-01)
import { extractText, getDocumentProxy } from 'unpdf';

// buffer: ArrayBuffer from supabase.storage.from('syllabi').download(path)
const uint8 = new Uint8Array(buffer);
const pdf = await getDocumentProxy(uint8);
const { totalPages, text } = await extractText(pdf, { mergePages: true });
// text is a single string when mergePages: true
// text is string[] when mergePages: false (per-page array)
// Returns empty string for image-only PDFs — check length before parsing
```

### chrono-node: Date extraction with term reference
```typescript
// Source: https://github.com/wanasit/chrono (verified 2026-03-01)
import * as chrono from 'chrono-node';

const termStart = new Date('2026-04-06'); // BYU-Idaho Spring 2026
const results = chrono.parse(
  'Assignment 3 due April 20 — worth 50 points',
  { instant: termStart }
);
// results[0].date() → Date object for April 20, 2026
// results[0].text → 'April 20'
// results[0].index → position in original string
```

### Vercel AI SDK v6: Structured output from LLM
```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data (verified 2026-03-01)
import { generateText, Output, NoObjectGeneratedError } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Note: In AI SDK v6, generateObject() is unified with generateText() + Output.object()
const { output } = await generateText({
  model: openai('gpt-4o-mini'),
  output: Output.object({ schema: MySchema }),
  prompt: 'Extract tasks from: ...',
});
// output is fully typed as z.infer<typeof MySchema>
```

### Supabase signed URL upload flow
```typescript
// Source: https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl (verified 2026-03-01)
// Server-side (Route Handler): generate signed URL
const { data } = await supabase.storage
  .from('syllabi')
  .createSignedUploadUrl(`${userId}/${courseId}/${filename}`);
// data.signedUrl — client uses this to upload directly

// Client-side: upload directly to Supabase (bypasses Vercel)
await fetch(data.signedUrl, {
  method: 'PUT',
  body: file,         // File object from <input type="file">
  headers: { 'Content-Type': 'application/pdf' },
});
```

### Zod validation for parsed items (using v3 — project standard)
```typescript
// Source: project uses Zod v3 (^3.25.76 in package.json) — DO NOT use v4 syntax
import { z } from 'zod';

export const parsedItemSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['assignment', 'exam', 'reading', 'other']),
  dueDate: z.string().nullable(),
  estimatedMinutes: z.number().int().min(1).max(1440).nullable(),
  points: z.number().nullable().optional(),
  weight: z.number().nullable().optional(),
  needsReview: z.boolean(),
  confidence: z.enum(['high', 'medium', 'low']),
  source: z.enum(['rule-based', 'llm', 'user-added']),
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `pdf-parse@1.x` for text extraction | `unpdf@1.4.0` wrapping pdfjs-dist v5 | 2024-2025 | `pdf-parse` is abandoned (v1) or requires native canvas bindings (v2); unpdf is serverless-native |
| `generateObject()` from Vercel AI SDK | `generateText()` with `Output.object()` | AI SDK v6 (2025) | API was unified; `generateObject` still works as an alias but `Output.object()` is the documented v6 pattern |
| Route Handler for file upload body | Signed URL client-side upload | Vercel limit predates Next.js App Router | 4.5MB body limit is unchanged; signed URLs are the established bypass pattern |
| Zod v3 | Zod v4 (4.3.6 stable) | Early 2026 | Project already uses v3 throughout; upgrading mid-phase introduces breaking changes (v4 has new API). Stay on v3 for this phase. |

**Deprecated/outdated:**
- `pdf-parse@1.x`: Abandoned 2018, incompatible with Vercel cold starts
- `pdf-parse@2.x`: Requires `@napi-rs/canvas` native bindings, will break Vercel builds
- `pdfjs-dist` raw: High boilerplate for text-only extraction; unpdf is the correct wrapper

---

## Open Questions

1. **Extraction API response transport to review screen**
   - What we know: Parsed items must reach the review screen without being committed to `tasks`. Options: (a) return from extraction API and pass via URL params (too large for complex syllabi), (b) return from extraction API and hold in the page's client state (correct), (c) store in a temporary DB table with TTL (adds complexity).
   - What's unclear: How the extraction trigger Route Handler returns potentially 50+ parsed items to the client.
   - Recommendation: Return the full `ParsedItem[]` array as JSON from `POST /api/syllabi/extract`. The upload page client holds this in state and passes it as props to the review component (or stores in sessionStorage as a fallback for navigation). Do NOT use URL params for more than the `course_id`.

2. **Upload progress on the review redirect**
   - What we know: Extraction (unpdf + LLM) can take 3-15 seconds for large syllabi. The user needs feedback during this time.
   - What's unclear: Whether to use polling, streaming, or just a spinner.
   - Recommendation: For MVP simplicity, show a "Parsing your syllabus..." spinner on the upload page while awaiting the extraction API response. The extraction call is synchronous (upload → extract → return items in one response). No streaming or polling needed for typical syllabi.

3. **Deduplication of rule-based and LLM results**
   - What we know: Both parsers can detect the same assignment. Rule-based uses keyword + date detection; LLM uses semantic understanding. Merging requires similarity matching on title text.
   - What's unclear: How aggressively to deduplicate (exact match vs. fuzzy title similarity).
   - Recommendation: Use fuzzy title matching: if two items have the same type and a due date within 1 day, and their titles share >60% of words, consider them duplicates. Keep the LLM version (higher confidence). Flag if uncertain.

---

## Database Schema Notes

The existing schema (from `00001_initial_schema.sql`) already supports Phase 3 fully. No migration is needed:
- `tasks.needs_review BOOLEAN DEFAULT false` — already exists
- `tasks.points NUMERIC` — already exists
- `tasks.weight NUMERIC` — already exists
- `tasks.due_date TIMESTAMPTZ` — correct type for parsed dates
- Storage bucket `syllabi` already created (private, RLS policies defined)

The only schema concern: the `syllabi` bucket storage policies use `storage.foldername(name))[1]` to check the first folder component matches `auth.uid()`. The storage path pattern `{user_id}/{course_id}/{filename}` is compatible with this policy — first folder is `user_id`, which matches `auth.uid()::text`.

---

## Sources

### Primary (HIGH confidence)
- `https://github.com/unjs/unpdf` — extractText API, getDocumentProxy, serverless build, pdfjs-dist v5 polyfills (fetched 2026-03-01)
- `https://vercel.com/docs/functions/limitations` — 4.5MB request body limit, 300s max duration, 2GB memory on Hobby plan (fetched 2026-03-01)
- `https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl` — createSignedUploadUrl API, uploadToSignedUrl, signed URL TTL (fetched 2026-03-01)
- `https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data` — generateText + Output.object() pattern in AI SDK v6, NoObjectGeneratedError, schema validation (fetched 2026-03-01)
- `https://github.com/wanasit/chrono` — parse() vs parseDate(), ParsingReference with instant, strict vs casual mode (fetched 2026-03-01)
- `https://nextjs.org/docs/app/api-reference/config/next-config-js/proxyClientMaxBodySize` — proxyClientMaxBodySize default 10MB (experimental, Next.js 16.1.6) — confirms the 4.5MB limit is at the Vercel infra level, not configurable (fetched 2026-03-01)
- Project codebase — `package.json` (Zod v3 confirmed), `supabase/migrations/00001_initial_schema.sql` (tasks schema, storage bucket), `app/tasks/actions.ts` (Server Action patterns), `app/onboarding/_components/StepNextAction.tsx` (disabled Upload Syllabi card location) — read 2026-03-01

### Secondary (MEDIUM confidence)
- WebSearch: "Next.js App Router file upload body size limit" — confirmed 4.5MB is a hard Vercel limit with multiple sources agreeing; bypass via client-side upload to storage
- WebSearch: "Vercel AI SDK generateObject structured output 2025" — confirmed v6 uses Output.object() pattern; generateText is the unified API

### Tertiary (LOW confidence)
- BYU-Idaho syllabus format research — not directly verified. Assumed Word/PDF exports with standard academic table-of-assignments format. Recommendation: test rule-based parser against 5-10 real BYU-Idaho syllabi before marking SYLL-03/04/05 complete.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — unpdf, chrono-node, Vercel AI SDK v6, Supabase signed URLs all verified against official docs
- Architecture: HIGH — Vercel 4.5MB limit is documented fact requiring signed URL pattern; pattern verified against Supabase official docs
- Pitfalls: HIGH — body size limit and scanned PDF pitfalls verified via official Vercel docs; year resolution and LLM fallback pitfalls verified via chrono-node and AI SDK docs

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable libraries; Vercel limits unlikely to change; AI SDK v6 API may evolve but Output.object() pattern is documented stable)
