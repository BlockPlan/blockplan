---
phase: 02-core-data-model
plan: 01
subsystem: ui
tags: [next.js, supabase, zod, server-actions, wizard, forms, typescript]

requires:
  - phase: 01-foundation
    provides: Supabase clients (server.ts, client.ts, middleware.ts), 6-table schema with RLS, Next.js 16 app structure

provides:
  - Onboarding wizard at /onboarding with 4-step progress indicator
  - Step 1: Term creation form with Zod validation and useActionState
  - Step 2: Course addition and deletion with meeting times support
  - Database-driven step detection (wizard is resumable on page refresh)
  - Server Actions for createTerm, addCourse, deleteCourse
  - Zod schemas for term and course validation (lib/validations/onboarding.ts)
  - proxy.ts replacing middleware.ts (Next.js 16 convention)

affects: [02-02-availability-rules, 02-03-task-management, 03-syllabus-parsing, 04-scheduler]

tech-stack:
  added: [zod@3.25.76]
  patterns: [useActionState-server-actions, flatten-fieldErrors-zod-v3, database-driven-wizard-state, server-component-step-detection]

key-files:
  created:
    - proxy.ts
    - lib/validations/onboarding.ts
    - app/onboarding/actions.ts
    - app/onboarding/_components/WizardShell.tsx
    - app/onboarding/_components/StepTerm.tsx
    - app/onboarding/_components/StepCourses.tsx
  modified:
    - app/onboarding/page.tsx

key-decisions:
  - "Zod v3 (not v4) — flatten().fieldErrors pattern used throughout; v4 is breaking"
  - "proxy.ts renames middleware export to proxy per Next.js 16 convention"
  - "Meeting times stored as JSONB (array of {day_of_week, start_time, end_time}) — informational only in Phase 2"
  - "Single term per user for MVP — createTerm rejects if term already exists"
  - "StepCourses created in Task 2 commit (not Task 3) to avoid WizardShell import compilation error"
  - "Returning users (term+courses+availability) redirected to /dashboard at page load"

patterns-established:
  - "useActionState pattern: const [state, formAction, isPending] = useActionState(serverAction, initialState)"
  - "Server Action return type: {errors?: Record<string, string[]>, error?: string, success?: boolean}"
  - "Zod validation: schema.safeParse(raw) + result.error.flatten().fieldErrors on failure"
  - "Database-driven wizard: Server Component queries DB, computes step, passes initialStep to Client Component"
  - "Form reset on success: key={state.success ? String(Date.now()) : 'form-id'} pattern"

requirements-completed: [ONBD-01, ONBD-02, ONBD-05]

duration: 5min
completed: 2026-03-01
---

# Phase 2 Plan 01: Onboarding Wizard (Term + Courses) Summary

**Multi-step onboarding wizard with database-driven step detection, Zod-validated term creation, and course management with optional meeting times**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T06:48:41Z
- **Completed:** 2026-03-01T06:53:50Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Zod v3 installed, middleware.ts renamed to proxy.ts with updated export name
- Zod schemas for termSchema (with date refinement) and courseSchema (with optional meeting times)
- Resumable onboarding wizard: Server Component detects step from DB, Client Component manages UI state
- Step 1 (term creation): full form with field-level validation errors and pending state
- Step 2 (course management): add courses with optional meeting times, delete courses, minimum-1 enforcement
- Steps 3 and 4 render placeholder content (availability wizard and next steps, built in later plans)
- All Server Actions authenticate via getUser() and validate with Zod before DB operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Zod and rename middleware.ts to proxy.ts** - `2d94fbb` (chore)
2. **Task 2: Onboarding page with wizard shell and Step 1 (term creation)** - `a8546fb` (feat)
3. **Task 3: Step 2 — course addition** - included in Task 2 commit (see Deviations)

## Files Created/Modified

- `proxy.ts` - Next.js 16 proxy file replacing middleware.ts; exports async function `proxy`
- `lib/validations/onboarding.ts` - Zod schemas: termSchema (name, start/end date with refinement), courseSchema (name, optional meeting times array)
- `app/onboarding/page.tsx` - Server Component; authenticates, queries term/courses/availability, computes wizard step, redirects returning users to /dashboard
- `app/onboarding/actions.ts` - Server Actions: createTerm, addCourse, deleteCourse with auth, Zod validation, RLS defense
- `app/onboarding/_components/WizardShell.tsx` - "use client" wizard container with 4-step progress indicator dots and connector lines
- `app/onboarding/_components/StepTerm.tsx` - "use client" term form with useActionState(createTerm), inline Zod errors, pending state
- `app/onboarding/_components/StepCourses.tsx` - "use client" course form with useActionState(addCourse), meeting times UI, delete buttons, minimum-1 enforcement

## Decisions Made

- Used Zod v3 (not v4) — the `flatten().fieldErrors` pattern used throughout Phase 2 is removed in v4
- proxy.ts renames the exported function from `middleware` to `proxy` to match Next.js 16 naming convention
- StepCourses was created during Task 2 (not Task 3) because WizardShell imports it — compilation would fail otherwise
- Meeting times are passed as JSON string in a hidden form field (client state → hidden input → Server Action JSON.parse)
- Form reset on success uses React key trick: `key={state.success ? String(Date.now()) : "form-id"}`
- Single active term per user for MVP — createTerm returns an error if a term already exists

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created StepCourses in Task 2 to resolve WizardShell import compilation error**
- **Found during:** Task 2 (WizardShell.tsx creation)
- **Issue:** WizardShell imports StepCourses. Creating WizardShell without StepCourses would cause TypeScript compilation errors and prevent Task 2 verification from passing.
- **Fix:** Created StepCourses.tsx with full implementation during Task 2. Task 3 verified the implementation was correct and complete with no additional changes needed.
- **Files modified:** app/onboarding/_components/StepCourses.tsx
- **Verification:** TypeScript compilation passes, all plan requirements for StepCourses are met
- **Committed in:** a8546fb (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Necessary to resolve compilation dependency. All Task 3 requirements are fully met. No scope creep.

## Issues Encountered

None — plan executed cleanly. TypeScript passed on first check after each task.

## User Setup Required

None — no external service configuration required. Supabase tables (terms, courses, availability_rules) were created in Phase 1 migration.

## Next Phase Readiness

- Term and course data model is live and queryable via RLS
- Availability rules step (Step 3) is a placeholder — ready for Plan 02-02 to implement
- All Server Action patterns established (useActionState, Zod flatten, getUser auth) — Plans 02-02 and 02-03 can follow the same pattern
- `term_id` and `course_id` are available for downstream plans (tasks reference course_id, availability rules reference user_id)

---
*Phase: 02-core-data-model*
*Completed: 2026-03-01*

## Self-Check: PASSED

- FOUND: proxy.ts
- FOUND: lib/validations/onboarding.ts
- FOUND: app/onboarding/page.tsx
- FOUND: app/onboarding/actions.ts
- FOUND: app/onboarding/_components/WizardShell.tsx
- FOUND: app/onboarding/_components/StepTerm.tsx
- FOUND: app/onboarding/_components/StepCourses.tsx
- FOUND commit 2d94fbb: chore(02-01) install Zod and rename proxy
- FOUND commit a8546fb: feat(02-01) wizard shell and term creation
