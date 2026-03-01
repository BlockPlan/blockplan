# Phase 5: Views and Dashboard - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Weekly view, daily view, and today dashboard — three distinct views of the user's plan. Users can see their scheduled blocks, act on them (mark done/missed), and get a quick overview of priorities and risks. Phase 4 already built a basic plan grid at `/plan`; this phase enhances it with dedicated weekly/daily views and the main dashboard.

</domain>

<decisions>
## Implementation Decisions

### Weekly View (VIEW-01, VIEW-04)
- Route: `/plan/week` (or enhance existing `/plan` page)
- 7-day column layout showing scheduled blocks per day
- Each block shows: task title, time range, course name/color
- Blocks are interactive — mark as done or missed directly
- Reuses PlanBlock component from Phase 4 (already has done/missed actions)
- May be the same as `/plan` if Phase 4's grid already satisfies VIEW-01 — Claude can decide whether to enhance or keep as-is

### Daily View (VIEW-02, VIEW-04)
- Route: `/plan/day` or accessed by clicking a day column in weekly view
- Shows today's blocks in a timeline/list
- Top priorities section: tasks due soonest
- "Estimated time remaining today" calculation based on incomplete scheduled blocks
- Mark blocks done/missed directly from this view

### Today Dashboard (VIEW-03)
- Route: `/dashboard` (replace the current placeholder)
- Top 5 priority items (tasks due soonest that are incomplete)
- Next scheduled block (what to work on right now)
- Risk alerts from the planning engine (at_risk / overdue_risk badges)
- Quick navigation to weekly view, daily view, tasks page
- This is the landing page for returning authenticated users

### Navigation
- Consistent nav header or sidebar across all views
- Links: Dashboard, Plan (weekly), Tasks, Courses, Settings
- Active state indicator for current page

### Claude's Discretion
- Exact layout and visual design for all three views
- Whether weekly view is a new page or enhances existing /plan
- How to display "estimated time remaining"
- Dashboard card layout and information density
- Color coding for courses/block states
- Whether daily view is a separate route or modal/overlay
- Mobile adaptations for all views

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all view and dashboard decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-views-and-dashboard*
*Context gathered: 2026-03-01*
