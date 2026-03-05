---
phase: 03-syllabus-pipeline
verified: 2026-03-01T00:00:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
gaps: []
human_verification:
  - test: "Upload a real BYU-Idaho syllabus PDF and complete the full flow"
    expected: "Parser correctly identifies assignments, exams, readings with accurate dates; review screen shows items; Confirm All saves them to tasks and redirects to /tasks"
    why_human: "Parser accuracy against real-world PDF content cannot be verified statically — correctness of regex patterns and date extraction against actual BYU-I syllabus formats requires runtime testing"
  - test: "Upload a scanned/image-only PDF"
    expected: "422 error response rendered as red error box with clear message and 'Add tasks manually' link"
    why_human: "Requires a real scanned PDF to trigger the isEmpty path in extract.ts"
  - test: "Upload a PDF larger than 10 MB"
    expected: "Client-side error shown immediately, file not submitted"
    why_human: "Requires actual large file; client-side validation confirmed in code but runtime behavior needs human test"
  - test: "Confirm All with edits and deletions applied"
    expected: "Only the surviving/edited items appear in the tasks table, with correct field mapping (type, due_date, estimated_minutes, needs_review)"
    why_human: "Requires end-to-end DB round-trip verification; field mapping is correct in code but actual insert needs runtime confirmation"
---

# Phase 3: Syllabus Pipeline Verification Report

**Phase Goal:** Users can upload a syllabus PDF per course and confirm parsed tasks before they enter the system — the primary data entry path
**Verified:** 2026-03-01
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PDF text can be extracted from a Uint8Array buffer using unpdf | VERIFIED | `lib/syllabus/extract.ts` uses `getDocumentProxy(uint8)` + `extractText(pdf, { mergePages: true })` with proper Blob->ArrayBuffer->Uint8Array pipeline |
| 2 | Rule-based parser identifies assignments, exams, and readings from extracted text | VERIFIED | `lib/syllabus/parser-rule-based.ts` exports `parseWithRules` with regex constants for ASSIGNMENT_KEYWORDS, EXAM_KEYWORDS, READING_KEYWORDS; filters and maps lines to ParsedItem[] |
| 3 | Dates in syllabus text resolve to correct year using term start date as reference | VERIFIED | `chrono.parse(line, { instant: termStartDate })` called with instant reference on line 93 of parser-rule-based.ts |
| 4 | LLM parser returns structured items when OPENAI_API_KEY is set, returns empty array when unset | VERIFIED | Feature gate at line 45 of parser-llm.ts: `if (!process.env.OPENAI_API_KEY) { return []; }`. NoObjectGeneratedError and generic errors both catch and return [] |
| 5 | Merged results deduplicate items found by both parsers | VERIFIED | `lib/syllabus/parser-merge.ts` exports `mergeParserResults`; deduplicates by same type + dates within 1 day + word overlap > 60%; LLM item kept, rule-based discarded |
| 6 | Items without a detected date are flagged as needs_review | VERIFIED | `parser-rule-based.ts` line 100: `const needsReview = dueDate === null` |
| 7 | User can select a course and upload a PDF file up to 10 MB | VERIFIED | `UploadForm.tsx` validates `selected.size > MAX_FILE_SIZE_BYTES` (10 MB) and `.pdf` extension; course dropdown populated from server-side courses query |
| 8 | Upload bypasses Vercel 4.5 MB limit via signed URL direct-to-Supabase upload | VERIFIED | `upload-url/route.ts` calls `supabase.storage.from('syllabi').createSignedUploadUrl(storagePath)`; client uses XMLHttpRequest PUT to signedUrl with file body |
| 9 | After upload, extraction and parsing run server-side and return ParsedItem[] to the client | VERIFIED | `extract/route.ts` runs `extractSyllabusText` + `parseWithRules` + `parseWithLLM` in parallel via `Promise.all`, calls `mergeParserResults`, returns `{ items, totalPages, llmUsed }` |
| 10 | Scanned/image PDFs show a clear error message | VERIFIED | `extract/route.ts` line 81-90: if `result.isEmpty` returns 422 with `{ error: 'no-text', message: '...' }`; `UploadForm.tsx` handles 422 status and renders message in red error box |
| 11 | User sees all parsed items with title, type, due date, estimated minutes, and confidence indicator | VERIFIED | `ReviewScreen.tsx` renders each item with title, TYPE_BADGE_COLORS badge, due date via `formatDueDate`, estimated minutes via `formatMinutes`, and confidence in CONFIDENCE_COLORS |
| 12 | Items flagged as needs_review are highlighted with a warning badge | VERIFIED | `ReviewScreen.tsx` line 496-500: amber border on card `border-amber-200` when `item.needsReview`; line 529-532: "Needs review" amber badge rendered |
| 13 | Confirm All saves all items to the tasks table and redirects to /tasks filtered by course | VERIFIED | `confirmSyllabusItems` Server Action batch-inserts to `supabase.from('tasks').insert(inserts)`; `ReviewScreen.tsx` calls action, clears sessionStorage, runs `router.push('/tasks?course_id=${courseId}')` on success |

**Score:** 13/13 truths verified

---

### Required Artifacts

**Plan 03-01 artifacts:**

| Artifact | Status | Details |
|----------|--------|---------|
| `lib/syllabus/types.ts` | VERIFIED | Contains `ParsedItem`, `ExtractionResult`, `ParserResult` interfaces; 29 lines, substantive |
| `lib/syllabus/extract.ts` | VERIFIED | Exports `extractSyllabusText`; uses `getDocumentProxy` + `extractText` from unpdf; 41 lines |
| `lib/syllabus/parser-rule-based.ts` | VERIFIED | Exports `parseWithRules`; uses `chrono.parse` with instant; 131 lines |
| `lib/syllabus/parser-llm.ts` | VERIFIED | Exports `parseWithLLM`; uses `Output.object` from AI SDK; feature-gated; 94 lines |
| `lib/syllabus/parser-merge.ts` | VERIFIED | Exports `mergeParserResults`; deduplication + sort logic; 105 lines |
| `lib/validations/syllabus.ts` | VERIFIED | Contains `parsedItemSchema`, `uploadRequestSchema`, `extractRequestSchema`; Zod v3 patterns |

**Plan 03-02 artifacts:**

| Artifact | Status | Details |
|----------|--------|---------|
| `app/api/syllabi/upload-url/route.ts` | VERIFIED | Exports POST; auth + ownership check + signed URL generation; 79 lines |
| `app/api/syllabi/extract/route.ts` | VERIFIED | Exports POST; path ownership security check + parallel parsers + merge; 120 lines |
| `app/syllabi/upload/page.tsx` | VERIFIED | Server Component with auth redirect + course query + UploadForm render; 77 lines |
| `app/syllabi/upload/_components/UploadForm.tsx` | VERIFIED | Client Component; XHR progress; extracting spinner; sessionStorage handoff; 327 lines |
| `app/onboarding/_components/StepNextAction.tsx` | VERIFIED | "Upload Syllabi" card is a `<Link href="/syllabi/upload">`, not disabled; no "Coming soon" badge |

**Plan 03-03 artifacts:**

| Artifact | Status | Details |
|----------|--------|---------|
| `app/syllabi/review/actions.ts` | VERIFIED | `"use server"` directive; exports `confirmSyllabusItems`; auth + ownership + batch insert; 61 lines |
| `app/syllabi/review/page.tsx` | VERIFIED | Server Component; reads `course_id` from searchParams; auth + ownership guard; 40 lines |
| `app/syllabi/review/_components/ReviewScreen.tsx` | VERIFIED | Client Component; sessionStorage load on mount; edit/delete/add/confirm flows; 627 lines |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|----------|
| `parser-rule-based.ts` | chrono-node | `chrono.parse(line, { instant: termStartDate })` | WIRED | Line 93: `const dateResults = chrono.parse(line, { instant: termStartDate })` |
| `parser-llm.ts` | AI SDK | `Output.object({ schema: llmOutputSchema })` | WIRED | Line 54: `experimental_output: Output.object({ schema: llmOutputSchema })` |
| `extract.ts` | unpdf | `getDocumentProxy` + `extractText` | WIRED | Lines 1, 30-32: import and usage confirmed |
| `UploadForm.tsx` | `/api/syllabi/upload-url` | `fetch POST to get signed URL` | WIRED | Line 65: `fetch("/api/syllabi/upload-url", { method: "POST", ... })` |
| `UploadForm.tsx` | Supabase Storage | `XHR PUT to signedUrl with file body` | WIRED | Lines 86-110: `xhr.open("PUT", signedUrl); xhr.send(file)` |
| `extract/route.ts` | `lib/syllabus/extract.ts` | `extractSyllabusText` import | WIRED | Lines 4, 78: import and call confirmed |
| `extract/route.ts` | `lib/syllabus/parser-rule-based.ts` | `parseWithRules` import | WIRED | Lines 5, 96: import and call in Promise.all confirmed |
| `ReviewScreen.tsx` | sessionStorage | `sessionStorage.getItem('parsedItems-{courseId}')` on mount | WIRED | Lines 218-237: useEffect reads `parsedItems-${courseId}` from sessionStorage |
| `ReviewScreen.tsx` | `actions.ts` | `confirmSyllabusItems` Server Action call | WIRED | Line 7: import confirmed; line 283: `await confirmSyllabusItems(courseId, items)` |
| `actions.ts` | `supabase.from('tasks').insert` | Batch insert parsed items as tasks | WIRED | Line 54: `const { error } = await supabase.from("tasks").insert(inserts)` |

---

### Requirements Coverage

All 11 SYLL requirements are claimed across the three plans. Cross-referenced below:

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SYLL-01 | 03-02 | User can upload a PDF syllabus per course | SATISFIED | `app/syllabi/upload/` upload page + `upload-url` API route |
| SYLL-02 | 03-01 | System extracts text from uploaded PDF on the server (no LLM required) | SATISFIED | `lib/syllabus/extract.ts` extracts text server-side via unpdf; rule-based parser works without LLM |
| SYLL-03 | 03-01 | System parses extracted text to identify assignments (title, due date, optional points/weight) | SATISFIED | `parser-rule-based.ts` ASSIGNMENT_KEYWORDS regex + POINTS_PATTERN + WEIGHT_PATTERN |
| SYLL-04 | 03-01 | System parses extracted text to identify exams (title, date) | SATISFIED | `parser-rule-based.ts` EXAM_KEYWORDS regex (exam, midterm, final, test) |
| SYLL-05 | 03-01 | System parses extracted text to identify readings (chapter ranges, due dates if present) | SATISFIED | `parser-rule-based.ts` READING_KEYWORDS regex (read, reading, chapter, ch., pages, pp.) |
| SYLL-06 | 03-01 | LLM-assisted parsing is available when API key is configured (feature-flagged) | SATISFIED | `parser-llm.ts` feature gate: `if (!process.env.OPENAI_API_KEY) { return []; }` |
| SYLL-07 | 03-03 | User sees extraction review screen showing all parsed items before they become tasks | SATISFIED | `app/syllabi/review/` — ReviewScreen displays all items loaded from sessionStorage before any DB write |
| SYLL-08 | 03-03 | User can edit any parsed item (title, due date, type, estimated minutes) before confirming | SATISFIED | ReviewScreen inline ItemForm with title/type/dueDate/estimatedMinutes fields; edit saved to client state only |
| SYLL-09 | 03-03 | User can delete parsed items they don't want | SATISFIED | `handleDelete` filters item from `items` state array; no DB write |
| SYLL-10 | 03-03 | User can add items the parser missed on the review screen | SATISFIED | "Add Item" button toggles `showAddForm`; `handleAddSave` creates new ParsedItem with `source: 'user-added'` |
| SYLL-11 | 03-01 | Items with uncertain parsing are flagged as "needs review" | SATISFIED | `needsReview: dueDate === null` in parser-rule-based.ts; amber border + "Needs review" badge in ReviewScreen |

No orphaned requirements — all 11 SYLL requirements appear in plan frontmatter and are implemented.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `ReviewScreen.tsx` | 110, 154 | HTML `placeholder` attribute values | Info | Input field placeholders ("Assignment title", "60") — these are legitimate UX hints, not code stubs |
| `parser-llm.ts` | 46, 69, 92 | `return []` | Info | Intentional defensive returns (feature gate, null check, error fallback) — documented in PLAN and SUMMARY as correct behavior; not stubs |

No blockers or warnings found.

---

### Human Verification Required

#### 1. Full end-to-end syllabus upload flow

**Test:** Log in, navigate to /onboarding step 4, click "Upload Syllabi". Select a course. Choose a real BYU-Idaho syllabus PDF. Click "Upload and Parse". Watch the progress bar and extracting spinner. Verify items appear on the review screen.
**Expected:** Progress bar fills during upload, "Parsing your syllabus..." spinner appears during extraction, review screen shows parsed items with type badges, dates, and confidence indicators.
**Why human:** Parser accuracy against real BYU-I syllabus formats cannot be verified statically. The signed URL PUT to Supabase Storage requires a live environment.

#### 2. Scanned PDF error path

**Test:** Upload a PDF that contains only scanned images (no selectable text).
**Expected:** Red error box appears with "This PDF appears to be a scanned image. It cannot be parsed automatically. Please enter your assignments manually." and a "Add tasks manually" link.
**Why human:** Requires an actual scanned/image PDF to trigger the `isEmpty` check in extract.ts.

#### 3. 10 MB file size enforcement

**Test:** Attempt to select a PDF file larger than 10 MB.
**Expected:** Immediate client-side error "File is too large. Maximum size is 10 MB." with no upload request sent.
**Why human:** Requires an actual large file to verify client-side validation fires correctly.

#### 4. Confirm All with edits

**Test:** On the review screen, edit one item's title and due date, delete one item, add one manually, then click "Confirm X items". Check the /tasks page filtered by that course.
**Expected:** Tasks table contains exactly the confirmed items with correct field values; deleted item is absent; manually-added item is present.
**Why human:** Requires live Supabase DB round-trip; field mapping verified in code but actual persistence needs runtime confirmation.

---

## Gaps Summary

No gaps found. All automated checks pass. The phase goal — users can upload a syllabus PDF per course and confirm parsed tasks before they enter the system — is achieved by the implemented code.

The library layer (03-01) is fully implemented with real parsing logic, not stubs. The upload flow (03-02) performs genuine signed URL generation, XHR upload with progress, and server-side extraction. The review screen (03-03) reads from sessionStorage, provides full CRUD, and batch-inserts to the tasks table only on explicit Confirm All.

TypeScript compiles with zero errors. All 7 documented commits exist in git history. All 11 SYLL requirements are covered and evidenced by concrete implementations.

---

_Verified: 2026-03-01_
_Verifier: Claude (gsd-verifier)_
