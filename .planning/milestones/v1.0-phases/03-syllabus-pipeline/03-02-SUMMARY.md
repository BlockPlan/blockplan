---
phase: 03-syllabus-pipeline
plan: 02
subsystem: api
tags: [upload, supabase-storage, signed-url, pdf, extraction, parsing, next-api-routes, tailwind]

# Dependency graph
requires:
  - phase: 03-syllabus-pipeline
    plan: 01
    provides: "extractSyllabusText, parseWithRules, parseWithLLM, mergeParserResults, uploadRequestSchema, extractRequestSchema"
  - phase: 02-core-data-model
    provides: "courses table, terms table, Supabase server client"
provides:
  - "app/api/syllabi/upload-url/route.ts — POST endpoint generating signed Supabase Storage upload URL"
  - "app/api/syllabi/extract/route.ts — POST endpoint running both parsers + merge, returning ParsedItem[]"
  - "app/syllabi/upload/page.tsx — authenticated upload page with course selector and file input"
  - "app/syllabi/upload/_components/UploadForm.tsx — client upload form with XHR progress, extracting spinner, error states"
  - "app/onboarding/_components/StepNextAction.tsx — Upload Syllabi card enabled, routes to /syllabi/upload"
affects:
  - 03-syllabus-pipeline (plan 03: review/confirm page)
  - onboarding wizard Step 4

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Signed URL pattern: API generates signed URL, client uploads directly to Supabase Storage (bypasses Vercel 4.5 MB limit)"
    - "XHR for upload progress: XMLHttpRequest used instead of fetch to get upload progress events"
    - "sessionStorage handoff: parsed items stored under parsedItems-{courseId} for review page"
    - "Ownership validation: storagePath must start with user.id/ — prevents cross-user path traversal"
    - "Promise.all for parallel parsers: rule-based and LLM parsers run concurrently in extract route"

key-files:
  created:
    - app/api/syllabi/upload-url/route.ts
    - app/api/syllabi/extract/route.ts
    - app/syllabi/upload/page.tsx
    - app/syllabi/upload/_components/UploadForm.tsx
  modified:
    - app/onboarding/_components/StepNextAction.tsx

key-decisions:
  - "XHR used for upload step (not fetch) to enable granular progress events — fetch does not expose upload progress"
  - "UploadForm extracted to separate _components/UploadForm.tsx file rather than inline in page.tsx for clarity"
  - "parsers run in parallel via Promise.all — LLM is async and should not block rule-based"
  - "sessionStorage key parsedItems-{courseId} chosen for review page handoff — courseId scopes it to avoid collision"

patterns-established:
  - "Server Component wrapper with auth + redirect, Client Component for interactivity — consistent with existing pages"
  - "Signed URL → direct-to-storage upload pattern for large files"

requirements-completed:
  - SYLL-01

# Metrics
duration: 2min
completed: 2026-03-01
---

# Phase 3 Plan 02: PDF Upload Flow Summary

**Signed URL upload pipeline with XMLHttpRequest progress tracking, parallel rule-based + LLM extraction, and sessionStorage handoff to review page**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-01T20:10:07Z
- **Completed:** 2026-03-01T20:12:41Z
- **Tasks:** 2
- **Files modified:** 5 (4 created + 1 modified)

## Accomplishments

- Built `POST /api/syllabi/upload-url` — validates courseId ownership, generates signed Supabase Storage URL for direct client upload
- Built `POST /api/syllabi/extract` — validates storage path ownership (prevents path traversal), runs rule-based + LLM parsers in parallel, merges results, returns ParsedItem[]; scanned PDFs return 422 with clear message
- Created `/syllabi/upload` page with Server Component auth + course query, client UploadForm with XMLHttpRequest progress bar, extracting spinner, and sessionStorage handoff to review page
- Enabled onboarding Step 4 "Upload Syllabi" card — removed "Coming soon" badge, converted `div` to `Link` with matching card style

## Task Commits

1. **Task 1: Create upload URL and extraction API routes** — `723efa6` (feat)
2. **Task 2: Create upload page and enable onboarding card** — `61923d8` (feat)

## Files Created/Modified

- `app/api/syllabi/upload-url/route.ts` — POST handler: validates uploadRequestSchema, authenticates, checks course ownership, generates signed upload URL
- `app/api/syllabi/extract/route.ts` — POST handler: validates extractRequestSchema, checks storagePath ownership (must start with user.id/), fetches term, runs parsers in parallel, merges, returns items
- `app/syllabi/upload/page.tsx` — Server Component: auth redirect, course query, no-courses redirect to /onboarding
- `app/syllabi/upload/_components/UploadForm.tsx` — Client Component: course dropdown, file input (10 MB max), XHR upload with progress bar, extracting spinner, error + retry UI, sessionStorage → router.push to review
- `app/onboarding/_components/StepNextAction.tsx` — "Upload Syllabi" card converted from disabled `div` to active `Link` pointing to /syllabi/upload

## Decisions Made

- XHR (not fetch) used for the upload PUT step to get upload progress events — the plan noted this was Claude's discretion
- UploadForm placed in `_components/UploadForm.tsx` rather than inlined in page.tsx for readability (the plan permitted this: "defined in same file or inline 'use client' component")
- parsers run in parallel via `Promise.all` — LLM is async and blocking on it would slow down rule-based unnecessarily
- sessionStorage key `parsedItems-{courseId}` scopes parsed items to course, preventing collision if user uploads multiple syllabi

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files created:
- FOUND: app/api/syllabi/upload-url/route.ts
- FOUND: app/api/syllabi/extract/route.ts
- FOUND: app/syllabi/upload/page.tsx
- FOUND: app/syllabi/upload/_components/UploadForm.tsx

Commits verified:
- FOUND: 723efa6 (feat(03-02): add upload-url and extract API routes)
- FOUND: 61923d8 (feat(03-02): add upload page UI and enable onboarding card)

TypeScript: zero errors across all files.

---
*Phase: 03-syllabus-pipeline*
*Completed: 2026-03-01*
