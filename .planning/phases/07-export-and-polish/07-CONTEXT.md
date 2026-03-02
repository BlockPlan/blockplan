# Phase 7: Export and Polish - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Calendar export (.ics download), auto-suggested subtasks for large tasks with work-back scheduling, and mobile-responsive polish across all screens. This is the final phase — the app should be complete and shippable after this.

</domain>

<decisions>
## Implementation Decisions

### Calendar Export (CALX-01)
- "Export to Calendar" button on the plan view page
- Downloads an .ics file containing all scheduled plan_blocks as calendar events
- Each event: task title as summary, course name in description, correct start/end times in user's timezone
- Use `ical-generator` package (recommended in project research)
- File downloads via browser (Content-Disposition header or blob download)
- Export covers the current 7-day plan (same scope as plan view)

### Auto-Suggested Subtasks (TASK-08, TASK-09)
- When user creates a task of type "assignment" with estimated_minutes >= 240 (4+ hours), auto-suggest subtasks
- Subtask suggestions: "Outline", "First Draft", "Revise", "Final Submit" (for papers/projects)
- Work-back scheduling: subtask due dates calculated backwards from parent due date
  - Final Submit: parent due date
  - Revise: 3 days before
  - First Draft: 7 days before
  - Outline: 10 days before
- Suggestions shown as a prompt/dialog — user can accept, modify, or dismiss
- Uses the existing `subtasks` table from Phase 1 schema

### Mobile Responsive (RESP-01)
- Audit and fix all screens for 375px width
- Key areas: onboarding wizard, task list, plan grid, dashboard, study session, settings
- No horizontal scroll, no overlapping elements
- Navigation: hamburger menu or bottom nav on mobile
- Forms should stack vertically on narrow screens
- Plan grid: single-column scrollable on mobile (not 7-column grid)

### Claude's Discretion
- Exact .ics file format details
- Subtask suggestion UI (modal, inline, toast)
- Which screens need the most responsive work
- Mobile navigation pattern (hamburger vs bottom nav)
- Whether to add a "Download" button or auto-download

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. This is the polish phase — focus on making everything work well together.

</specifics>

<deferred>
## Deferred Ideas

None — this is the final phase

</deferred>

---

*Phase: 07-export-and-polish*
*Context gathered: 2026-03-02*
