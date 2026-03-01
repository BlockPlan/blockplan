---
phase: 04-planning-engine
plan: "01"
subsystem: database, ui, settings
tags: [supabase, postgres, rls, zod, next.js, server-actions, useActionState]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: update_updated_at trigger function used by user_profiles trigger
  - phase: 02-core-data-model
    provides: Supabase client patterns, RLS conventions, Server Action structure
provides:
  - user_profiles table with timezone and planner_settings JSONB column
  - plannerSettingsSchema Zod validation with min<=max constraint
  - DEFAULT_PLANNER_SETTINGS constant
  - savePlannerSettings Server Action with upsert pattern
  - PlannerSettingsForm client component on /settings page
affects:
  - 04-02 (scheduler reads planner_settings from user_profiles to configure block generation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useActionState with Server Action returning { success, error, errors } state shape"
    - "JSONB column for flexible settings storage with typed defaults"
    - "Upsert on conflict id for profile tables referenced by auth.users"
    - "Spread merge for JSONB defaults: { ...DEFAULT, ...(profile?.col ?? {}) }"

key-files:
  created:
    - supabase/migrations/00002_user_profiles.sql
    - lib/validations/planner.ts
    - app/settings/_components/PlannerSettings.tsx
  modified:
    - app/settings/actions.ts
    - app/settings/page.tsx

key-decisions:
  - "user_profiles uses id UUID PRIMARY KEY REFERENCES auth.users(id) — one profile per auth user, cascades on delete"
  - "No DELETE RLS policy on user_profiles — deletion cascades from auth.users, not user-initiated"
  - "planner_settings stored as JSONB not discrete columns — allows scheduler to evolve settings without migrations"
  - "Defaults applied at read time via spread merge, not enforced at DB level — keeps action stateless"

patterns-established:
  - "Profile tables: id = auth.uid() primary key with SELECT/INSERT/UPDATE RLS (no DELETE)"
  - "Settings forms: useActionState + Server Action returning flatten().fieldErrors"

requirements-completed: [PLAN-04, PLAN-05, PLAN-06]

# Metrics
duration: 11min
completed: 2026-03-01
---

# Phase 4 Plan 01: Planner Settings Infrastructure Summary

**user_profiles table with JSONB planner_settings, Zod validation schema, and /settings Planning Preferences UI with savePlannerSettings Server Action**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-01T20:49:29Z
- **Completed:** 2026-03-01T21:00:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `user_profiles` table with timezone and `planner_settings` JSONB, full RLS (SELECT/INSERT/UPDATE), and updated_at trigger
- Created `plannerSettingsSchema` Zod schema with min<=max cross-field refinement and DEFAULT_PLANNER_SETTINGS constant
- Built `PlannerSettingsForm` client component with three number inputs (max block, min block, buffer) using useActionState
- Added `savePlannerSettings` Server Action with auth check, Zod parse, and upsert into user_profiles
- Updated `/settings` page to display a "Planning Preferences" section card between Account and Delete Account sections

## Task Commits

Each task was committed atomically:

1. **Task 1: Database migration and Zod validation schema** - `72c4ef5` (feat)
2. **Task 2: Planner settings UI and Server Action** - `00d5344` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `supabase/migrations/00002_user_profiles.sql` - Creates user_profiles table with JSONB planner_settings, RLS policies, trigger
- `lib/validations/planner.ts` - Exports plannerSettingsSchema, PlannerSettings type, DEFAULT_PLANNER_SETTINGS
- `app/settings/_components/PlannerSettings.tsx` - Client form with three number inputs using useActionState
- `app/settings/actions.ts` - Added savePlannerSettings Server Action; preserved deleteAccount
- `app/settings/page.tsx` - Added Planning Preferences section, queries user_profiles with defaults fallback

## Decisions Made

- `user_profiles` uses `id UUID PRIMARY KEY REFERENCES auth.users(id)` — one profile per auth user, cascades on delete; no separate user_id column needed
- No DELETE RLS policy on user_profiles — deletion cascades from auth.users when account is deleted, not user-initiated
- `planner_settings` stored as JSONB rather than discrete columns — scheduler can extend settings in future without additional migrations
- Defaults applied at read time via spread merge (`{ ...DEFAULT_PLANNER_SETTINGS, ...(profile?.planner_settings ?? {}) }`) — keeps Server Action stateless, avoids needing DB default changes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The migration file `00002_user_profiles.sql` must be applied to Supabase via `supabase db push` or the Supabase dashboard before the settings feature will work at runtime.

## Next Phase Readiness

- `user_profiles.planner_settings` is ready to be read by the Plan 02 scheduler to configure max/min block length and buffer time
- `user_profiles.timezone` column is available for the scheduler to use for wall-clock scheduling
- All RLS is in place so the scheduler Server Action can safely read the authenticated user's profile

---
*Phase: 04-planning-engine*
*Completed: 2026-03-01*
