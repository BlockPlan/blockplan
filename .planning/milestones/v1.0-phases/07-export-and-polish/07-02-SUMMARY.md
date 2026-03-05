---
phase: 07-export-and-polish
plan: 02
subsystem: ui
tags: [subtasks, work-back-scheduling, date-fns, dialog, suggestions]

requires:
  - phase: 02-core-data-model
    provides: tasks table, TaskForm component, createTask action
  - phase: 01-foundation
    provides: subtasks table in initial schema
provides:
  - generateSubtaskSuggestions pure function with work-back scheduling
  - shouldSuggestSubtasks gate function
  - SubtaskSuggestionDialog modal component
  - createSubtasks Server Action for batch subtask insertion
  - TaskForm integration triggering suggestions after qualifying task creation
affects: []

tech-stack:
  added: []
  patterns: [work-back date scheduling, dialog triggered by action state]

key-files:
  created:
    - lib/services/subtask-suggestions.ts
    - lib/validations/subtask.ts
    - app/tasks/_components/SubtaskSuggestionDialog.tsx
  modified:
    - app/tasks/actions.ts
    - app/tasks/_components/TaskForm.tsx

key-decisions:
  - "createTask now returns task data (id, type, estimated_minutes, due_date) via .select().single()"
  - "SubtaskSuggestionDialog uses native <dialog> element consistent with DeleteConfirm pattern"
  - "Due dates clamped to today when work-back calculation produces past dates"
  - "Estimated minutes split: 15% outline, 40% first draft, 30% revise, 15% final submit"

patterns-established:
  - "Work-back scheduling: subDays from parent due date with today clamping"
  - "Post-creation dialog: useEffect on state.success triggers conditional dialog"

requirements-completed: [TASK-08, TASK-09]

duration: 8min
completed: 2026-03-02
---

# Phase 7 Plan 02: Subtask Auto-Suggestions Summary

**Auto-suggested subtasks with work-back scheduling for large assignments (240+ min) using native dialog**

## Performance

- **Duration:** 8 min
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Pure function generates 4 subtask suggestions with work-back due dates
- Dialog shows editable suggestions after creating qualifying tasks
- createSubtasks batch-inserts into existing subtasks table
- Due dates clamp to today when parent due date is close

## Task Commits

1. **Task 1: Create subtask suggestion function and schema** - `675c225` (feat)
2. **Task 2: Add Server Action, dialog, and TaskForm integration** - `9df1741` (feat)

## Files Created/Modified
- `lib/services/subtask-suggestions.ts` - Pure functions for suggestion generation
- `lib/validations/subtask.ts` - Zod schema for subtask input
- `app/tasks/_components/SubtaskSuggestionDialog.tsx` - Modal dialog for reviewing suggestions
- `app/tasks/actions.ts` - Extended TaskState, modified createTask return, added createSubtasks
- `app/tasks/_components/TaskForm.tsx` - Integration to show dialog after qualifying creation

## Decisions Made
- TaskState extended with optional task field to pass created task data back to form
- Dialog renders outside <form> in a React fragment to avoid nesting issues

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Subtask suggestions complete
- Ready for mobile responsive polish (Plan 03)

---
*Phase: 07-export-and-polish*
*Completed: 2026-03-02*
