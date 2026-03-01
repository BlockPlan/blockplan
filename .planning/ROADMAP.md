# Roadmap: BlockPlan

## Overview

BlockPlan is built in seven phases, each delivering a coherent, verifiable capability. The dependency chain is strict: auth before data, data before parsing, parsing before scheduling, scheduling before views, views before export. Every phase adds something a user can see or verify. The study session feature stands independent of the scheduler and slots in after the planning engine is stable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Supabase schema, RLS on all tables, auth flows, and middleware
- [x] **Phase 2: Core Data Model** - Term/course/task structure, manual task entry, and onboarding wizard (completed 2026-03-01)
- [ ] **Phase 3: Syllabus Pipeline** - PDF upload, server-side text extraction, LLM parsing, and extraction review
- [ ] **Phase 4: Planning Engine** - Availability windows, scheduler, and auto-reschedule
- [ ] **Phase 5: Views and Dashboard** - Weekly view, daily view, today dashboard, and block completion
- [ ] **Phase 6: Study Sessions** - LLM-powered study aids from pasted notes
- [ ] **Phase 7: Export and Polish** - .ics calendar export, mobile-responsive design, and MVP completion

## Phase Details

### Phase 1: Foundation
**Goal**: Users can securely create accounts, sign in, and have their data protected by row-level security
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, SECU-01, SECU-02, SECU-03
**Success Criteria** (what must be TRUE):
  1. User can create an account with email and password and land on their dashboard
  2. User can sign in with email and password and remain signed in across browser refreshes
  3. User can sign out from any page and is returned to the login screen
  4. User can delete their account and all associated data is removed
  5. No user can access another user's data — RLS blocks cross-user queries on all tables
**Plans**: 4 plans
  - [ ] 01-01-PLAN.md — Bootstrap project, Supabase clients, database schema with RLS
  - [ ] 01-02-PLAN.md — Auth flows (sign-up, sign-in, sign-out, session persistence)
  - [ ] 01-03-PLAN.md — Account deletion with settings page
  - [ ] 01-04-PLAN.md — Migration application and end-to-end verification

### Phase 2: Core Data Model
**Goal**: Users can define their term, add courses, set availability, and manually create and manage tasks — the data foundation every other feature depends on
**Depends on**: Phase 1
**Requirements**: ONBD-01, ONBD-02, ONBD-03, ONBD-04, ONBD-05, TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, TASK-10
**Success Criteria** (what must be TRUE):
  1. User can create a term with a name, start date, and end date
  2. User can add courses to a term and see them listed
  3. User can set their weekly availability windows and blocked times (work, church, etc.)
  4. User can manually create a task with title, type, due date, estimated minutes, and course assignment
  5. User can edit, delete, and mark tasks as done from their task list
  6. User can view all tasks across courses with filtering and sorting
**Plans**: 3 plans
Plans:
- [ ] 02-01-PLAN.md — Setup (Zod, proxy.ts) + onboarding wizard steps 1-2 (term and course creation)
- [ ] 02-02-PLAN.md — Onboarding steps 3-4 (availability grid, next action) + course management page
- [ ] 02-03-PLAN.md — Task management (CRUD, filter, sort, status toggle)

### Phase 3: Syllabus Pipeline
**Goal**: Users can upload a syllabus PDF per course and confirm parsed tasks before they enter the system — the primary data entry path
**Depends on**: Phase 2
**Requirements**: SYLL-01, SYLL-02, SYLL-03, SYLL-04, SYLL-05, SYLL-06, SYLL-07, SYLL-08, SYLL-09, SYLL-10, SYLL-11
**Success Criteria** (what must be TRUE):
  1. User can upload a PDF syllabus for a course and see a list of parsed items (assignments, exams, readings)
  2. User can edit any parsed item's title, due date, type, and estimated minutes before confirming
  3. User can delete parsed items they don't want and add items the parser missed
  4. Items with uncertain parsing are flagged as "needs review" so the user knows what to check
  5. The system falls back to rule-based parsing when no LLM API key is configured
**Plans**: TBD

### Phase 4: Planning Engine
**Goal**: Users get a time-blocked study plan generated from their tasks and availability — and the plan replans itself when blocks are missed
**Depends on**: Phase 3
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, PLAN-05, PLAN-06, PLAN-07, RESC-01, RESC-02, RESC-03
**Success Criteria** (what must be TRUE):
  1. User can configure block length (25–90 min), minimum block length, and buffer time between blocks
  2. System generates a plan that schedules tasks into available windows using earliest-due-date priority
  3. User sees a 7-day set of scheduled time blocks, each assigned to a specific task
  4. When a block is missed, the system replans remaining tasks from the current date forward
  5. When workload exceeds available time, risk badges appear — no tasks are silently dropped
**Plans**: TBD

### Phase 5: Views and Dashboard
**Goal**: Users have clear daily and weekly visibility into their scheduled work and can act on their plan from each view
**Depends on**: Phase 4
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04
**Success Criteria** (what must be TRUE):
  1. Weekly view shows scheduled blocks per day with the task assigned to each block
  2. Daily view shows top priorities and estimated time remaining for the current day
  3. Today dashboard shows the top 5 items, next scheduled block, and any risk alerts
  4. User can mark individual blocks as done or missed directly from the weekly or daily view
**Plans**: TBD

### Phase 6: Study Sessions
**Goal**: Users can generate study aids (summaries, key terms, practice questions) from pasted notes for exam and reading tasks
**Depends on**: Phase 5
**Requirements**: STDY-01, STDY-02, STDY-03, STDY-04, STDY-05, STDY-06, STDY-07
**Success Criteria** (what must be TRUE):
  1. User can start a study session for an exam or reading task and paste in notes or chapter headings
  2. System generates a bullet-point summary, key terms list, and 8-12 practice questions from the pasted content
  3. Study session works in mock mode with deterministic output when no LLM API key is configured
  4. No feature in the study session generates answers to graded assignments or essay content
**Plans**: TBD

### Phase 7: Export and Polish
**Goal**: Users can export their plan to any calendar app and use BlockPlan on their phone — the app is complete and shippable
**Depends on**: Phase 6
**Requirements**: CALX-01, TASK-08, TASK-09, RESP-01
**Success Criteria** (what must be TRUE):
  1. User can download their plan as an .ics file that imports correctly into Google Calendar or Apple Calendar with events at the right times in their timezone
  2. For large tasks (papers, projects), the system auto-suggests subtasks with work-back scheduling from the due date
  3. All screens are usable on a 375px-wide mobile screen without horizontal scroll or overlapping elements
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/4 | Planned | - |
| 2. Core Data Model | 3/3 | Complete   | 2026-03-01 |
| 3. Syllabus Pipeline | TBD | Not started | - |
| 4. Planning Engine | TBD | Not started | - |
| 5. Views and Dashboard | TBD | Not started | - |
| 6. Study Sessions | TBD | Not started | - |
| 7. Export and Polish | TBD | Not started | - |
