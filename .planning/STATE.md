# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Students always know exactly what to work on next and when — the plan adapts to them, not the other way around.
**Current focus:** Phase 3 — Syllabus Pipeline

## Current Position

Phase: 3 of 7 (Syllabus Pipeline)
Plan: 4 of 4 in current phase (03-01, 03-02, 03-03 complete; 03-04 remaining)
Status: Executing Phase 3
Last activity: 2026-03-01 — Plan 03-03 executed (extraction review screen: confirmSyllabusItems Server Action, ReviewScreen client component with edit/delete/add + Confirm All)

Progress: [█████████░] 64%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 18 min
- Total execution time: 92 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-core-data-model | 2 | 79 min | 40 min |
| 03-syllabus-pipeline | 3 | 13 min | 4 min |

**Recent Trend:**
- Last 5 plans: 02-03 (74 min), 03-01 (6 min), 03-02 (2 min), 03-03 (5 min)
- Trend: —

*Updated after each plan completion*
| Phase 03-syllabus-pipeline P03 | 5 | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Supabase for auth + Postgres + storage (single platform, free tier)
- Vercel deployment (automatic deploys, Next.js native hosting)
- RLS + timezone schema decisions must be made in Phase 1 — retrofitting is high cost
- PDF parsing uses `unpdf@1.4.0` (serverless-compatible); `pdf-parse` is incompatible with Vercel
- LLM integration feature-flagged — app must function without it at every phase
- Zod v3 (not v4) — flatten().fieldErrors pattern used throughout; v4 is breaking
- proxy.ts renames middleware export to proxy per Next.js 16 convention
- Single active term per user for MVP — createTerm rejects if term already exists
- Meeting times stored as JSONB (day_of_week, start_time, end_time) — informational only in Phase 2
- Course sort in tasks page done client-side — Supabase does not support .order() on relation columns
- estimated_minutes defaults applied in createTask Server Action (not in form) — keeps form stateless
- StatusToggle uses useOptimistic inside useTransition for instant feedback with automatic revert on error
- Availability grid cells→rules: consecutive same-type cells merge into start_time/end_time ranges per day
- BYU-Idaho preset: Mon–Fri 7–9 AM and 7–10 PM as available (wall-clock, no timezone conversion)
- Delete-all + insert-new batch pattern used for availability_rules persistence
- LLM parser catches NoObjectGeneratedError separately — both error paths return [] for rule-based fallback
- Rule-based parser skips 'other' lines entirely to reduce noise from non-item text
- Merge prefers LLM items over rule-based duplicates (better semantic accuracy); threshold >60% word overlap
- Parser functions are pure (text in, ParsedItem[] out) — no side effects, no DB access
- All parsers return [] on failure rather than throwing — caller handles empty array
- XHR (not fetch) used for upload PUT to get granular progress events — fetch does not expose upload progress
- Signed URL pattern: client uploads directly to Supabase Storage (bypasses Vercel 4.5 MB body limit)
- sessionStorage key parsedItems-{courseId} chosen for review page handoff — courseId scopes it to avoid collision
- [Phase 03-03]: ReviewScreen extracted to _components/ — consistent with UploadForm pattern from plan 02
- [Phase 03-03]: Edit saves clear the needsReview flag — once user confirms date/type, warning is no longer applicable
- [Phase 03-03]: Items re-sorted after user-added item — maintains dueDate ascending order regardless of insert position

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4 needs pre-implementation research: scheduler algorithm design (bin packing, task splitting across blocks, overlap detection)

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 03-03-PLAN.md (extraction review screen: confirmSyllabusItems Server Action, ReviewScreen client component)
Resume file: None
