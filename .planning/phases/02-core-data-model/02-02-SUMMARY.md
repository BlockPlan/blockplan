---
phase: 02-core-data-model
plan: 02
subsystem: ui
tags: [next.js, supabase, zod, server-actions, wizard, availability, forms, typescript]

requires:
  - phase: 02-core-data-model/02-01
    provides: Onboarding wizard shell, StepTerm, StepCourses, Server Actions for term/course CRUD, Zod validation patterns

provides:
  - Availability rules Zod schema (availabilityRuleSchema + availabilityRulesArraySchema with overlap detection)
  - AvailabilityGrid.tsx: 7-day weekly grid with 34 half-hour slots (6am–11pm), paint/drag interaction, BYU-Idaho preset
  - StepAvailability.tsx: wizard step 3 wrapping grid, saves to database via saveAvailabilityRules Server Action
  - StepNextAction.tsx: wizard step 4 with enabled "Add Tasks Manually" (routes to /tasks) and disabled "Upload Syllabi"
  - saveAvailabilityRules Server Action with delete-all + insert-new batch pattern
  - Full 4-step onboarding wizard end-to-end (term → courses → availability → next action)
  - app/courses/page.tsx: authenticated course management page post-onboarding
  - createCourse, updateCourse, deleteCourse Server Actions for /courses page
  - CourseList.tsx: course list with inline edit and delete confirmation
  - CourseForm.tsx: reusable form for create/edit with meeting times

affects: [02-03-task-management, 03-syllabus-parsing, 04-scheduler]

tech-stack:
  added: []
  patterns: [delete-all-insert-new-batch, grid-cells-to-rules-merging, cells-to-rules-merge-consecutive, rules-to-cells-prefill]

key-files:
  created:
    - lib/validations/availability.ts
    - app/onboarding/_components/AvailabilityGrid.tsx
    - app/onboarding/_components/StepAvailability.tsx
    - app/onboarding/_components/StepNextAction.tsx
    - app/courses/page.tsx
    - app/courses/actions.ts
    - app/courses/_components/CourseList.tsx
    - app/courses/_components/CourseForm.tsx
  modified:
    - app/onboarding/actions.ts
    - app/onboarding/page.tsx
    - app/onboarding/_components/WizardShell.tsx
    - app/tasks/page.tsx

key-decisions:
  - "Availability grid stores state as a Map of CellKey to CellState; consecutive same-type cells merge into rules on save"
  - "BYU-Idaho preset: Mon–Fri 7–9 AM and 7–10 PM as 'available' slots (wall-clock times, no timezone conversion)"
  - "StepNextAction and StepAvailability created in Task 1 commit to avoid WizardShell import compilation error"
  - "Delete-all + insert-new batch pattern for availability rules (same as CONTEXT.md spec)"
  - "Courses page uses same courseSchema from lib/validations/onboarding.ts — no new schema needed"
  - "Returning users (term+courses+availability) redirected to /dashboard from /onboarding page load"

patterns-established:
  - "Availability grid cells → rules conversion: merge consecutive same-type cells per day into start_time/end_time ranges"
  - "Delete-all + insert-new: supabase.delete().eq('user_id') followed by supabase.insert(rows[])"
  - "Courses page CRUD: same courseSchema reused for both onboarding and post-onboarding management"

requirements-completed: [ONBD-03, ONBD-04, ONBD-05]

duration: 5min
completed: 2026-03-01
---

# Phase 2 Plan 02: Onboarding Wizard (Availability + Next Action) and Course Management Summary

**Interactive weekly availability grid with paint/drag interaction, 4-step onboarding wizard end-to-end, and post-onboarding course CRUD page at /courses**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-01T16:15:53Z
- **Completed:** 2026-03-01T16:21:18Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments

- Availability rules Zod schema with overlap detection refinement; converts grid cells to merged time ranges
- AvailabilityGrid renders 7×34 cell grid (Sun–Sat, 6am–11pm in 30-min slots) with click/drag painting, 3 rule types (available/blocked/preferred), blocked labels (Work/Church/Class/Devotional/Custom), and BYU-Idaho preset
- Complete 4-step onboarding wizard: term → courses → availability → next action → /tasks
- Course management page at /courses with inline edit, delete confirmation warning about task cascade, and "Add Course" form

## Task Commits

Each task was committed atomically:

1. **Task 1: Step 3 — availability grid with rule types and presets** - `e74b3bd` (feat)
2. **Task 2: Step 4 (next action) and onboarding completion routing** - included in Task 1 commit (see Deviations)
3. **Task 3: Course management page for post-onboarding editing** - `8d7327e` (feat)

## Files Created/Modified

- `lib/validations/availability.ts` - Zod schemas: availabilityRuleSchema (day, times, type, label) and availabilityRulesArraySchema with overlap detection refinement
- `app/onboarding/_components/AvailabilityGrid.tsx` - Weekly grid component; click/drag paint, 3 modes, blocked labels, BYU-I preset, cell→rule merging, rule→cell pre-fill
- `app/onboarding/_components/StepAvailability.tsx` - Wizard step 3; wraps AvailabilityGrid, submits JSON via useActionState(saveAvailabilityRules), calls onNext() on success
- `app/onboarding/_components/StepNextAction.tsx` - Wizard step 4; card-style choice UI, "Add Tasks Manually" routes to /tasks, "Upload Syllabi" disabled with "Coming soon" badge
- `app/onboarding/actions.ts` - Added saveAvailabilityRules: auth, JSON parse, Zod validate, delete-all + insert-new batch
- `app/onboarding/page.tsx` - Fetches full availability rule data for grid pre-fill; passes to WizardShell
- `app/onboarding/_components/WizardShell.tsx` - Now imports and renders StepAvailability and StepNextAction for steps 3 and 4
- `app/courses/page.tsx` - Server Component: auth, fetches term (redirect to /onboarding if none), fetches courses, renders CourseList and CourseForm
- `app/courses/actions.ts` - createCourse (queries active term), updateCourse, deleteCourse with ownership verification
- `app/courses/_components/CourseList.tsx` - Course cards with inline edit (CourseForm) and delete confirmation dialog warning about task cascade
- `app/courses/_components/CourseForm.tsx` - Reusable create/edit form with meeting times UI, same UX as StepCourses
- `app/tasks/page.tsx` - Added Courses navigation link to header (both empty-state and full-list branches)

## Decisions Made

- Availability grid uses a `Map<CellKey, CellState>` for O(1) cell lookup; converted to rules on every onChange via consecutive-cell merging algorithm
- BYU-Idaho preset populates Mon–Fri 7–9 AM and 7–10 PM as "available" (wall-clock times per RESEARCH.md Pitfall 5)
- Blocked label dropdown offers Work/Church/Class/Devotional/Other/Custom; Custom reveals a free-text input
- StepNextAction and StepAvailability created during Task 1 to resolve WizardShell import dependency (same pattern as Plan 02-01 deviation)
- Courses page reuses courseSchema from lib/validations/onboarding.ts — no duplication needed
- deleteCourse in courses/actions.ts includes an explicit ownership check before delete (defense in depth)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created StepNextAction in Task 1 to resolve WizardShell import compilation error**
- **Found during:** Task 1 (WizardShell.tsx update)
- **Issue:** WizardShell imports StepNextAction. Updating WizardShell without creating StepNextAction first would cause TypeScript compilation errors and prevent Task 1 verification from passing.
- **Fix:** Created StepNextAction.tsx with full implementation during Task 1. Task 2 verified the implementation was correct and complete with no additional changes needed.
- **Files modified:** app/onboarding/_components/StepNextAction.tsx
- **Verification:** TypeScript compilation passes with no errors
- **Committed in:** e74b3bd (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Necessary to resolve compilation dependency. All Task 2 requirements are fully met. No scope creep.

## Issues Encountered

None — plan executed cleanly. TypeScript passed on all checks.

## User Setup Required

None — no external service configuration required. The availability_rules table was created in Phase 1 migration.

## Next Phase Readiness

- Availability rules are live and queryable for Phase 4 (scheduler will read availability_rules to find study blocks)
- Full 4-step wizard complete; user lands on /tasks after onboarding
- Course CRUD available at /courses for ongoing management
- All Server Action patterns established — Plan 02-03 (task management) can follow identical patterns

---
*Phase: 02-core-data-model*
*Completed: 2026-03-01*

## Self-Check: PASSED

- FOUND: lib/validations/availability.ts
- FOUND: app/onboarding/_components/AvailabilityGrid.tsx
- FOUND: app/onboarding/_components/StepAvailability.tsx
- FOUND: app/onboarding/_components/StepNextAction.tsx
- FOUND: app/courses/page.tsx
- FOUND: app/courses/actions.ts
- FOUND: app/courses/_components/CourseList.tsx
- FOUND: app/courses/_components/CourseForm.tsx
- FOUND commit e74b3bd: feat(02-02) Step 3 — availability grid with rule types and presets
- FOUND commit 8d7327e: feat(02-02) Course management page with CRUD and nav link
