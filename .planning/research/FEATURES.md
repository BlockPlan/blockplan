# Feature Research

**Domain:** Student Academic Planner / Syllabus-to-Plan Web App
**Researched:** 2026-02-28
**Confidence:** MEDIUM — Web search and WebFetch were unavailable. Findings are based on training knowledge (cutoff August 2025) of well-established competitors: Notion, Todoist, Canvas, Motion, Sunsama, myHomework, iStudiez Pro, Structured, and Reclaim.ai. Confidence is MEDIUM (not LOW) because the student planner domain is mature and the competitive landscape has been stable. Flag any individual claim for live verification if needed.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User authentication (email/password) | Every web app has accounts; students need private data | LOW | Supabase Auth handles this; session persistence required |
| Task list with due dates | Fundamental to any planner; Canvas already shows deadlines | LOW | Without this the app has no content to plan |
| Manual task entry (fallback) | LLM parsing will fail or be paywalled; users need control | LOW | Required when LLM is unavailable or for correction |
| Course / term organization | Students think in semesters and courses, not flat lists | LOW | Data hierarchy: Term → Course → Task |
| Task completion / check-off | Most basic action in any task manager | LOW | Needs persist across sessions |
| Weekly calendar view | Students plan by week; this is the primary mental model | MEDIUM | Visual grid, not just a list |
| Daily "what's due soon" view | Students check "what do I do today" constantly | LOW | Filter/sort by due date proximity |
| Mobile-friendly responsive design | Students check plans on phones between classes | MEDIUM | Not a native app, but must work on 375px width |
| Task editing and deletion | Extracted tasks will be wrong; manual correction is essential | LOW | CRUD on tasks |
| Due date visibility and sorting | Without dates, nothing can be prioritized | LOW | Core to the planning model |
| Deadline/overdue alerts | Students miss deadlines; they expect warnings | LOW | Visual badge or indicator when tasks are past due |
| Data privacy (per-user isolation) | Students expect their grades and assignments to be private | MEDIUM | RLS on all Supabase tables; non-negotiable |
| Delete my data / account | GDPR expectation and trust signal for students | LOW | Cascade delete of all user data |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| PDF syllabus upload + text extraction | Removes the biggest friction: manually re-entering every deadline | HIGH | Server-side extraction (pdf-parse or similar); quality varies by PDF format |
| LLM-assisted syllabus parsing | Converts messy syllabus text into structured tasks automatically | HIGH | OpenAI API; must be feature-flagged with manual fallback; this is the core differentiator |
| Extraction review / confirm screen | Student verifies what the AI found before it enters the plan — builds trust | MEDIUM | LLM outputs are unreliable; review step is mandatory for accuracy |
| Time-blocking scheduler | Converts task list into a weekly schedule of actual work sessions | HIGH | This is the gap no competitor fills — Canvas shows deadlines, Notion is a blank canvas |
| User-defined availability windows | Schedules tasks only when student is actually free (work, church, sleep) | MEDIUM | Blocked times + preferred study windows; key for BYU-I students |
| Auto-reschedule (catch-up mode) | Replans remaining tasks when blocks are missed — adapts to real life | HIGH | Biggest differentiation: the plan is always current, not stale |
| Due-date priority scheduling | Closest deadline gets work time first — matches how students actually think | MEDIUM | Simple heuristic but powerful; avoids complex optimization that's hard to explain |
| Risk badges / workload alerts | Visual warning when more work is scheduled than time allows | MEDIUM | Surfaces hidden crunch weeks before they happen |
| Auto-subtask breakdown for projects | Papers and projects decompose into subtasks with work-back scheduling | HIGH | LLM-assisted; each subtask gets its own time block |
| "Today" dashboard with next block | Students always know exactly what to work on right now | LOW | Derived view from schedule; no complex logic, just filter + display |
| Study session generation | Generates summaries, key terms, and practice questions from pasted notes | HIGH | OpenAI API; ethical boundary: study aids only, never answers to graded work |
| .ics calendar export | Students can pull the schedule into Google Calendar, Apple Calendar, or iCal | LOW | Industry-standard format; one-time generation or on-demand |
| Configurable block length and buffer | 25 min (Pomodoro) vs 90 min (deep work) — students have preferences | LOW | User setting; affects scheduler output density |
| Onboarding wizard | Guided setup that produces a usable plan in one session | MEDIUM | Term → Courses → Syllabi → Availability → Generated plan |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| LMS API integration (Canvas/Blackboard) | Auto-import deadlines without PDF upload | Per-institution OAuth setup; each LMS has different API; Canvas API is not universal across institutions; massive scope increase for marginal gain over PDF upload | PDF upload works universally; build LMS integration only after product-market fit is established |
| Google Calendar / Outlook two-way sync | Students want plan in their existing calendar | Requires OAuth per provider, webhook management for two-way changes, conflict resolution logic, and ongoing maintenance as APIs change | .ics export covers read-only sync; sufficient for MVP and reversible |
| Native iOS / Android app | Students spend time on phones | Doubles development effort, App Store review cycles, and maintenance burden | Responsive web app with PWA-style behavior covers mobile adequately for a student tool used at a desk |
| Essay writing assistant / homework completion | "Help me write this paper" | Crosses ethical line from study aid to academic dishonesty; creates liability and reputational risk | Study aids only: summaries, key terms, practice questions from student's own notes |
| Group / collaboration features | Study groups want shared plans | Individual planning data (grades, study notes) is sensitive; sharing architecture multiplies complexity | Ship individual planning first; social features are a separate product |
| Stripe / payment integration at launch | Monetize from day one | Adds compliance burden (PCI), customer support overhead, and friction that kills adoption before value is validated | Ship free, collect email signups, validate retention, then add billing |
| AI-generated study schedules without review | Fully automated — no manual step | LLM hallucinations will invent due dates and tasks; students will trust the plan and miss real deadlines | Always require human review of LLM-parsed content; the review screen is non-negotiable |
| Grade tracking | Students want one app for everything | Opens grade-storage liability questions, FERPA edge cases, and scope creep away from planning | Keep scope: deadlines and study time. Link out to Canvas for grades |
| Notification / email reminder system | Students forget tasks | Email deliverability, unsubscribe management, notification fatigue, and infrastructure complexity are all non-trivial | Risk badges and the Today dashboard surface urgency in-app without infrastructure burden |
| Dark mode | Accessibility and preference | Not a bad feature, but dangerous to build early — styling decisions compound tech debt fast | Build with Tailwind CSS custom themes; add dark mode after core UX is stable |

---

## Feature Dependencies

```
Authentication
    └──requires──> All other features (nothing works without user identity)

Term + Course structure
    └──requires──> Authentication
    └──required by──> Task model (tasks belong to courses)

Task model (assignment/exam/reading/other, due date, estimated minutes, status)
    └──requires──> Term + Course structure
    └──required by──> Scheduler
    └──required by──> Weekly view
    └──required by──> Today dashboard
    └──required by──> .ics export

PDF upload + text extraction
    └──requires──> Authentication (private storage)
    └──required by──> LLM syllabus parsing

LLM syllabus parsing
    └──requires──> PDF upload + text extraction
    └──required by──> Extraction review screen
    └──enhances──> Task model (auto-populates tasks)

Extraction review screen
    └──requires──> LLM syllabus parsing (or rule-based extraction)
    └──required by──> Task model (user confirms before tasks are saved)

Availability windows
    └──requires──> Authentication
    └──required by──> Scheduler (can only schedule during free time)

Scheduler (planning engine)
    └──requires──> Task model (what to schedule)
    └──requires──> Availability windows (when to schedule)
    └──required by──> Weekly view (what to display)
    └──required by──> Today dashboard
    └──required by──> Risk badges
    └──required by──> Auto-reschedule

Auto-reschedule (catch-up mode)
    └──requires──> Scheduler
    └──enhances──> Weekly view (shows updated plan)

Risk badges
    └──requires──> Scheduler (compares scheduled time vs available time)

Weekly view
    └──requires──> Scheduler
    └──enhances──> Today dashboard

Today dashboard
    └──requires──> Task model
    └──enhances──> Scheduler output

.ics export
    └──requires──> Task model (due dates)
    └──enhances──> Scheduler output (includes time blocks)

Auto-subtask breakdown
    └──requires──> Task model
    └──requires──> LLM access (OpenAI API)
    └──enhances──> Scheduler (more granular blocks)

Study session generation
    └──requires──> Authentication
    └──independent of──> Scheduler (separate LLM feature)

Onboarding wizard
    └──requires──> All of: Authentication, Term/Course structure, PDF upload, Availability windows, Scheduler
    └──coordinates──> First-run experience
```

### Dependency Notes

- **Authentication is the root dependency** — nothing ships without it. It must be Phase 1.
- **Task model is the central data structure** — scheduler, views, export, and study aids all depend on it. Define it early and get it right; schema changes are expensive.
- **Scheduler requires task model AND availability windows** — both must be complete before the scheduler can produce useful output. Don't build the scheduler before both inputs are solid.
- **Extraction review screen is mandatory before tasks are saved** — LLM outputs are unreliable. Skipping the review step means bad data corrupts the plan. This is not optional.
- **Auto-reschedule enhances the scheduler** — it's the same engine invoked again; not a separate system. Build the scheduler to be re-runnable from any point.
- **Study session generation is independent** — it doesn't depend on the scheduler and can be added later without architectural change. Good candidate for v1.x.
- **Onboarding wizard coordinates all core features** — it's the last thing to polish, not the first. Build each feature standalone, then wrap in wizard UX.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Authentication (email/password, session persistence) — no auth = no product
- [ ] Term + course creation — without structure, tasks float
- [ ] Task model: assignment/exam/reading/other, due date, estimated minutes, status — the data model everything else builds on
- [ ] Manual task entry — LLM parsing must have a fallback; this is it
- [ ] PDF upload + server-side text extraction — removes re-entry friction
- [ ] LLM syllabus parsing with feature flag — the core differentiator; must be toggleable
- [ ] Extraction review / confirm screen — non-negotiable for accuracy and trust
- [ ] Availability windows (blocked times + study windows) — required by scheduler
- [ ] Planning engine: schedule tasks into available blocks by due-date priority — the actual differentiation
- [ ] Configurable block length + buffer — affects scheduler density, small config but meaningful
- [ ] Weekly view: blocks per day with assigned tasks — primary planning interface
- [ ] Daily view / Today dashboard: top 5 items, next block, risk alerts — the daily check-in
- [ ] Risk badges when workload exceeds time — surfaces hidden crunch before it hits
- [ ] Auto-reschedule: replan when blocks are missed — keeps plan current
- [ ] .ics calendar export — bridges to existing calendar tools
- [ ] Delete my data — trust signal, basic data hygiene
- [ ] Responsive design (mobile-friendly) — students check plans on phones

### Add After Validation (v1.x)

Features to add once core is working and users confirm value.

- [ ] Auto-subtask breakdown for large tasks (papers/projects) — trigger: users complain projects aren't broken down; requires LLM already working
- [ ] Study session generation from pasted notes — trigger: users ask for study help beyond scheduling; LLM infrastructure already in place
- [ ] Onboarding wizard polish — trigger: qualitative feedback that setup is confusing; all pieces exist, this is UX coordination
- [ ] Stripe billing / freemium gate — trigger: retention is proven, user base growing; deferred intentionally past initial launch

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] LMS API integration (Canvas) — defer: massive complexity, marginal gain over PDF; revisit if PDF upload proves to be a consistent friction point
- [ ] Google Calendar two-way sync — defer: .ics export covers MVP need; two-way sync requires ongoing OAuth maintenance
- [ ] Native mobile app — defer: responsive web covers mobile; build native only if usage data shows distinct mobile-first behavior patterns
- [ ] Collaboration / shared plans — defer: individual planning must be valuable first; social features are a separate product bet
- [ ] Push/email notifications — defer: in-app dashboard covers urgency signals for MVP; notifications require infrastructure investment

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Authentication | HIGH | LOW | P1 |
| Term + course structure | HIGH | LOW | P1 |
| Task model (CRUD) | HIGH | LOW | P1 |
| Manual task entry | HIGH | LOW | P1 |
| Weekly view | HIGH | MEDIUM | P1 |
| Today dashboard | HIGH | LOW | P1 |
| Availability windows | HIGH | MEDIUM | P1 |
| Planning engine (scheduler) | HIGH | HIGH | P1 |
| PDF upload + text extraction | HIGH | MEDIUM | P1 |
| LLM syllabus parsing | HIGH | HIGH | P1 |
| Extraction review screen | HIGH | MEDIUM | P1 |
| Auto-reschedule | HIGH | HIGH | P1 |
| Risk badges | MEDIUM | MEDIUM | P1 |
| .ics export | MEDIUM | LOW | P1 |
| Configurable block length | MEDIUM | LOW | P1 |
| Responsive design | HIGH | MEDIUM | P1 |
| Delete my data | LOW | LOW | P1 |
| Auto-subtask breakdown | MEDIUM | HIGH | P2 |
| Study session generation | MEDIUM | HIGH | P2 |
| Onboarding wizard polish | HIGH | MEDIUM | P2 |
| Stripe billing | LOW | HIGH | P2 |
| LMS API integration | MEDIUM | HIGH | P3 |
| Google Calendar two-way sync | MEDIUM | HIGH | P3 |
| Native mobile app | MEDIUM | HIGH | P3 |
| Push/email notifications | MEDIUM | MEDIUM | P3 |
| Collaboration features | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Notion (Student) | Canvas LMS | Google Calendar | myHomework / iStudiez | Motion / Reclaim.ai | BlockPlan Approach |
|---------|-----------------|------------|-----------------|----------------------|--------------------|--------------------|
| Task/assignment tracking | Yes (manual) | Yes (auto from courses) | No | Yes (manual) | Yes (manual) | Yes (LLM-parsed from syllabus) |
| Deadline management | Yes | Yes | Yes (manual events) | Yes | Yes | Yes (extracted + reviewed) |
| Syllabus parsing | No | No | No | No | No | Yes — core differentiator |
| Time blocking scheduler | No | No | No | No | Yes (AI-driven, general) | Yes (student-specific, availability-aware) |
| Availability-aware scheduling | No | No | No | No | Yes (work calendar-based) | Yes (study windows + blocked time) |
| Auto-reschedule | No | No | No | No | Yes (event-level) | Yes (catch-up mode for missed study blocks) |
| Study aids (LLM) | No | No | No | No | No | Yes (summaries, key terms, practice questions) |
| Calendar export (.ics) | Limited | Yes | Native | No | Limited | Yes (download) |
| Mobile responsive / app | Yes (web + app) | Yes (app) | Yes (app) | Yes (app) | Yes (web + app) | Web-only, responsive |
| LMS integration | No | Native | No | Limited | No | Out of scope MVP |
| Free tier | Yes (generous) | Free via institution | Free | Free + paid | Paid ($19+/mo) | Yes (core free, LLM features paid) |

**Key gap this product fills:** No existing tool converts a syllabus PDF into a time-blocked, adapting weekly study plan. Canvas shows deadlines passively. Notion is a blank canvas requiring manual setup. Motion/Reclaim.ai do AI scheduling but for work calendars, not academic syllabi. BlockPlan is the first tool to own the "syllabus → executable plan" workflow end to end.

---

## Sources

- Notion for Students landing page (training knowledge, confidence: MEDIUM — feature set is stable but marketing changes)
- Canvas LMS feature documentation (training knowledge, confidence: HIGH — Canvas features are well-documented and stable)
- Google Calendar capabilities (training knowledge, confidence: HIGH — stable product)
- myHomework and iStudiez Pro app store feature lists (training knowledge, confidence: MEDIUM — feature-complete apps, stable)
- Motion (usemotion.com) and Reclaim.ai feature pages (training knowledge, confidence: MEDIUM — products were well-established as of August 2025)
- Todoist for Students marketing (training knowledge, confidence: MEDIUM)
- PROJECT.md requirements list (direct source, confidence: HIGH)

**Note:** Web search (Brave API) and WebFetch were unavailable during this research session. All findings are based on training knowledge through August 2025. Recommend verifying competitor feature claims with a live web session before the roadmap is finalized, particularly for Motion and Reclaim.ai which evolve rapidly.

---

*Feature research for: Student Academic Planner / Syllabus-to-Plan Web App (BlockPlan)*
*Researched: 2026-02-28*
