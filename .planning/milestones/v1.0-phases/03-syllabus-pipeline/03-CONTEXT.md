# Phase 3: Syllabus Pipeline - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

PDF syllabus upload per course, server-side text extraction (unpdf), rule-based parser with optional LLM-assisted parsing (feature-flagged), and an extraction review screen where users confirm/edit/delete/add parsed items before they become tasks. This is the primary data entry path — the alternative to manual task creation from Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Upload Flow
- Upload from the onboarding wizard Step 4 ("Upload Syllabi" card, currently disabled) AND from a dedicated `/syllabi/upload` route accessible post-onboarding
- One PDF per course — user selects which course the syllabus belongs to
- PDF stored in Supabase Storage `syllabi` bucket under `{user_id}/{course_id}/{filename}`
- File size limit: 10MB (reasonable for syllabus PDFs)
- Upload progress indicator shown during upload
- After successful upload, automatically trigger text extraction and parsing
- Redirect to extraction review screen when parsing completes

### Text Extraction
- Use `unpdf` package (serverless-compatible, chosen in Phase 1 research over `pdf-parse`)
- Extract text server-side via Next.js API route or Server Action
- Handle extraction failures gracefully — show error message, let user retry or enter tasks manually
- No OCR for scanned PDFs in MVP — show clear message if no text extracted

### Parsing Strategy
- **Rule-based parser (always available):** Regex patterns for common syllabus formats
  - Detect date patterns (Month Day, MM/DD, etc.) and infer year from term dates
  - Identify assignment keywords (homework, assignment, quiz, project, paper, essay)
  - Identify exam keywords (exam, midterm, final, test)
  - Identify reading keywords (read, chapter, pages)
  - Extract points/weight if present (e.g., "50 points", "10%")
- **LLM-assisted parser (feature-flagged):** When `OPENAI_API_KEY` env var is set
  - Send extracted text to LLM with structured output prompt
  - LLM returns JSON array of parsed items
  - Merge/deduplicate with rule-based results
  - Mark LLM-only items with higher confidence than rule-based-only items
- Items with low confidence or ambiguous parsing flagged as `needs_review: true`
- Parser output is an intermediate format — not yet saved to `tasks` table

### Extraction Review Screen
- Route: `/syllabi/review?course_id={id}`
- Shows all parsed items in an editable list/table
- Each item shows: title, type (assignment/exam/reading/other), due date, estimated minutes, confidence indicator
- Items flagged as "needs review" highlighted with a warning badge
- User can:
  - Edit any field inline or via edit form
  - Delete items they don't want
  - Add new items the parser missed (same form as edit)
  - Change item type
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

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all Phase 3 decisions. The rule-based parser should work well enough for common BYU-Idaho syllabus formats without requiring an LLM.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-syllabus-pipeline*
*Context gathered: 2026-03-01*
