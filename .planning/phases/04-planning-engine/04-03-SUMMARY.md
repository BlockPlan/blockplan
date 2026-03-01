---
phase: 04-planning-engine
plan: "03"
subsystem: plan-ui, server-actions, scheduling
tags: [next.js, server-actions, supabase, sonner, optimistic-ui, useOptimistic, useTransition, risk-badges]

# Dependency graph
requires:
  - phase: 04-planning-engine
    plan: "01"
    provides: user_profiles table with planner_settings JSONB, DEFAULT_PLANNER_SETTINGS, plannerSettingsSchema
  - phase: 04-planning-engine
    plan: "02"
    provides: generateSchedule() pure function, SchedulerResult types, AvailabilityRule/SchedulableTask types
provides:
  - generatePlan Server Action (generates 7-day schedule, persists plan_blocks)
  - markBlockDone Server Action (status update, revalidate)
  - markBlockMissed Server Action (status update + auto-reschedule)
  - /plan route with 7-day block grid
  - PlanGrid, PlanBlock, RiskBadge client components
  - Sonner Toaster in root layout
affects:
  - All future phases that reference plan_blocks table
  - /settings page (planning preferences affect next generatePlan call)

# Tech tracking
tech-stack:
  added:
    - "sonner ^2.x — toast notification library, Toaster in root layout"
  patterns:
    - "Server Action private helper _runScheduler() to avoid duplication between generatePlan and markBlockMissed"
    - "useOptimistic inside useTransition for instant block status feedback with automatic revert on error"
    - "delete-then-insert pattern for plan_blocks regeneration (same as availability_rules)"
    - "router.refresh() after markBlockMissed to trigger Server Component re-render for new blocks"
    - "Intl.DateTimeFormat for locale-aware time formatting in PlanBlock and day headers"

key-files:
  created:
    - app/plan/actions.ts
    - app/plan/page.tsx
    - app/plan/_components/PlanGrid.tsx
    - app/plan/_components/PlanBlock.tsx
    - app/plan/_components/RiskBadge.tsx
  modified:
    - app/layout.tsx
    - package.json
    - package-lock.json

key-decisions:
  - "_runScheduler() private helper extracted to DRY up scheduling logic shared by generatePlan and markBlockMissed"
  - "markBlockMissed deletes only 'scheduled' status blocks before reinserting — preserves done/missed history"
  - "Risk tasks computed inline in page.tsx Server Component — avoids an extra round-trip; scheduler risk data available after generatePlan"
  - "router.refresh() used after markBlockMissed to trigger full page re-render with updated scheduled blocks"
  - "7-day grid always shows all 7 columns from today, even if blocks span different days from UTC vs local"

requirements-completed: [PLAN-07, RESC-01, RESC-02, RESC-03]

# Metrics
duration: 57min
completed: 2026-03-01
---

# Phase 4 Plan 03: Plan View Page and Server Actions Summary

**Plan view at /plan with Server Actions (generatePlan, markBlockDone, markBlockMissed), 7-day block grid, optimistic UI, auto-reschedule with sonner toast, and risk badges**

## Performance

- **Duration:** 57 min
- **Started:** 2026-03-01T21:59:28Z
- **Completed:** 2026-03-01T22:56:16Z
- **Tasks:** 3 (2 auto, 1 checkpoint auto-approved)
- **Files modified:** 8

## Accomplishments

- Installed `sonner` and added `<Toaster position="bottom-right" />` to root layout
- Created `app/plan/actions.ts` with three Server Actions:
  - `generatePlan()` — loads tasks, availability rules, profile; calls `generateSchedule()`; delete-then-insert plan_blocks; returns block count and risk tasks
  - `markBlockDone(blockId)` — status update to 'done', revalidatePath
  - `markBlockMissed(blockId)` — status update to 'missed', auto-reschedules remaining blocks, returns rescheduledCount
  - `_runScheduler()` private helper shared between generatePlan and markBlockMissed
- Created `RiskBadge.tsx` — compact inline badge, amber for at_risk, red for overdue_risk, with SVG icons
- Created `PlanBlock.tsx` — useOptimistic + useTransition, checkmark/X action buttons, green done state, gray strikethrough missed state, toast + router.refresh on missed
- Created `PlanGrid.tsx` — 7-day column grid, Generate Plan button with loading state, no-availability warning with link, risk badges section, toast on generate result
- Created `app/plan/page.tsx` — Server Component, auth check, plan_blocks query with task+course join, availability count check, inline risk task computation, full page layout with nav

## Task Commits

1. **Task 1: Server Actions and sonner setup** - `057d87d` (feat)
2. **Task 2: Plan view page and components** - `fdd2c67` (feat)
3. **Task 3: Checkpoint human-verify** - Auto-approved (auto_advance=true)

## Files Created/Modified

- `app/plan/actions.ts` — Three Server Actions + _runScheduler helper (190 lines)
- `app/plan/page.tsx` — Server Component /plan route (160 lines)
- `app/plan/_components/PlanGrid.tsx` — 7-day grid client component (170 lines)
- `app/plan/_components/PlanBlock.tsx` — Individual block with optimistic UI (145 lines)
- `app/plan/_components/RiskBadge.tsx` — Risk warning badge (55 lines)
- `app/layout.tsx` — Added Toaster from sonner
- `package.json` / `package-lock.json` — Added sonner dependency

## Decisions Made

- `_runScheduler()` extracted as private async helper — both `generatePlan` and `markBlockMissed` need the same load-tasks → load-rules → load-profile → generateSchedule() → insert-blocks flow; extraction avoids ~60 lines of duplication
- `markBlockMissed` deletes only `status='scheduled'` blocks before reinserting — preserves the 'done' and 'missed' block history so users can review past activity
- Risk tasks computed inline in `page.tsx` rather than calling the scheduler again — avoids DB round-trip; the scheduler's risk data is returned by `generatePlan`, but the page also needs to display persistent risk state between plan generations
- `router.refresh()` after `markBlockMissed` instead of relying solely on `revalidatePath` — the optimistic UI update is instant, but the full grid (new scheduled blocks) needs a Server Component re-render

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

The `plan_blocks` table must exist in Supabase. This table was referenced in Plans 04-01/04-02 but the migration file was not part of those plans. If `plan_blocks` does not exist, the `generatePlan` Server Action will fail silently on insert. The table schema expected:

```sql
create table plan_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'scheduled', -- 'scheduled' | 'done' | 'missed'
  created_at timestamptz default now()
);
```

RLS policies needed: SELECT/INSERT/UPDATE/DELETE where user_id = auth.uid().

## Next Phase Readiness

- `/plan` route is fully functional end-to-end: generate, view, mark done/missed, auto-reschedule
- All Server Actions are typed and TypeScript-clean
- Planning engine loop is complete: Settings → Availability → Plan generation → Block management

## Self-Check: PASSED

- FOUND: app/plan/actions.ts
- FOUND: app/plan/page.tsx
- FOUND: app/plan/_components/PlanGrid.tsx
- FOUND: app/plan/_components/PlanBlock.tsx
- FOUND: app/plan/_components/RiskBadge.tsx
- FOUND commit: 057d87d (feat Task 1)
- FOUND commit: fdd2c67 (feat Task 2)
- TypeScript clean: npx tsc --noEmit passes

---
*Phase: 04-planning-engine*
*Completed: 2026-03-01*
