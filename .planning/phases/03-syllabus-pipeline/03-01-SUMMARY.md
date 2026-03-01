---
phase: 03-syllabus-pipeline
plan: 01
subsystem: api
tags: [unpdf, chrono-node, ai-sdk, openai, date-fns, zod, pdf, nlp, parsing]

# Dependency graph
requires:
  - phase: 02-core-data-model
    provides: "Task model types (DEFAULT_MINUTES) and Supabase server client"
provides:
  - "lib/syllabus/types.ts — ParsedItem, ExtractionResult, ParserResult interfaces"
  - "lib/syllabus/extract.ts — PDF text extraction from Supabase Storage via unpdf"
  - "lib/syllabus/parser-rule-based.ts — regex + chrono-node parser with date resolution"
  - "lib/syllabus/parser-llm.ts — feature-gated gpt-4o-mini parser via AI SDK"
  - "lib/syllabus/parser-merge.ts — deduplication and merge of parser results"
  - "lib/validations/syllabus.ts — Zod v3 schemas for upload and parsed items"
affects:
  - 03-syllabus-pipeline (plans 02+)
  - upload UI server actions
  - review/confirm UI

# Tech tracking
tech-stack:
  added:
    - unpdf@1.4.0 (serverless-compatible PDF text extraction)
    - chrono-node@2.9.0 (NLP date parsing with instant/reference date)
    - ai@6.0.105 (Vercel AI SDK core with Output.object structured generation)
    - "@ai-sdk/openai@3.0.37 (OpenAI provider for AI SDK)"
    - date-fns@4.1.0 (date utilities for merge logic)
  patterns:
    - "Feature-gate pattern: check process.env.OPENAI_API_KEY at runtime, return [] if unset"
    - "chrono.parse with instant option to resolve relative dates against term start date"
    - "Blob -> ArrayBuffer -> Uint8Array pipeline for unpdf in server context"
    - "areDuplicates = same type + dates within 1 day + word overlap > 60%"

key-files:
  created:
    - lib/syllabus/types.ts
    - lib/syllabus/extract.ts
    - lib/syllabus/parser-rule-based.ts
    - lib/syllabus/parser-llm.ts
    - lib/syllabus/parser-merge.ts
    - lib/validations/syllabus.ts
  modified:
    - package.json (5 new dependencies)

key-decisions:
  - "LLM parser catches NoObjectGeneratedError separately from generic errors — both return [] to ensure rule-based fallback always works"
  - "parser-rule-based skips 'other' type lines entirely to reduce noise from non-item text"
  - "Merge keeps LLM version of duplicates (assumed higher semantic accuracy), discards rule-based"
  - "cleanTitle strips date text, points/weight references, and leading bullets before storing title"
  - "chrono.parse instant option anchors relative dates (e.g. 'next Monday') to term start date"

patterns-established:
  - "Parser files are pure functions: text in, ParsedItem[] out — no side effects, no DB access"
  - "All parsers return [] on failure rather than throwing — caller decides how to handle empty"
  - "Feature flags via process.env check at function entry — no configuration objects needed"

requirements-completed:
  - SYLL-02
  - SYLL-03
  - SYLL-04
  - SYLL-05
  - SYLL-06
  - SYLL-11

# Metrics
duration: 6min
completed: 2026-03-01
---

# Phase 3 Plan 01: Syllabus Processing Library Summary

**PDF text extraction via unpdf + regex/chrono-node rule-based parser + feature-gated gpt-4o-mini LLM parser + deduplicating merge into a pure lib/syllabus/ module**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-01T19:58:05Z
- **Completed:** 2026-03-01T20:04:00Z
- **Tasks:** 3
- **Files modified:** 8 (6 created + package.json + package-lock.json)

## Accomplishments
- Installed all 5 required Phase 3 dependencies (unpdf, chrono-node, ai, @ai-sdk/openai, date-fns)
- Built complete lib/syllabus/ module with types, extraction, rule-based parser, LLM parser, and merge logic
- Created Zod v3 schemas for upload, extract, and parsed item validation
- TypeScript compiles with zero errors across all 6 new files

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create types + Zod schemas** - `ebc06a0` (feat)
2. **Task 2: Build PDF extraction and rule-based parser** - `f9e7559` (feat)
3. **Task 3: Build LLM parser and merge logic** - `2c579e8` (feat)

## Files Created/Modified
- `lib/syllabus/types.ts` - ParsedItem, ExtractionResult, ParserResult interfaces
- `lib/syllabus/extract.ts` - Downloads PDF from Supabase Storage syllabi bucket, extracts text via unpdf
- `lib/syllabus/parser-rule-based.ts` - Regex keyword detection + chrono-node date parsing with instant reference
- `lib/syllabus/parser-llm.ts` - Feature-gated gpt-4o-mini parser via AI SDK with Output.object structured output
- `lib/syllabus/parser-merge.ts` - Deduplication by type + date proximity + word overlap, sorted by dueDate
- `lib/validations/syllabus.ts` - parsedItemSchema, uploadRequestSchema, extractRequestSchema (Zod v3)
- `package.json` - 5 new dependencies added

## Decisions Made
- LLM parser catches `NoObjectGeneratedError` separately (AI SDK specific) and all other errors generically — both paths return `[]` ensuring rule-based always has a chance
- Rule-based parser skips lines classified as `other` type to reduce noise — only assignment/exam/reading lines are extracted
- Merge prefers LLM items over rule-based duplicates (LLM has better semantic accuracy for title extraction)
- `cleanTitle` removes chrono date text, points patterns, weight percentages, and leading bullets/numbers before storing title
- Word overlap threshold set at >60% for duplicate detection — balances precision vs recall for near-identical descriptions

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required for this plan. OPENAI_API_KEY is optional (LLM parser degrades gracefully to empty array when unset).

## Next Phase Readiness
- lib/syllabus/ module is complete and type-safe, ready for plan 03-02 (upload API route and server actions)
- Rule-based parser handles BYU-Idaho syllabus patterns (homework, quiz, exam, midterm, final, reading, chapter)
- LLM parser feature-gated — plans 03-02+ can call both parsers without concern for missing API key

---
*Phase: 03-syllabus-pipeline*
*Completed: 2026-03-01*
