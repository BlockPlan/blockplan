---
phase: 02-core-data-model
verified: 2026-03-01T00:00:00Z
status: passed
score: 20/20 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to /onboarding as a new user, complete all 4 steps, verify redirect to /tasks"
    expected: "Term, courses, availability save to database. Step 4 shows both cards. Clicking 'Add Tasks Manually' lands on /tasks."
    why_human: "End-to-end wizard flow with database writes and router.push cannot be verified statically"
  - test: "Paint availability grid: click cells with Available/Blocked/Preferred modes, apply BYU-Idaho preset, save"
    expected: "Cells change color on click, drag paints multiple cells, BYU-I preset fills Mon-Fri 7-9AM and 7-10PM, save writes rows to availability_rules table"
    why_human: "Click/drag interaction and canvas rendering require a browser"
  - test: "Create a task without specifying estimated_minutes, check Supabase tasks table"
    expected: "Estimated minutes is populated with type-based default (assignment=120, exam=180, reading=60, other=60)"
    why_human: "Default application happens server-side; need to observe actual DB row"
  - test: "Click StatusToggle 3 times on a single task"
    expected: "Badge changes instantly (optimistic): todo -> doing -> done -> todo. Supabase row reflects each final state."
    why_human: "Optimistic UI timing and DB round-trip require browser observation"
  - test: "Delete a task via DeleteConfirm dialog"
    expected: "Native <dialog> opens with task title, Cancel closes without deleting, Delete button removes task and closes dialog"
    why_human: "Native dialog behavior and DOM interaction require browser"
  - test: "Filter tasks by course then by type, verify URL changes and list re-fetches"
    expected: "URL updates to include ?course=<id>&type=<type>, task list reloads showing only matching tasks"
    why_human: "URL-driven server re-render requires browser navigation"
  - test: "Navigate to /courses after completing onboarding, edit a course name, delete a course"
    expected: "Course list shows all courses, inline edit saves to DB, delete shows confirmation mentioning task cascade"
    why_human: "Inline edit form toggle and confirmation dialog require browser"
---

# Phase 2: Core Data Model Verification Report

**Phase Goal:** Users can define their term, add courses, set availability, and manually create and manage tasks — the data foundation every other feature depends on
**Verified:** 2026-03-01
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | User can create a term with name, start date, and end date via the onboarding wizard | VERIFIED | `StepTerm.tsx` uses `useActionState(createTerm)` wired to `createTerm` Server Action which inserts into `terms` table. Zod `termSchema` validates all 3 fields with end_date > start_date refinement. |
| 2 | User can add one or more courses to a term with name and optional meeting times | VERIFIED | `StepCourses.tsx` uses `useActionState(addCourse)`. `addCourse` inserts into `courses` with JSONB `meeting_times`. Delete via `deleteCourse`. Minimum-1 enforcement via `canAdvance` guard on Next button. |
| 3 | Onboarding wizard shows progress indicator and persists state to database (resumable) | VERIFIED | `WizardShell.tsx` renders 4-step progress dots with connectors. `app/onboarding/page.tsx` Server Component queries DB and computes `currentStep` (1-4) passed as `initialStep` prop — wizard resumes on refresh. |
| 4 | Returning users with a term, courses, and availability are redirected from /onboarding to /dashboard | VERIFIED | `app/onboarding/page.tsx` lines 48-50: `if (hasTerm && hasCourses && hasAvailability) { redirect("/dashboard"); }` |
| 5 | User can set weekly availability rules with available, blocked, and preferred time slots | VERIFIED | `AvailabilityGrid.tsx` implements 7-day x 34-slot grid (6am-11pm, 30-min increments) with 3 paint modes. `StepAvailability.tsx` serializes rules to JSON and submits via `useActionState(saveAvailabilityRules)`. |
| 6 | User can add labels to blocked times | VERIFIED | `AvailabilityGrid.tsx` includes label dropdown (Work/Church/Class/Devotional/Custom) shown when Blocked mode is active. Labels are stored in `availabilityRuleSchema.label` optional field. |
| 7 | BYU-Idaho typical preset is available as a starting template | VERIFIED | `buildByuPreset()` function in `AvailabilityGrid.tsx` populates Mon-Fri 7-9AM and 7-10PM as "available" slots. Applied via preset button. |
| 8 | Onboarding wizard step 4 presents a choice: upload syllabi (disabled) or add tasks manually | VERIFIED | `StepNextAction.tsx` renders two cards. "Add Tasks Manually" calls `router.push("/tasks")`. "Upload Syllabi" is a non-interactive div with `aria-disabled="true"` and "Coming soon" badge. |
| 9 | After completing onboarding, user can navigate to /tasks | VERIFIED | `StepNextAction.tsx` line 9: `router.push("/tasks")` on "Add Tasks Manually" click. |
| 10 | User can manage courses after onboarding from /courses page | VERIFIED | `app/courses/page.tsx` is a full Server Component: authenticates, checks for term (redirects to /onboarding if none), fetches courses. Renders `CourseList` and `CourseForm`. |
| 11 | User can create a task with title, type, due date, estimated minutes, and course assignment | VERIFIED | `TaskForm.tsx` has all fields wired via `useActionState(createTask)`. `createTask` Server Action inserts into `tasks` table with all fields. |
| 12 | Each task has a default estimated minutes based on type | VERIFIED | `DEFAULT_MINUTES` constant exported from `lib/validations/task.ts`. `createTask` applies `DEFAULT_MINUTES[type]` when `estimated_minutes` is not provided (line 39). `TaskForm` shows default as input placeholder. |
| 13 | User can edit any task's fields | VERIFIED | `TaskForm.tsx` accepts optional `task` prop for edit mode, uses `useActionState(updateTask)`, includes hidden `id` field. `updateTask` Server Action in `tasks/actions.ts` performs selective field update. |
| 14 | User can delete a task after confirmation | VERIFIED | `DeleteConfirm.tsx` uses native `<dialog>` element with `showModal()`. Confirm calls `deleteTask(task.id)` via `useTransition`. Cancel closes dialog. `TaskList.tsx` opens `DeleteConfirm` on delete button click. |
| 15 | User can toggle task status inline (todo -> doing -> done) without opening edit form | VERIFIED | `StatusToggle.tsx` uses `useOptimistic` + `useTransition` to cycle status via `STATUS_CYCLE` map. Calls `updateTaskStatus` Server Action. Disabled while transition is pending. |
| 16 | User can filter tasks by course, type, and status | VERIFIED | `TaskFilters.tsx` has 3 filter dropdowns (course, type, status). Each calls `router.replace` via `updateParam` to update URL searchParams. `tasks/page.tsx` reads params and applies `.eq()` filters to Supabase query. |
| 17 | User can sort tasks by due date, course, status, or recently added | VERIFIED | `TaskFilters.tsx` sort dropdown with 4 options. `tasks/page.tsx` applies `.order()` for due_date/status/created; does client-side sort for course (Supabase limitation with relation columns). |
| 18 | Task status is shown with visual indicators (color-coded badges) | VERIFIED | `TaskList.tsx` has `TYPE_BADGE_COLORS` map (assignment=blue, exam=red, reading=green, other=gray). `StatusToggle.tsx` has `STATUS_STYLES` map (todo=gray, doing=amber, done=green). Past-due shown in red, due-soon in amber. |
| 19 | proxy.ts replaces middleware.ts without breaking auth flows | VERIFIED | `proxy.ts` exports `async function proxy` calling `updateSession`. `middleware.ts` does not exist. TypeScript compiles clean (`npx tsc --noEmit` passes with no output). |
| 20 | All TypeScript compiles without errors | VERIFIED | `npx tsc --noEmit` produced zero errors or warnings across all 20 files created/modified in this phase. |

**Score:** 20/20 truths verified

---

## Required Artifacts

### Plan 02-01 Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `proxy.ts` | Next.js 16 proxy file | VERIFIED | Exports `async function proxy`, calls `updateSession`, has `config.matcher` |
| `app/onboarding/page.tsx` | Server Component with DB-driven step detection | VERIFIED | Uses `createClient`, queries terms/courses/availability_rules, computes `currentStep`, redirects returning users |
| `app/onboarding/actions.ts` | Server Actions: createTerm, addCourse, deleteCourse | VERIFIED | All 3 actions present with auth, Zod validation, DB insert/delete, revalidatePath |
| `app/onboarding/_components/WizardShell.tsx` | Client wizard container with step navigation and progress | VERIFIED | `"use client"`, 4-step progress indicator with connectors, renders all 4 step components |
| `app/onboarding/_components/StepTerm.tsx` | Term creation form with Zod validation | VERIFIED | `"use client"`, `useActionState(createTerm, initialState)`, inline field errors |
| `app/onboarding/_components/StepCourses.tsx` | Course addition form with list management | VERIFIED | `"use client"`, `useActionState(addCourse, initialState)`, delete buttons, min-1 guard |
| `lib/validations/onboarding.ts` | Zod schemas for term and course | VERIFIED | `termSchema` with end>start refinement, `courseSchema` with optional `meeting_times` array |

### Plan 02-02 Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `app/onboarding/_components/StepAvailability.tsx` | Step 3 of wizard | VERIFIED | `"use client"`, renders `AvailabilityGrid`, `useActionState(saveAvailabilityRules)`, advances on success |
| `app/onboarding/_components/AvailabilityGrid.tsx` | Visual weekly grid for time slots | VERIFIED | `"use client"`, 7x34 grid, 3 paint modes, blocked labels, BYU-I preset, cell-to-rule merging |
| `app/onboarding/_components/StepNextAction.tsx` | Step 4 of wizard | VERIFIED | `"use client"`, two card options, "Add Tasks Manually" calls `router.push("/tasks")`, Upload Syllabi is disabled |
| `app/onboarding/actions.ts` | saveAvailabilityRules Server Action | VERIFIED | Delete-all + insert-new batch pattern against `availability_rules`, full auth + Zod validation |
| `app/courses/page.tsx` | Course management page | VERIFIED | `createClient`, authenticates, redirects to /onboarding if no term, renders CourseList + CourseForm |
| `app/courses/actions.ts` | Server Actions: updateCourse, deleteCourse (+ createCourse) | VERIFIED | All 3 present with auth, courseSchema validation, Supabase update/delete, ownership verification |
| `lib/validations/availability.ts` | Zod schema for availability rules | VERIFIED | `availabilityRuleSchema` with overlap refinement, `availabilityRulesArraySchema`, exports `AvailabilityRule` type |

### Plan 02-03 Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `app/tasks/page.tsx` | Server Component with filter/sort from searchParams | VERIFIED | Awaits async `searchParams`, applies `.eq()` filters and `.order()` sort to Supabase query, no-courses gate |
| `app/tasks/actions.ts` | Server Actions: createTask, updateTask, deleteTask, updateTaskStatus | VERIFIED | All 4 present with auth, Zod validation (except fast-path updateTaskStatus), DEFAULT_MINUTES applied, revalidatePath |
| `app/tasks/_components/TaskList.tsx` | Task list with status toggles and action buttons | VERIFIED | `"use client"`, type badges (blue/red/green/gray), past-due/due-soon indicators, edit/delete per row, empty state |
| `app/tasks/_components/TaskForm.tsx` | Create/edit task form with Zod validation | VERIFIED | `useActionState(createTask|updateTask)`, hidden `id` for edit, inline errors, estimated_minutes default placeholder |
| `app/tasks/_components/TaskFilters.tsx` | Filter and sort controls | VERIFIED | `useSearchParams`, `router.replace` on change, 3 filters + 1 sort, clear filters button |
| `app/tasks/_components/StatusToggle.tsx` | Inline status toggle with optimistic updates | VERIFIED | `useOptimistic` + `useTransition`, cycles todo->doing->done->todo, disabled while pending |
| `lib/validations/task.ts` | Zod schema for task validation | VERIFIED | `taskSchema`, `taskUpdateSchema`, `DEFAULT_MINUTES` constant, inferred TypeScript types |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `StepTerm.tsx` | `actions.ts (createTerm)` | `useActionState(createTerm)` | WIRED | Line 13: `useActionState(createTerm, initialState)`. Success triggers `onSuccess(state.termId)`. |
| `StepCourses.tsx` | `actions.ts (addCourse)` | `useActionState(addCourse)` | WIRED | Line 45: `useActionState(addCourse, initialState)`. `deleteCourse` called on delete button. |
| `actions.ts` | `supabase.from('terms')` | Server client insert | WIRED | `createTerm` line 53-62: `.from("terms").insert(...)` |
| `actions.ts` | `supabase.from('courses')` | Server client insert/delete | WIRED | `addCourse` line 121, `deleteCourse` line 224: `.from("courses").insert/delete(...)` |
| `StepAvailability.tsx` | `actions.ts (saveAvailabilityRules)` | `useActionState(saveAvailabilityRules)` | WIRED | Line 19-22: `useActionState(saveAvailabilityRules, initialState)`. JSON rules serialized to hidden input. |
| `AvailabilityGrid.tsx` | `StepAvailability.tsx` | props (onChange callback) | WIRED | `StepAvailability.tsx` line 49: `<AvailabilityGrid initialRules={initialRules} onChange={setRules} />` |
| `actions.ts` | `supabase.from('availability_rules')` | delete-all + insert-new | WIRED | Lines 181-207: `.delete().eq("user_id")` then `.insert(rows)` |
| `courses/actions.ts` | `supabase.from('courses')` | Server client update/delete | WIRED | `updateCourse` line 120, `deleteCourse` line 164: `.from("courses").update/delete(...)` |
| `TaskForm.tsx` | `tasks/actions.ts (createTask/updateTask)` | `useActionState(createTask|updateTask)` | WIRED | Line 49: `useActionState(action, initialState)` where `action = isEdit ? updateTask : createTask` |
| `StatusToggle.tsx` | `tasks/actions.ts (updateTaskStatus)` | `useOptimistic + updateTaskStatus` | WIRED | Line 39: `await updateTaskStatus(taskId, nextStatus)` inside `startTransition` |
| `tasks/page.tsx` | `supabase.from('tasks')` | Server Component query with filter/sort | WIRED | Lines 95-98: `.from("tasks").select("*, courses(id, name)").eq("user_id", user.id)` with filter/sort branches |
| `TaskFilters.tsx` | `tasks/page.tsx` | URL searchParams drive server query | WIRED | `router.replace("/tasks?...")` on filter change triggers Server Component re-render reading new `searchParams` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| ONBD-01 | 02-01 | User can create a term with name, start date, and end date | SATISFIED | `createTerm` Server Action + `StepTerm.tsx` form with full field validation |
| ONBD-02 | 02-01 | User can add courses to a term with name and optional meeting times | SATISFIED | `addCourse`/`deleteCourse` Server Actions + `StepCourses.tsx` + `courses/actions.ts` CRUD |
| ONBD-03 | 02-02 | User can set availability rules (available windows and blocked times per day of week) | SATISFIED | `AvailabilityGrid.tsx` + `saveAvailabilityRules` Server Action + `availabilityRulesArraySchema` |
| ONBD-04 | 02-02 | User can set preferred study windows within availability | SATISFIED | `AvailabilityGrid.tsx` supports "preferred" rule_type. `availabilityRuleSchema` includes `rule_type: z.enum(["available", "blocked", "preferred"])` |
| ONBD-05 | 02-01, 02-02 | Onboarding wizard guides user through term -> courses -> availability setup | SATISFIED | Full 4-step wizard: WizardShell + StepTerm + StepCourses + StepAvailability + StepNextAction. DB-driven step detection. |
| TASK-01 | 02-03 | User can manually create tasks with title, type, due date, estimated minutes, and course | SATISFIED | `createTask` Server Action + `TaskForm.tsx` with all 5 fields |
| TASK-02 | 02-03 | Each task has type: assignment, exam, reading, or other | SATISFIED | `taskSchema` type enum. `TYPE_BADGE_COLORS` in TaskList for visual differentiation. |
| TASK-03 | 02-03 | Each task has status: todo, doing, or done | SATISFIED | `createTask` sets `status: "todo"`. `StatusToggle` cycles through all 3. `updateTaskStatus` updates DB. |
| TASK-04 | 02-03 | Each task has default estimated minutes based on type heuristic (editable) | SATISFIED | `DEFAULT_MINUTES` constant. Applied in `createTask` line 39. `TaskForm` shows default as placeholder. |
| TASK-05 | 02-03 | User can edit any task's fields | SATISFIED | `TaskForm` in edit mode with `useActionState(updateTask)`. Edit button in `TaskList` sets `editingTask`. |
| TASK-06 | 02-03 | User can delete tasks | SATISFIED | `DeleteConfirm.tsx` dialog + `deleteTask` Server Action. Triggered from TaskList delete button. |
| TASK-07 | 02-03 | User can mark tasks as done | SATISFIED | `StatusToggle.tsx` cycles todo->doing->done->todo. Color coded: done=green. |
| TASK-10 | 02-03 | User can view all tasks across courses with filtering and sorting | SATISFIED | `tasks/page.tsx` fetches all user tasks. `TaskFilters.tsx` provides course/type/status filters + 4 sort options via URL searchParams. |

All 13 requirements are satisfied. No orphaned requirements found for Phase 2.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `app/tasks/page.tsx` (full-list header, lines 140-145) | Courses nav link missing from full task list header (present in empty-state header only) | Warning | User with tasks cannot navigate to /courses from /tasks header — must use back button or direct URL. Not a blocker for phase goal. |

No stub implementations found. No TODO/FIXME comments in implementation code. All `return {}` patterns are intentional (delete/status actions returning empty success object).

---

## Commit Verification

All 7 commits documented in SUMMARY files were verified present in git history:

| Commit | Description |
|--------|-------------|
| `2d94fbb` | chore(02-01): install Zod v3, rename middleware to proxy, add validation schemas |
| `a8546fb` | feat(02-01): onboarding wizard shell and Step 1 term creation |
| `e74b3bd` | feat(02-02): Step 3 — availability grid with rule types and presets |
| `8d7327e` | feat(02-02): Course management page with CRUD and nav link |
| `05f0aa1` | feat(02-03): task Zod schema and Server Actions (CRUD + status toggle) |
| `19b1187` | feat(02-03): tasks page with server-side filter/sort and TaskFilters component |
| `d93ce08` | feat(02-03): task list, form, status toggle, and delete confirmation components |

---

## Human Verification Required

### 1. Full Onboarding Wizard End-to-End

**Test:** As a new user, navigate to /onboarding. Complete all 4 steps: create term, add 2 courses, paint availability, click "Add Tasks Manually" on step 4.
**Expected:** Each step saves to database. Step 4 shows both cards with "Upload Syllabi" visibly disabled. "Add Tasks Manually" redirects to /tasks.
**Why human:** Router.push navigation, database writes, and inter-step state flow require a browser.

### 2. Availability Grid Interaction

**Test:** On step 3, click cells to paint with Available (green), paint with Blocked (red) and set a "Work" label, paint with Preferred (blue). Apply BYU-I preset. Drag across multiple cells. Click a painted cell to clear it. Click "Save & Continue".
**Expected:** Cells change color matching mode. Blocked cells show label input. BYU-I preset fills Mon-Fri 7-9AM and 7-10PM. Saved rules appear in Supabase availability_rules table. Refreshing step 3 reloads the grid with saved state.
**Why human:** Click/drag interaction, visual grid rendering, and database inspection require a browser.

### 3. Default Estimated Minutes

**Test:** Create a task without entering estimated_minutes. Check the tasks row in Supabase.
**Expected:** `estimated_minutes` column shows 120 for assignment, 180 for exam, 60 for reading/other.
**Why human:** Server-side default application verified by inspecting Supabase row after insert.

### 4. Optimistic Status Toggle

**Test:** Click a task's status badge 3 times rapidly.
**Expected:** Badge changes instantly (optimistic) before server confirms. Final state persists in DB. No double-click submits multiple updates.
**Why human:** Timing of optimistic updates and transition pending state require browser observation.

### 5. Course Delete Cascade Warning

**Test:** On /courses, click Delete on a course that has tasks.
**Expected:** Confirmation dialog appears warning that deleting the course will also delete its tasks.
**Why human:** Dialog text content and cascade behavior require browser and database inspection.

---

## Gaps Summary

None. All 20 must-have truths verified. All artifacts are substantive (not stubs) and correctly wired. All 13 requirements satisfied. TypeScript compiles clean.

The single warning-level finding (Courses nav link absent from the full task list header) does not block any phase goal.

---

*Verified: 2026-03-01*
*Verifier: Claude (gsd-verifier)*
