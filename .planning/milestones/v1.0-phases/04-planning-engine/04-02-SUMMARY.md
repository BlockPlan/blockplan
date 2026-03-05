---
phase: 04-planning-engine
plan: "02"
subsystem: scheduling
tags: [scheduler, date-fns, timezone, vitest, tdd, pure-function, bin-packing, edd]

# Dependency graph
requires:
  - phase: 04-planning-engine
    provides: Research and architecture patterns for scheduler (04-RESEARCH.md)

provides:
  - Pure generateSchedule() function in lib/services/scheduler.ts
  - Exported types: AvailabilityRule, SchedulableTask, PlannerSettings, ScheduledBlock, SchedulerResult
  - 12 unit tests covering all scheduler edge cases
  - vitest test infrastructure installed

affects:
  - 04-03 (Server Actions: generatePlan, markBlockDone, markBlockMissed call generateSchedule)
  - 04-04 (Plan view reads from plan_blocks — blocks created by generateSchedule)

# Tech tracking
tech-stack:
  added:
    - "@date-fns/tz ^1.x — timezone-aware wall-clock to UTC conversion via tz() context"
    - "vitest ^4.0.18 — unit test framework (devDependency)"
  patterns:
    - "Pure function service: no DB, no side effects — identical to lib/syllabus/parser-rule-based.ts"
    - "TDD: RED commit (failing tests) then GREEN commit (implementation)"
    - "Wall-clock to UTC via startOfDay(date, { in: tz(tz) }) + addMinutes — DST-safe"
    - "Greedy EDD bin packing: sort by due_date ASC, null last; walk windows; fit+split tasks"

key-files:
  created:
    - lib/services/scheduler.ts
    - lib/services/__tests__/scheduler.test.ts
    - vitest.config.ts
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "Overdue tasks (past due date) appear in risk_tasks even when successfully scheduled — they are already late"
  - "classifyRisk is called for unscheduled tasks AND for any scheduled task with a past due date"
  - "vitest installed as test framework (not jest) — zero config, fast, ESM-native"
  - "Greedy cursor design: cursorTime advances per block+buffer within each window; resets to window.start when entering a new window"

patterns-established:
  - "Scheduler pattern: pure TS function with internal helpers buildAvailabilityWindows(), findNextTask(), classifyRisk()"
  - "Risk classification: overdue_risk if due_date <= planStart or no due_date; at_risk if unscheduled but future due_date"
  - "TDD workflow: stub with throw new Error('Not implemented') for RED, full impl for GREEN"

requirements-completed: [PLAN-01, PLAN-02, PLAN-03]

# Metrics
duration: 8min
completed: 2026-03-01
---

# Phase 4 Plan 02: Pure Scheduler Summary

**Greedy EDD bin-packing scheduler with DST-safe timezone arithmetic via @date-fns/tz, 12 unit tests all passing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-01T20:49:38Z
- **Completed:** 2026-03-01T20:58:00Z
- **Tasks:** 2 (RED phase + GREEN phase)
- **Files modified:** 5

## Accomplishments

- `generateSchedule()` pure function fully implemented with correct EDD bin-packing
- Wall-clock availability rule times safely converted to UTC via `@date-fns/tz` tz() context (DST-correct)
- All 12 test cases pass: empty inputs, task splitting, buffer gaps, EDD priority, null due dates, min block length, risk detection, past window skipping, partial window trimming
- vitest test infrastructure installed and configured for the project

## Task Commits

1. **RED phase: Failing tests** - `9b1f891` (test)
2. **GREEN phase: Implementation** - `7334103` (feat)

## Files Created/Modified

- `lib/services/scheduler.ts` — Pure generateSchedule() function + exported types (260 lines)
- `lib/services/__tests__/scheduler.test.ts` — 12 unit tests covering all edge cases (260 lines)
- `vitest.config.ts` — Vitest configuration with @/* path alias
- `package.json` / `package-lock.json` — Added @date-fns/tz + vitest

## Decisions Made

- **Overdue tasks in risk_tasks even when scheduled:** A task with a past due date should always appear in `risk_tasks` as `overdue_risk` — it is already late regardless of whether it was placed in a block. The scheduler flags it after classification.
- **vitest over jest:** Zero config, ESM-native, faster than jest for TypeScript projects. No jest config needed.
- **Greedy cursor within windows:** The cursor advances inside each window (block + buffer), then resets to the window start when moving to a new window if it's behind. This handles the case where buffer time pushes the cursor past the window end.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Overdue tasks not appearing in risk_tasks when successfully scheduled**
- **Found during:** GREEN phase (test run revealed 11/12 passing)
- **Issue:** `classifyRisk()` was only called on `unscheduled` tasks. An overdue task that still fit in a window would be placed in `blocks` but not in `risk_tasks` — violating the scheduler spec which says overdue tasks should always be flagged.
- **Fix:** After classifying unscheduled tasks, added a second loop that flags any scheduled task with `due_date <= planStart` as `overdue_risk`.
- **Files modified:** `lib/services/scheduler.ts`
- **Verification:** Test 9 (overdue risk detection) now passes; all 12 pass.
- **Committed in:** `7334103` (GREEN phase commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug)
**Impact on plan:** Essential for correct risk signal. Overdue tasks must always surface in risk UI regardless of scheduling status.

## Issues Encountered

None beyond the auto-fixed deviation above.

## User Setup Required

None — no external service configuration required. Unit tests run locally with `npx vitest run lib/services/__tests__/scheduler.test.ts`.

## Next Phase Readiness

- `generateSchedule()` is ready to be called from Server Actions in Plan 04-03
- All exported types (`AvailabilityRule`, `SchedulableTask`, `PlannerSettings`, `ScheduledBlock`, `SchedulerResult`) match the interface expected by Plan 04-03's `generatePlan` Server Action
- TypeScript clean (`npx tsc --noEmit` passes)

## Self-Check: PASSED

- FOUND: lib/services/scheduler.ts
- FOUND: lib/services/__tests__/scheduler.test.ts
- FOUND: vitest.config.ts
- FOUND: .planning/phases/04-planning-engine/04-02-SUMMARY.md
- FOUND commit: 9b1f891 (test RED phase)
- FOUND commit: 7334103 (feat GREEN phase)
- All 12 tests pass: `npx vitest run lib/services/__tests__/scheduler.test.ts`
- TypeScript clean: `npx tsc --noEmit` passes

---
*Phase: 04-planning-engine*
*Completed: 2026-03-01*
