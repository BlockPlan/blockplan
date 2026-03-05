# Phase 2: Core Data Model - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Onboarding wizard (term creation, course creation, availability rules setup) and manual task management (create, edit, delete, mark done, filter, sort). This phase builds the data foundation every subsequent phase depends on — no syllabus parsing, no planning engine, no dashboard views beyond what's needed to manage tasks.

</domain>

<decisions>
## Implementation Decisions

### Onboarding Wizard Flow
- Multi-step wizard at `/onboarding` with progress indicator (step dots or progress bar)
- Step 1: Create term (name, start date, end date) — single term for MVP
- Step 2: Add courses (name, optional meeting times) — add multiple, minimum 1
- Step 3: Set availability rules (available windows, blocked times per day of week, preferred study windows)
- Step 4: Choose next action — upload syllabi (Phase 3, disabled until built) or add tasks manually
- After completing onboarding: redirect to `/tasks` page
- Wizard state persists to database after each step (user can resume if they leave mid-flow)
- Returning users who already have a term skip onboarding and go to `/dashboard`

### Term & Course Management
- Single active term per user for MVP (no term switching UI needed)
- Course list shown on a dedicated page or within onboarding
- Courses can be added/edited/deleted after onboarding from a courses management area
- Meeting times stored as JSONB (day_of_week + start_time + end_time pairs) — optional, informational only for Phase 2

### Availability Rules
- Visual weekly grid or time-slot picker for setting availability
- Three rule types: `available` (study windows), `blocked` (work, church, class), `preferred` (ideal study times)
- Rules are per day-of-week (recurring weekly) — no one-off date overrides in Phase 2
- Common presets: "BYU-Idaho typical" (Mon-Fri 7-9am, 7-10pm available) as a starting template
- User can add labels to blocked times (e.g., "Work", "Devotional", "Church")

### Task Management
- Tasks page at `/tasks` showing all tasks across courses
- Create task form: title (required), type (assignment/exam/reading/other), due date, estimated minutes, course assignment
- Default estimated minutes by type: assignment=120, exam=180, reading=60, other=60 — all editable
- Task list with filtering by: course, type, status (todo/doing/done)
- Task list with sorting by: due date, course, status, recently added
- Inline status toggle (todo → doing → done) without opening edit form
- Edit task: same fields as create, accessible via click/tap on task row
- Delete task: confirmation required (simple "Are you sure?" dialog)
- Task status shown with visual indicators (color-coded badges or icons)

### Data Access Layer
- Server Actions for all mutations (create, update, delete)
- All queries go through Supabase client with RLS — no admin client for user operations
- Zod validation on all form inputs before database operations
- Error messages shown inline on forms

### Claude's Discretion
- Exact wizard UI layout and styling
- Form field ordering and grouping
- Availability picker component design (grid vs list vs timeline)
- Task list layout (table vs cards vs list)
- Loading and empty states
- Animation/transitions between wizard steps
- Mobile-responsive adaptations for all forms
- Navigation structure (sidebar links, breadcrumbs)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all Phase 2 decisions. Follow established patterns from Phase 1 (Server Actions, Supabase server client, form handling).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-data-model*
*Context gathered: 2026-02-28*
