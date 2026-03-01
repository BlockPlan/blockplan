# Phase 4: Planning Engine - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Scheduling engine that takes tasks + availability rules and generates time-blocked study plans. Includes planner configuration (block lengths, buffer), plan generation, a basic 7-day plan view, block status management (done/missed), auto-reschedule on missed blocks, and risk badges when workload exceeds capacity. This phase writes to the `plan_blocks` table created in Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Planner Configuration
- Settings page section or dedicated `/plan/settings` route for configuring:
  - Max block length (default 90 min, range 25-120 min)
  - Min block length (default 25 min, range 15-60 min)
  - Buffer time between blocks (default 10 min, range 0-30 min)
- Settings stored per-user (could be a simple JSON column or separate table — Claude's discretion)
- Settings persist across plan regenerations

### Scheduling Algorithm
- Greedy earliest-due-date-first bin packing into available time windows
- Process: collect incomplete tasks sorted by due date → iterate through 7-day availability windows → fit tasks into blocks respecting max/min block length and buffer
- If a task's estimated_minutes exceeds max block length, split across multiple blocks
- Tasks without due dates scheduled after all dated tasks
- Never schedule past a task's due date (that's a risk, not a plan)
- All times in user's local timezone (availability rules are wall-clock times)

### Plan Generation Trigger
- "Generate Plan" button on the plan view page
- Replaces any existing plan_blocks for the user (delete old, insert new)
- Plan covers the next 7 days from current date
- Also triggered automatically after marking blocks as missed (auto-reschedule)

### Plan View (Minimal for Phase 4)
- Route: `/plan` or `/plan/week`
- Simple 7-day grid showing scheduled blocks per day
- Each block shows: task title, time range, course color/name
- Blocks are clickable/tappable to mark as done or missed
- "Generate Plan" button at the top
- Risk badges shown when tasks can't fit before their due dates

### Auto-Reschedule
- When user marks a block as "missed", system automatically replans
- Replan uses the same algorithm but starts from current date/time forward
- Only reschedules incomplete tasks (done tasks excluded)
- Shows brief notification/toast: "Plan updated — X blocks rescheduled"

### Risk Detection
- After plan generation, check for tasks whose estimated remaining time exceeds available time before due date
- Show risk badge (warning icon + text) on the plan view
- Risk levels: "At risk" (tight but possible), "Overdue risk" (not enough time)
- No tasks silently dropped — always show them even if they can't be fully scheduled

### Claude's Discretion
- Exact scheduling algorithm implementation details
- Plan view layout (timeline vs grid vs list)
- How to handle timezone edge cases
- Where to store planner settings (JSON column vs separate table)
- Risk badge visual design
- Whether to show "Generate Plan" on dashboard or only on /plan
- Block color coding strategy

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all Phase 4 decisions. The scheduling algorithm should be simple and deterministic — no need for complex optimization.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-planning-engine*
*Context gathered: 2026-03-01*
