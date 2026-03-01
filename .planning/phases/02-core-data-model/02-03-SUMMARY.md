---
phase: 02-core-data-model
plan: 03
subsystem: ui
tags: [next.js, supabase, zod, server-actions, typescript, react, optimistic-ui, server-components]

requires:
  - phase: 02-core-data-model
    plan: 01
    provides: Onboarding wizard, Zod v3 schemas, Server Action patterns (useActionState, flatten.fieldErrors), Supabase RLS-protected tables (terms, courses, tasks)

provides:
  - Full task CRUD at /tasks (create, read, update, delete) with Supabase RLS
  - Zod task validation schema with DEFAULT_MINUTES map (assignment=120, exam=180, reading=60, other=60)
  - Four Server Actions: createTask, updateTask, deleteTask, updateTaskStatus
  - Server Component page.tsx with async searchParams for filter/sort-driven Supabase queries
  - TaskFilters component: URL searchParams drive server re-render via router.replace
  - TaskList component: type badges, due date indicators, empty state, inline edit/delete
  - TaskForm: unified create/edit with useActionState, inline Zod errors, estimated_minutes defaults
  - StatusToggle: useOptimistic + useTransition for instant todo->doing->done->todo cycling
  - DeleteConfirm: native <dialog> element with pending state

affects: [03-syllabus-parsing, 04-scheduler, 05-dashboard, 06-views]

tech-stack:
  added: []
  patterns: [server-component-searchparams-filtering, useOptimistic-status-toggle, native-dialog-confirm, client-side-relation-sort]

key-files:
  created:
    - lib/validations/task.ts
    - app/tasks/actions.ts
    - app/tasks/page.tsx
    - app/tasks/_components/TaskFilters.tsx
    - app/tasks/_components/TaskList.tsx
    - app/tasks/_components/TaskForm.tsx
    - app/tasks/_components/StatusToggle.tsx
    - app/tasks/_components/DeleteConfirm.tsx

key-decisions:
  - "course sort done client-side after fetch — Supabase does not support .order() on relation columns"
  - "due_date stored as TIMESTAMPTZ in DB, formatted to YYYY-MM-DD for HTML date input via toISOString().split('T')[0]"
  - "estimated_minutes defaults applied in Server Action (createTask), not in the form — keeps form stateless"
  - "StatusToggle uses useOptimistic inside useTransition — optimistic update visible instantly, reverts on error"
  - "All components created in single execution to avoid TypeScript import errors (same pattern as 02-01 deviation)"
  - "deleteTask relies on RLS for user_id enforcement (no .eq user_id check needed); updateTaskStatus same"

patterns-established:
  - "useOptimistic pattern: const [optimistic, setOptimistic] = useOptimistic(currentValue); wrap action in startTransition(() => { setOptimistic(next); await serverAction() })"
  - "Server Action fast-path: updateTaskStatus skips Zod (type-asserted inputs), still authenticates via getUser()"
  - "No-courses gate: page.tsx checks courseList.length before rendering task UI — shows redirect CTA"
  - "Client-side sort fallback: when Supabase can't sort by relation column, sort taskList array after fetch"

requirements-completed: [TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-10]

duration: 74min
completed: 2026-03-01
---

# Phase 2 Plan 03: Task Management Summary

**Full task CRUD at /tasks with Zod validation, optimistic status toggling, URL-driven filter/sort, and Supabase RLS — all using established Server Action + useActionState patterns**

## Performance

- **Duration:** 74 min
- **Started:** 2026-03-01T15:06:33Z
- **Completed:** 2026-03-01T16:20:25Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Zod taskSchema with coerced estimated_minutes and DEFAULT_MINUTES constant; taskUpdateSchema for partial updates
- Four Server Actions (createTask, updateTask, deleteTask, updateTaskStatus) with auth, RLS defense, and revalidatePath
- Server Component tasks page reads async searchParams (Next.js 16), applies filter + sort to Supabase query, handles no-courses state
- TaskFilters component: dropdown controls update URL searchParams via router.replace, triggering Server Component re-render
- TaskForm: unified create/edit with useActionState, inline Zod validation errors, estimated_minutes placeholder shows type-based default
- StatusToggle: useOptimistic + useTransition give instant visual feedback cycling todo->doing->done->todo
- DeleteConfirm: native HTML dialog element, no external library, useTransition pending state during deletion

## Task Commits

Each task was committed atomically:

1. **Task 1: Task validation schema and Server Actions** - `05f0aa1` (feat)
2. **Task 2: Tasks page + TaskFilters** - `19b1187` (feat)
3. **Task 3: TaskList, TaskForm, StatusToggle, DeleteConfirm** - `d93ce08` (feat)

## Files Created/Modified

- `lib/validations/task.ts` - taskSchema, taskUpdateSchema, DEFAULT_MINUTES map, inferred TypeScript types
- `app/tasks/actions.ts` - createTask (course ownership check + default minutes), updateTask (selective field updates), deleteTask, updateTaskStatus
- `app/tasks/page.tsx` - Server Component; async searchParams, Supabase filter/sort query, no-courses gate, passes data to TaskList/TaskFilters
- `app/tasks/_components/TaskFilters.tsx` - Course/type/status filter dropdowns + sort select; router.replace on change; clear filters button
- `app/tasks/_components/TaskList.tsx` - Task cards with type badges (blue/red/green/gray), past-due/due-soon indicators, inline edit/delete, empty state
- `app/tasks/_components/TaskForm.tsx` - Unified create/edit form with useActionState(createTask|updateTask), hidden id for edit mode, estimated_minutes default hints
- `app/tasks/_components/StatusToggle.tsx` - useOptimistic + useTransition status cycle button; disabled while pending
- `app/tasks/_components/DeleteConfirm.tsx` - Native <dialog> element, "Are you sure?" with task title, useTransition pending state

## Decisions Made

- **Course sort is client-side:** Supabase does not support `.order()` on related table columns (e.g., `courses(name)`). After fetching, tasks are sorted client-side with `localeCompare`.
- **estimated_minutes default applied in Server Action:** The createTask action applies `DEFAULT_MINUTES[type]` when estimated_minutes is not provided. The form shows this default as a placeholder hint, but does not force it — keeps form stateless.
- **All 5 UI components created together:** TaskList imports TaskForm, StatusToggle, and DeleteConfirm. Creating them in separate commits would cause TypeScript compilation errors. All were staged/committed in their respective task commits.
- **deleteTask omits .eq("user_id") check:** RLS guarantees user can only delete own tasks. The extra check is included in updateTask (belt + suspenders) but not needed for deleteTask. Kept consistent with plan intent.
- **Native dialog element:** DeleteConfirm uses `<dialog ref={dialogRef}>` with `showModal()` — no external library, accessible by default.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created all Task 3 components during Task 2 execution**
- **Found during:** Task 2 (page.tsx creation)
- **Issue:** page.tsx imports TaskList, and TaskList imports TaskForm, StatusToggle, and DeleteConfirm. TypeScript would fail if any imported component did not exist.
- **Fix:** Created all five components (TaskList, TaskForm, StatusToggle, DeleteConfirm, TaskFilters) before running TypeScript verification. Committed TaskFilters + page.tsx as Task 2, then committed the remaining 4 components as Task 3.
- **Files modified:** All 4 Task 3 components
- **Verification:** `npx tsc --noEmit` passes cleanly after each commit
- **Committed in:** d93ce08 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Necessary to avoid compilation failure. All plan requirements met in their designated task commits. No scope creep.

## Issues Encountered

None — TypeScript compilation passed cleanly after each task. All Server Action patterns followed the established onboarding conventions from 02-01.

## User Setup Required

None — tasks table and all RLS policies were created in Phase 1 migration (00001_initial_schema.sql). No additional database migrations required.

## Next Phase Readiness

- Task management is fully functional and ready for syllabus parsing (Phase 3) to auto-create tasks
- `createTask` Server Action accepts course_id and all task fields — Phase 3 can call it directly or insert via Supabase admin client
- Filter/sort URL pattern established — Phase 5 dashboard and Phase 6 views can build on same searchParams approach
- `updateTaskStatus` fast-path action ready for Phase 4 planning engine to mark tasks as done
- Estimated minutes data model is live — Phase 4 scheduler can query and use these values

---
*Phase: 02-core-data-model*
*Completed: 2026-03-01*

## Self-Check: PASSED

- FOUND: lib/validations/task.ts
- FOUND: app/tasks/actions.ts
- FOUND: app/tasks/page.tsx
- FOUND: app/tasks/_components/TaskFilters.tsx
- FOUND: app/tasks/_components/TaskList.tsx
- FOUND: app/tasks/_components/TaskForm.tsx
- FOUND: app/tasks/_components/StatusToggle.tsx
- FOUND: app/tasks/_components/DeleteConfirm.tsx
- FOUND: .planning/phases/02-core-data-model/02-03-SUMMARY.md
- FOUND commit 05f0aa1: feat(02-03) task Zod schema and Server Actions
- FOUND commit 19b1187: feat(02-03) tasks page with filter/sort and TaskFilters
- FOUND commit d93ce08: feat(02-03) task list, form, status toggle, delete confirmation
