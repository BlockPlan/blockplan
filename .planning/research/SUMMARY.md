# Project Research Summary

**Project:** BlockPlan — Student Academic Planner / Syllabus-to-Plan Web App
**Domain:** EdTech / Student productivity tool (academic planning + AI-assisted scheduling)
**Researched:** 2026-02-28
**Confidence:** MEDIUM-HIGH (stack HIGH, architecture HIGH, features MEDIUM, pitfalls MEDIUM)

## Executive Summary

BlockPlan occupies a genuine gap in the student productivity market: no existing tool converts a syllabus PDF into a time-blocked, adapting weekly study plan. Canvas shows deadlines passively. Notion requires fully manual setup. Motion and Reclaim.ai do AI scheduling but for work calendars, not academic syllabi. The research confirms a clear product bet — own the "syllabus → executable plan" workflow end to end — and the technical approach to build it is well-understood. The recommended stack is Next.js 16 App Router with Supabase for auth/database/storage, the Vercel AI SDK with GPT-4o-mini for syllabus parsing, and a custom TypeScript planning engine (~200 lines) for scheduling. This is a server-first architecture: Server Components fetch data, Server Actions handle mutations, and Route Handlers cover file upload and .ics export. No separate REST API layer is needed.

The core technical risk is not the LLM — it is treating LLM output as reliable input. Syllabus parsing will produce errors in production. The mandatory extraction review screen (per-item editing before any task is saved) is the primary correctness mechanism, not a UX nicety. Every phase of development must treat this as a hard requirement. The secondary risk is the data foundation: timezone handling, RLS policies, and cascade delete behavior must be decided at schema creation time. Retrofitting these is expensive — the schema is not a detail to defer.

The planning engine (scheduler) is the true differentiator. It is a custom pure TypeScript function, not a library. It must be designed to handle constraint failures gracefully (more work than hours available, past due dates, zero availability) from day one — not as hardening after the happy path works. If the scheduler silently drops tasks, students miss assignments. That is a product-ending failure mode.

---

## Key Findings

### Recommended Stack

The stack is fully resolved at verified npm versions as of 2026-02-28. Next.js 16.1.6 with the App Router is the right framework — React Server Components reduce the client bundle and Server Actions eliminate the need for a custom API layer for mutations. Supabase (supabase-js 2.98.0 + @supabase/ssr 0.8.0) handles auth, Postgres, and file storage in a single platform, which is appropriate for this scope. TypeScript strict mode is non-negotiable given LLM-parsed inputs.

For PDF extraction, use `unpdf@1.4.0` — both legacy (`pdf-parse@1.x`, abandoned) and new (`pdf-parse@2.x`, requires native canvas bindings) versions of pdf-parse are incompatible with Vercel serverless. For LLM integration, the Vercel AI SDK (`ai@6.0.105`) with `generateObject()` parses syllabus text directly into Zod-validated TypeScript objects. For dates, use `date-fns@4.1.0` + `date-fns-tz@3.2.0` — the Temporal API is still Stage 3 and must not be used. For calendar export, `ical-generator@10.0.0` has zero runtime dependencies and full RFC 5545 compliance.

**Core technologies:**
- **Next.js 16.1.6**: Full-stack React framework — App Router with RSC reduces bundle size; Server Actions replace custom REST API for mutations
- **TypeScript 5.9.3**: Type safety — required when processing LLM outputs and Supabase-generated schemas
- **Supabase (supabase-js 2.98.0)**: Auth + Postgres + Storage — per-user row-level security, PDF storage, session management in one platform
- **@supabase/ssr 0.8.0**: Required adapter for cookie-based auth in App Router Server Components
- **unpdf 1.4.0**: Server-side PDF text extraction — serverless-compatible, no native binaries
- **Vercel AI SDK (ai 6.0.105 + @ai-sdk/openai 3.0.37)**: LLM integration with `generateObject()` for Zod-typed structured syllabus parsing
- **date-fns 4.1.0 + date-fns-tz 3.2.0**: Timezone-aware date arithmetic — UTC storage, Mountain Time display
- **ical-generator 10.0.0**: .ics calendar file generation with TZID support
- **zod 4.3.6 + react-hook-form 7.71.2**: Form validation and server action payload typing
- **shadcn/ui + Tailwind CSS 4.2.1**: Accessible component primitives, utility-first responsive styling

See `.planning/research/STACK.md` for full version matrix, compatibility notes, and what NOT to use.

### Expected Features

The feature landscape is well-established. The MVP definition is clear: every feature maps to a dependency graph where authentication is the root, the task model is the central data structure, and the scheduler requires both tasks and availability windows to be complete before it can produce useful output.

**Must have (table stakes) — users expect these:**
- Authentication with session persistence — no auth means no product
- Term + course hierarchy (Term → Course → Task) — students think in semesters
- Task model: type, due date, estimated minutes, status (CRUD) — everything else depends on this
- Manual task entry — required fallback when LLM is unavailable or wrong
- Weekly calendar view — primary planning mental model for students
- Today dashboard — "what do I work on right now" is the daily check-in
- Mobile-responsive design — students check plans on phones between classes
- Data privacy (per-user RLS isolation) — non-negotiable
- Delete my data / account — trust signal, GDPR expectation

**Should have (differentiators) — competitive advantage:**
- PDF syllabus upload + server-side text extraction — removes manual re-entry friction
- LLM-assisted syllabus parsing (feature-flagged, with fallback) — the core differentiator
- Extraction review screen with per-item editing — mandatory correctness gate
- Availability windows (blocked times + study windows) — required input for scheduler
- Planning engine: time-block tasks by due-date priority — the actual gap no competitor fills
- Auto-reschedule (catch-up mode) — keeps plan current when blocks are missed
- Risk badges when workload exceeds available time — surfaces hidden crunch weeks
- .ics calendar export — bridges to existing calendar tools
- Configurable block length (25–90 min) and buffer — meaningful scheduler input

**Defer to v1.x (after validation):**
- Auto-subtask breakdown for large projects (LLM infrastructure already in place)
- Study session generation from pasted notes (independent of scheduler, addable later)
- Onboarding wizard polish (assemble last after each feature works standalone)
- Stripe billing/freemium gate (collect email signups first, validate retention)

**Defer to v2+ (after product-market fit):**
- LMS API integration (Canvas) — PDF upload works universally; LMS OAuth is massive scope
- Google Calendar two-way sync — .ics export covers MVP need adequately
- Native iOS/Android app — responsive web covers mobile for a desk tool
- Push/email notification system — in-app risk badges cover urgency for MVP
- Collaboration/shared plans — individual planning must be valuable first

See `.planning/research/FEATURES.md` for full prioritization matrix and competitor analysis.

### Architecture Approach

The architecture is server-first and layered. Pages are Server Components that fetch from Supabase via a centralized Data Access Layer (DAL), then pass typed data as props to Client Component "islands" for interactivity. All mutations go through Server Actions. File upload and .ics export use Route Handlers (the only cases where Server Actions are insufficient). Three separate Supabase clients are maintained: server (cookie-based for Server Components/Actions), browser (for Client Components), and middleware (JWT refresh only — no DB queries).

The planning engine is a pure TypeScript function (`lib/services/scheduler.ts`) with no external dependencies — input: tasks + availability, output: `ScheduledBlock[]`. It is deterministic and re-runnable from any point in the timeline, which enables auto-reschedule without a separate system.

**Major components:**
1. **Middleware** — JWT refresh on every request; session cookie kept alive; does NOT gate auth (DAL does that)
2. **Data Access Layer (lib/dal.ts)** — single entry point for all Supabase queries; calls `verifySession()` first; `React.cache()` deduplicates per-request
3. **Route Handlers (/api/upload, /api/export)** — PDF multipart upload and .ics binary download only; everything else uses Server Actions
4. **PDF Parser Service (lib/services/pdf-parser.ts)** — `unpdf` wrapper; server-only; capped at 50 pages
5. **Syllabus Extractor (lib/services/syllabus-extractor.ts)** — rule-based first, LLM (`generateObject`) second; outputs tasks with `status: 'pending_confirmation'`
6. **Planning Engine (lib/services/scheduler.ts)** — pure function; greedy due-date-first bin packing into availability windows; handles constraint failures explicitly
7. **Supabase (Auth + Postgres with RLS + Storage)** — source of truth; RLS on every table; syllabi bucket private with signed URLs

See `.planning/research/ARCHITECTURE.md` for full component diagram, data flow sequences, and anti-pattern catalog.

### Critical Pitfalls

The pitfalls research identified 8 critical failure modes. The top 5 that must be designed against from day one:

1. **PDF extraction unreliability** — Scanned PDFs return no text; Word-generated PDFs produce garbled output. Prevention: treat extraction as "best effort, user must confirm." The review screen is a mandatory gate, not optional. Test against 10 real BYU-Idaho syllabi before declaring the feature done.

2. **Supabase RLS gaps at edge cases** — INSERT policies are commonly omitted (SELECT/UPDATE/DELETE covered, INSERT forgotten). Service-role key used server-side bypasses all RLS. Prevention: write explicit SELECT/INSERT/UPDATE/DELETE policies for every table at schema creation; write two-user isolation tests before moving to feature phases; never use service-role key for user-scoped queries.

3. **Scheduler constraint failures** — More work than available hours, tasks longer than any single block, past due dates at mid-semester onboarding, zero availability windows. Prevention: define failure modes before writing scheduler code. Overloaded schedule shows risk badges, never silently drops tasks. Unit tests for each constraint scenario are exit criteria for the planning engine phase.

4. **App Router server/client component confusion** — User-specific data cached at CDN edge (serves one user's data to another); auth guard in a client component causing redirect loops; `cookies()` called from a client component. Prevention: `export const dynamic = 'force-dynamic'` on all user-data pages; auth checks in middleware and DAL only; add `'use client'` only to components that require browser APIs or state.

5. **Timezone handling treated as an afterthought** — Vercel servers run UTC; naive date storage causes wrong day display in Mountain Time; .ics events appear at wrong time. Prevention: store all dates as `TIMESTAMPTZ` in Postgres from day one; capture user timezone during onboarding (`Intl.DateTimeFormat().resolvedOptions().timeZone`); use `date-fns-tz` throughout; use `TZID` on .ics `DTSTART`/`DTEND`.

Additional critical pitfalls: LLM extraction treated as ground truth (auto-create tasks without review), file upload without size/type validation (Vercel 10s timeout on large PDFs), missing `ON DELETE CASCADE` on foreign keys (orphaned schedule blocks after course deletion).

See `.planning/research/PITFALLS.md` for full pitfall catalog, warning signs, recovery costs, and per-phase mapping.

---

## Implications for Roadmap

Based on the dependency graph from FEATURES.md and the build order from ARCHITECTURE.md, the following phase structure is recommended. Dependencies are strict — each phase's outputs are required inputs for the next.

### Phase 1: Foundation — Data Model, Auth, and Security Baseline

**Rationale:** Authentication is the root dependency of every feature. RLS policies, timezone decisions, and cascade delete behavior must be encoded in the initial schema — retrofitting these after data exists is a migration headache with HIGH recovery cost. This phase has no user-visible features but determines whether the product is secure.

**Delivers:** Supabase project with schema, RLS policies on all tables (SELECT/INSERT/UPDATE/DELETE), three Supabase client files, middleware for JWT refresh, DAL with `verifySession()`, login/signup/logout pages and Server Actions.

**Addresses (from FEATURES.md):** Authentication, per-user data isolation, delete my data.

**Avoids (from PITFALLS.md):** RLS edge cases (Pitfall 2), App Router auth confusion (Pitfall 4), timezone schema decisions (Pitfall 5), missing cascade DELETE (Pitfall 8), OpenAI key exposure.

**Research flag:** Standard patterns — Next.js auth with Supabase SSR is well-documented. Skip deeper research on this phase.

---

### Phase 2: Core Data Model and Manual Task Entry

**Rationale:** The task model (Term → Course → Task) is the central data structure. Scheduler, views, export, and study aids all depend on it. Getting the schema right — particularly the `TIMESTAMPTZ` columns, cascade behavior, and user timezone field — before any feature is built is critical. Manual task entry is also the required fallback when LLM parsing is unavailable.

**Delivers:** Terms, courses, tasks tables with RLS; DAL query functions for all entities; task CRUD UI; course list and task list pages; Today dashboard (simple filter, no scheduler yet); basic responsive layout with nav shell.

**Addresses (from FEATURES.md):** Term/course structure, task model (CRUD), manual task entry, daily "what's due" view, due date visibility/sorting, task completion.

**Avoids (from PITFALLS.md):** Timezone schema decision (Pitfall 5 — TIMESTAMPTZ from day one), N+1 query patterns (join tasks with courses), missing indexes on `user_id` and `due_date`.

**Research flag:** Standard patterns — skip deeper research on this phase.

---

### Phase 3: PDF Upload and Syllabus Parsing Pipeline

**Rationale:** This is the first differentiating feature and the highest-risk implementation. The PDF upload Route Handler, text extraction service, LLM parsing, and extraction review screen are co-developed. The review screen is not polish — it is the primary correctness mechanism. This phase must define failure modes (scanned PDFs, garbled text, LLM hallucinations) before writing any parsing code.

**Delivers:** PDF upload Route Handler (size/type validation client + server), `unpdf` text extraction service, LLM syllabus parsing with `generateObject()` (feature-flagged), extraction review screen with per-item editing, tasks written to DB as `status: 'pending_confirmation'`.

**Addresses (from FEATURES.md):** PDF upload + text extraction, LLM syllabus parsing, extraction review/confirm screen.

**Avoids (from PITFALLS.md):** PDF extraction unreliability (Pitfall 1 — review screen mandatory, test with 10 real syllabi), LLM extraction brittleness (Pitfall 6 — per-item editing, schema validation before storage), file upload without validation (Pitfall 7 — size/type on client AND server), serverless timeout on large PDFs.

**Research flag:** Needs deeper research — specifically around `unpdf` behavior with various PDF types (scanned, password-protected, multi-column layouts) and Vercel serverless timeout behavior during LLM calls. Recommend `/gsd:research-phase` before implementation.

---

### Phase 4: Availability Windows and Planning Engine

**Rationale:** The scheduler requires both tasks (Phase 2) and availability windows to produce useful output. Both inputs must be complete before the engine runs. The scheduler is the product's core differentiator and must handle constraint failures explicitly from day one — overloaded schedules surface risk badges, never silently drop tasks.

**Delivers:** Availability window UI (blocked times, study windows, configurable block length/buffer), scheduler pure function (`lib/services/scheduler.ts`) with explicit constraint handling, `schedule_blocks` table, weekly calendar view populated by scheduler output, risk badges, auto-reschedule (re-running the same scheduler from current date).

**Addresses (from FEATURES.md):** Availability windows, planning engine, configurable block length, weekly view, risk badges, auto-reschedule.

**Avoids (from PITFALLS.md):** Scheduler constraint failures (Pitfall 3 — unit tests for overload/past-due/zero-availability/long-task scenarios are exit criteria), running scheduler synchronously in the request path for complex schedules (structure as pure function for future background job migration).

**Research flag:** Needs deeper research — the scheduling algorithm's constraint model (bin packing with due-date priority + split tasks across blocks) warrants a dedicated design step before coding. Recommend `/gsd:research-phase` for the scheduler algorithm specifically.

---

### Phase 5: Calendar Export and MVP Polish

**Rationale:** Once the scheduler produces a plan, .ics export is a low-complexity feature that bridges BlockPlan to students' existing calendar tools. This phase also addresses responsive mobile layout (weekly grid on 375px), overdue alerts, and the "delete my data" account deletion flow. This is the MVP completion phase.

**Delivers:** .ics export Route Handler using `ical-generator` with correct TZID on events, mobile-responsive weekly view (day-at-a-time layout on small screens), overdue/deadline visual alerts, account deletion with cascade verification.

**Addresses (from FEATURES.md):** .ics calendar export, responsive design, deadline/overdue alerts, delete my data.

**Avoids (from PITFALLS.md):** .ics events at wrong time (use TZID, not bare UTC), generic export filename (name `blockplan-[term]-[date].ics`), weekly grid unusable on mobile.

**Research flag:** Standard patterns — `ical-generator` is well-documented. Skip deeper research on this phase.

---

### Phase 6: v1.x Enhancements (Post-Validation)

**Rationale:** These features use infrastructure already built (LLM, scheduler) but are not required to validate the core concept. Build after retention data confirms the core planning loop is valuable.

**Delivers:** Auto-subtask breakdown for large projects (LLM + scheduler integration), study session generator (summaries/key terms/practice questions from pasted notes), onboarding wizard UX coordination (assembling existing features into a guided first-run flow), Stripe freemium gate.

**Addresses (from FEATURES.md):** Auto-subtask breakdown, study session generation, onboarding wizard polish, billing.

**Research flag:** Needs research — auto-subtask breakdown prompt engineering and Stripe billing integration both warrant phase-level research before implementation.

---

### Phase Ordering Rationale

- **Foundation before features:** RLS, timezone, and cascade behavior are schema decisions. Every subsequent phase assumes these are correct. There is no safe time to retrofit them.
- **Task model before scheduler:** The scheduler needs tasks and availability; both must be schema-stable before the engine is written. A schema change to the task model after the scheduler is built requires updates in two places.
- **PDF parsing before scheduler:** The primary data entry path is PDF parsing. The scheduler is only useful when it has tasks to schedule. Building the scheduler before the parsing pipeline means testing it with seed data only — integration isn't validated until parsing works.
- **Scheduler before views:** The weekly view and dashboard derive their value from the scheduler's output. Building them before the scheduler means displaying static task lists, not the differentiated time-blocked plan.
- **Export last in MVP:** .ics export depends on the scheduler; it's low-complexity and correctly deferred until the plan it exports is accurate.

### Research Flags

**Phases needing `/gsd:research-phase` during planning:**
- **Phase 3 (PDF Parsing):** `unpdf` behavior with adversarial PDFs (scanned, password-protected, multi-column), Vercel serverless timeout limits for combined extract + LLM calls, LLM prompt design for structured extraction with confidence scores.
- **Phase 4 (Planning Engine):** Scheduler algorithm design — specifically: how to split tasks that exceed a single block, overlap detection in availability windows, and the exact bin-packing strategy for due-date-priority scheduling.
- **Phase 6 (v1.x):** Auto-subtask breakdown prompt engineering; Stripe freemium gate integration with Supabase auth.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation/Auth):** Next.js + Supabase SSR auth is heavily documented with official guides.
- **Phase 2 (Core Data Model):** Standard Supabase CRUD with RLS — well-documented patterns.
- **Phase 5 (Export/Polish):** `ical-generator` has thorough documentation; responsive Tailwind layouts are standard.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry on 2026-02-28. Compatibility matrix confirmed. `unpdf` and `ical-generator` were specifically validated as replacements for abandoned/broken alternatives. |
| Features | MEDIUM | Based on training knowledge through August 2025. Competitor feature claims (especially Motion, Reclaim.ai) should be verified with a live web session before finalizing the roadmap. The dependency graph and MVP definition are HIGH confidence — they are derived from requirements, not competitor research. |
| Architecture | HIGH | Based on official Next.js App Router docs (v16.1.6, updated 2026-02-27). Supabase + Next.js integration patterns are MEDIUM confidence (WebFetch unavailable for Supabase docs directly, but patterns are well-established in the ecosystem). |
| Pitfalls | MEDIUM | Derived from training knowledge. Core pitfalls (RLS gaps, timezone schema, scheduler constraint failures) are well-known patterns with HIGH confidence. PDF parsing failure modes and Vercel serverless limits should be verified against current documentation before Phase 3. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Competitor feature verification:** Motion and Reclaim.ai evolve rapidly. Before finalizing the roadmap, confirm their current feature set via a live web session to ensure the competitive gap analysis is still accurate.
- **Vercel serverless limits:** Free tier body size limit (cited as 4.5MB) and execution time (10s free, 60s pro) should be verified against current Vercel documentation before Phase 3. These limits directly affect the PDF upload and LLM parsing architecture.
- **`unpdf` PDF type coverage:** Verify which PDF input types `unpdf@1.4.0` handles and fails on before writing the extraction review screen's failure mode UX. This is Phase 3 pre-work.
- **Supabase RLS INSERT policy behavior:** Verify current Supabase documentation for INSERT policy defaults before writing the schema. The pitfalls research flags this as a common omission.
- **`@supabase/ssr` current patterns:** Verify the current `createServerClient` / `createBrowserClient` API surface in `@supabase/ssr@0.8.0` matches the patterns described in ARCHITECTURE.md before Phase 1 implementation.

---

## Sources

### Primary (HIGH confidence)
- npm registry (live metadata, 2026-02-28) — all package versions and compatibility
- Next.js App Router Official Docs v16.1.6 (updated 2026-02-27) — architecture patterns, Server Components, Server Actions, middleware
- PROJECT.md requirements list — feature scope and constraints

### Secondary (MEDIUM confidence)
- Training knowledge (through August 2025) — Supabase RLS patterns, Supabase Storage, @supabase/ssr conventions
- Training knowledge — competitor feature analysis (Notion, Canvas, Google Calendar, myHomework, iStudiez Pro, Motion, Reclaim.ai, Todoist)
- Training knowledge — PDF parsing library behaviors, OpenAI API patterns, iCalendar RFC 5545 spec
- Training knowledge — scheduling algorithm edge cases and constraint satisfaction patterns

### Tertiary (requires live verification)
- Vercel free tier limits (body size, execution time, memory) — verify before Phase 3
- Current Supabase RLS INSERT policy documentation — verify before Phase 1 schema creation
- Motion and Reclaim.ai current feature sets — verify before roadmap finalization

---
*Research completed: 2026-02-28*
*Ready for roadmap: yes*
