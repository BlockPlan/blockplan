---
phase: 03-syllabus-pipeline
plan: 03
subsystem: ui
tags: [review, syllabus, sessionStorage, server-action, batch-insert, tailwind, client-component]

# Dependency graph
requires:
  - phase: 03-syllabus-pipeline
    plan: 01
    provides: "ParsedItem type, lib/syllabus/types.ts"
  - phase: 03-syllabus-pipeline
    plan: 02
    provides: "sessionStorage handoff (parsedItems-{courseId}), upload flow"
  - phase: 02-core-data-model
    provides: "tasks table, courses table, Supabase server client"
provides:
  - "app/syllabi/review/actions.ts — confirmSyllabusItems Server Action: batch-inserts ParsedItem[] as tasks"
  - "app/syllabi/review/page.tsx — Server Component: auth guard + course ownership check"
  - "app/syllabi/review/_components/ReviewScreen.tsx — Client Component: full CRUD review UI with Confirm All"
affects:
  - 03-syllabus-pipeline (plan 04: scheduler integration)
  - tasks table (populated via Confirm All)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Server Component wrapper + Client Component split — auth/redirect in server, all interactivity in client"
    - "sessionStorage handoff: parsedItems-{courseId} read on mount, cleared on Confirm All"
    - "Optimistic client-state edits: all edit/delete/add changes held in useState until Confirm All"
    - "crypto.randomUUID() for user-added item IDs — no server round-trip needed"
    - "Inline ItemForm component used for both edit and add modes — single form definition"

key-files:
  created:
    - app/syllabi/review/actions.ts
    - app/syllabi/review/page.tsx
    - app/syllabi/review/_components/ReviewScreen.tsx
  modified: []

key-decisions:
  - "ReviewScreen extracted to _components/ — consistent with existing upload page pattern"
  - "Edit clears needsReview flag on save — if user manually confirms the date/type, the warning is no longer relevant"
  - "Items re-sorted after add — dueDate ascending, nulls last — mirrors initial sort from merge output"
  - "Duplicate Confirm button added below list when items.length > 5 — avoids scrolling back to top for long syllabi"

patterns-established:
  - "Quality gate pattern: all parsed data held in client state until explicit user confirmation"
  - "sessionStorage key scoped by courseId prevents collision on multi-syllabus upload"

requirements-completed:
  - SYLL-07
  - SYLL-08
  - SYLL-09
  - SYLL-10

# Metrics
duration: 5min
completed: 2026-03-01
---

# Phase 3 Plan 03: Extraction Review Screen Summary

**Syllabus review page with inline edit/delete/add and a confirmSyllabusItems Server Action that batch-inserts ParsedItem[] as tasks after explicit user approval**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-01T20:16:06Z
- **Completed:** 2026-03-01T20:20:31Z
- **Tasks:** 2
- **Files modified:** 3 (all created)

## Accomplishments

- Built `confirmSyllabusItems` Server Action in `app/syllabi/review/actions.ts` — authenticates user, verifies course ownership, validates non-empty items array, maps ParsedItem[] to task rows with DEFAULT_MINUTES fallback, batch-inserts to tasks table
- Created `app/syllabi/review/page.tsx` Server Component — reads `course_id` from searchParams, auth guard, course ownership check, passes courseId + courseName to ReviewScreen
- Created `app/syllabi/review/_components/ReviewScreen.tsx` Client Component — reads `parsedItems-{courseId}` from sessionStorage on mount, displays items sorted by dueDate (nulls last), amber border + "Needs review" badge for flagged items, confidence indicator per item, inline ItemForm for edit and add, delete removes from state, Confirm All calls Server Action then clears sessionStorage and redirects to `/tasks?course_id={id}`

## Task Commits

1. **Task 1: Create confirm Server Action for batch task insertion** — `e938db4` (feat)
2. **Task 2: Build extraction review page with edit/delete/add functionality** — `ed20605` (feat)

## Files Created/Modified

- `app/syllabi/review/actions.ts` — Server Action: auth, ownership check, items validation, DEFAULT_MINUTES fallback, batch insert
- `app/syllabi/review/page.tsx` — Server Component wrapper: auth redirect, course query, renders ReviewScreen
- `app/syllabi/review/_components/ReviewScreen.tsx` — Client Component: sessionStorage load, item list with type/confidence badges, needs-review highlight, inline edit/delete/add forms, Confirm All flow

## Decisions Made

- ReviewScreen extracted to `_components/ReviewScreen.tsx` rather than inlined in page.tsx — consistent with UploadForm pattern from plan 02
- Edit saves clear the `needsReview` flag — once user explicitly reviews and confirms a date/type, the warning is no longer applicable
- Items re-sorted after add — maintains dueDate ascending order regardless of insert order
- Duplicate Confirm All button placed at bottom of list when `items.length > 5` — improves UX for syllabi with many assignments

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files created:
- FOUND: app/syllabi/review/actions.ts
- FOUND: app/syllabi/review/page.tsx
- FOUND: app/syllabi/review/_components/ReviewScreen.tsx

Key patterns verified:
- FOUND: confirmSyllabusItems export in actions.ts
- FOUND: supabase tasks insert in actions.ts
- FOUND: sessionStorage read in ReviewScreen
- FOUND: confirmSyllabusItems call in ReviewScreen
- FOUND: needsReview badge logic in ReviewScreen

Commits verified:
- FOUND: e938db4 (feat(03-03): add confirmSyllabusItems Server Action for batch task insertion)
- FOUND: ed20605 (feat(03-03): build extraction review page with edit/delete/add functionality)

TypeScript: zero errors across all files.

---
*Phase: 03-syllabus-pipeline*
*Completed: 2026-03-01*
