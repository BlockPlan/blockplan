# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Students always know exactly what to work on next and when — the plan adapts to them, not the other way around.
**Current focus:** Phase 3 — Syllabus Pipeline

## Current Position

Phase: 3 of 7 (Syllabus Pipeline)
Plan: 3 of 4 in current phase (03-01, 03-02 complete; 03-03, 03-04 remaining)
Status: Executing Phase 3
Last activity: 2026-03-01 — Plan 03-02 executed (PDF upload flow: signed URL API, extraction API, upload page UI, onboarding card enabled)

Progress: [█████████░] 57%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 22 min
- Total execution time: 87 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-core-data-model | 2 | 79 min | 40 min |
| 03-syllabus-pipeline | 2 | 8 min | 4 min |

**Recent Trend:**
- Last 5 plans: 02-01 (5 min), 02-03 (74 min), 03-01 (6 min), 03-02 (2 min)
- Trend: —

*Updated after each plan completion*

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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 4 needs pre-implementation research: scheduler algorithm design (bin packing, task splitting across blocks, overlap detection)

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 03-02-PLAN.md (PDF upload flow: signed URL API, extraction API, upload page UI, onboarding card)
Resume file: None
