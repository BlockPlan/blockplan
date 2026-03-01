# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-25)

**Core value:** Students always know exactly what to work on next and when — the plan adapts to them, not the other way around.
**Current focus:** Phase 2 — Core Data Model

## Current Position

Phase: 2 of 7 (Core Data Model)
Plan: 1 of 4 in current phase
Status: Executing Phase 2
Last activity: 2026-03-01 — Plan 02-01 executed (onboarding wizard steps 1-2)

Progress: [███████░░░] 25%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 5 min
- Total execution time: 5 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 02-core-data-model | 1 | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 02-01 (5 min)
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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 3 needs pre-implementation research: `unpdf` behavior with adversarial PDFs (scanned, password-protected, multi-column) and Vercel serverless timeout limits
- Phase 4 needs pre-implementation research: scheduler algorithm design (bin packing, task splitting across blocks, overlap detection)

## Session Continuity

Last session: 2026-03-01
Stopped at: Completed 02-01-PLAN.md (onboarding wizard steps 1-2)
Resume file: None
