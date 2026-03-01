# Pitfalls Research

**Domain:** Student academic planner / syllabus-to-plan web app
**Researched:** 2026-02-28
**Confidence:** MEDIUM (training knowledge; WebSearch and WebFetch unavailable for verification — flag critical items for manual validation before implementation)

---

## Critical Pitfalls

### Pitfall 1: Treating PDF Extraction as Reliable Input

**What goes wrong:**
The app accepts syllabus PDFs and assumes text extraction will return clean, structured data. In practice, university syllabi are created in Word, Google Docs, scanned from paper, or produced by LaTeX — each yields dramatically different extraction output. Scanned PDFs return no text at all (only image bytes). PDFs created from Word often have garbled Unicode, merged words (no spaces between tokens), or logical reading order scrambled by multi-column layouts. Dates extracted as "1/15" are ambiguous without year context.

**Why it happens:**
Developers test with one or two clean PDFs they create themselves. Real-world syllabi from different professors span a decade of authoring tools and habits. The failure surface is not discovered until real users upload their actual course syllabi.

**How to avoid:**
- Treat extraction as "best effort, user must confirm" — never auto-schedule without an explicit review step.
- Build the extraction review screen (already in requirements) as a mandatory gate, not an optional nicety.
- Use a server-side library like `pdf-parse` or `pdfjs-dist` (Node) that handles both text-layer PDFs and returns an empty string for image-only PDFs — then show a clear "no text found" error rather than silently failing.
- For image-only PDFs: either reject with explanation ("This PDF appears to be scanned. Please paste your syllabus text instead.") or gate OCR behind the paid tier as an explicit premium feature.
- Test extraction against at least 10 real BYU-Idaho syllabi before declaring the feature done.

**Warning signs:**
- Extraction test suite uses only PDFs you generated yourself.
- "Parse" step has no fallback for empty extraction results.
- Date parsing assumes current year without explicit year injection.
- No user-facing error message when extraction returns fewer than 50 words.

**Phase to address:** Syllabus Upload & Parsing phase (must define the review screen and failure modes before building the parser, not after).

---

### Pitfall 2: Supabase RLS Policies That Pass the Happy Path but Leak on Edge Cases

**What goes wrong:**
Row Level Security is enabled on all tables, policies are written, and basic tests pass. But edge cases break the isolation: service-role bypasses RLS entirely (any server-side code using the service key can read all user data), policies written against `auth.uid()` fail silently when called from a context where the JWT is not propagated, and INSERT policies are forgotten while SELECT/UPDATE/DELETE are covered.

**Why it happens:**
Supabase has two client modes: the anon/user client (respects RLS) and the service-role client (bypasses RLS). Developers use the service-role key server-side for convenience without realizing it removes all row isolation. INSERT policies are less obvious than SELECT policies and are often omitted. Supabase's policy editor does not warn when a table has SELECT but no INSERT policy.

**How to avoid:**
- **Never expose the service-role key to the browser.** Use it only in server-side route handlers and only for admin operations (e.g., storage bucket management, not reading user task data).
- Write explicit policies for ALL four operations (SELECT, INSERT, UPDATE, DELETE) on every table. The default when no policy matches is DENY, but this is easy to overlook for INSERT.
- Use `auth.uid() = user_id` as the standard policy pattern, not role-based checks unless you need them.
- Write an RLS test suite: create two test users, insert data as user A, verify user B cannot read/update/delete it. Run this against every table.
- In server route handlers that act on behalf of a user, always use the user's JWT (passed from the client or extracted from the session cookie) — not the service role — when performing user-scoped queries.

**Warning signs:**
- Server-side Supabase client initialized with `SUPABASE_SERVICE_ROLE_KEY` and used for task/assignment queries.
- No integration tests asserting cross-user data isolation.
- Tables with SELECT policies but no INSERT policies (common omission).
- `select * from tasks` in a route handler that doesn't filter by `user_id` because "RLS handles it" — but RLS is bypassed by the key in use.

**Phase to address:** Foundation/Auth phase — RLS policies must be defined when tables are created, not added later. Adding RLS after data exists is error-prone and requires retroactive policy testing.

---

### Pitfall 3: Scheduling Algorithm That Breaks on Constraint Conflicts

**What goes wrong:**
The planning engine places tasks into available time blocks. It works for the happy path (enough blocks, no conflicts). But it has no defined behavior for: (a) more work than available hours, (b) a task with an estimated duration longer than any single available block, (c) a due date in the past when the user first opens the app mid-semester, (d) zero availability windows defined by the user, (e) overlapping availability windows entered by mistake. The scheduler either crashes, produces an infinite loop, or silently drops tasks.

**Why it happens:**
Scheduling is typically built with the happy path in mind. Edge cases feel like UX polish but are actually correctness requirements — if the scheduler drops a task silently, the student misses an assignment.

**How to avoid:**
- Define the failure modes before writing scheduling code: what happens in each impossible-to-schedule scenario?
- Overload scenario: schedule what fits by due date priority, surface a risk badge for unschedulable work, never silently drop tasks.
- Long task / short block: split tasks across multiple blocks automatically (already implied by the "configurable block length" requirement).
- Past due dates: treat them as highest priority ("overdue") or allow the user to mark them complete/dropped during onboarding — don't schedule them into past time slots.
- Zero availability: block onboarding progression until at least one availability window is defined; show an inline error.
- Overlapping windows: merge or reject at input time, not at schedule-time.
- Write unit tests for each edge case with known input/output before touching the UI.

**Warning signs:**
- Scheduler has no explicit "task cannot be scheduled" return state — only a scheduled list.
- No test with total task hours > total available hours.
- Due dates are stored as-is from extraction without validation against term start date.
- Availability setup allows saving with zero windows defined.

**Phase to address:** Planning Engine phase — define the constraint model and edge case behavior in the phase spec before writing any scheduler code. Unit tests for each constraint scenario are exit criteria for that phase.

---

### Pitfall 4: Next.js App Router Server/Client Component Confusion Causing Data Leaks or Broken Auth

**What goes wrong:**
App Router's server/client component boundary is subtle. Developers accidentally render user-specific data in a server component that gets cached at the CDN edge, serving one user's data to another. Or they move auth logic into a client component where the session is not available on first render, causing a flash of unauthenticated state or a redirect loop. Or they use `cookies()` from `next/headers` inside a component that is client-rendered, getting a runtime error.

**Why it happens:**
The App Router's caching behavior is different from Pages Router. Server components cache by default; dynamic data requires explicit `cache: 'no-store'` or `dynamic = 'force-dynamic'`. The distinction between what runs on the server vs. client is less obvious than the old `getServerSideProps` pattern.

**How to avoid:**
- All pages that render user-specific data must use `export const dynamic = 'force-dynamic'` or fetch with `{ cache: 'no-store' }` to prevent CDN caching of personal data.
- Auth checks belong in server components or middleware — not client components that have a render-then-redirect pattern.
- Use Next.js middleware (`middleware.ts`) to protect routes: check for a valid session cookie before the page renders, redirect to login immediately if missing.
- Never pass raw database rows from server components to client components as props — pass only the data the client component needs to render.
- Add `'use client'` only to components that need browser APIs, event handlers, or state. Keep data fetching in server components.

**Warning signs:**
- Dashboard page has no `dynamic = 'force-dynamic'` or `cache: 'no-store'` on its data fetches.
- Auth guard is implemented as a `useEffect` redirect in a client component rather than middleware.
- Components that call `cookies()` or `headers()` from `next/headers` are marked `'use client'`.
- No E2E test that logs in as user A, logs out, logs in as user B, and verifies user A's tasks don't appear.

**Phase to address:** Foundation/Auth phase — establish the auth middleware pattern before any feature pages are built. Fixing this after all pages are built requires touching every route.

---

### Pitfall 5: Time Zone Handling Treated as an Afterthought

**What goes wrong:**
Due dates extracted from syllabi are stored and compared as naive dates (no time zone). The scheduling engine uses JavaScript `new Date()` which reflects the server's time zone (UTC on Vercel). A student in Mountain Time sees assignments due "today" show up as due "tomorrow" or vice versa. The weekly view renders Monday–Sunday incorrectly for users in non-UTC zones. Calendar export (.ics) produces events at the wrong time.

**Why it happens:**
BYU-Idaho is in Rexburg, Idaho (Mountain Time), so the developer tests locally and everything looks right. Vercel servers run UTC. The gap between local dev and production timezone is only discovered after deploy.

**How to avoid:**
- Store all due dates and availability windows as UTC timestamps in the database, never as naive date strings.
- Accept that "due dates" for courses are typically midnight in the user's local time zone — store as `TIMESTAMPTZ` with the offset applied.
- In the UI, use a date library that is timezone-aware (e.g., `date-fns-tz` or `Temporal` API when available) to display dates in the user's local time zone, not UTC.
- Capture the user's time zone during onboarding (or detect it from the browser with `Intl.DateTimeFormat().resolvedOptions().timeZone`) and store it on the user profile.
- For .ics export, include `TZID` on each event — bare UTC `Z` timestamps in calendar events cause display issues in some clients.
- Test by setting your OS clock to UTC and verifying all due dates still display correctly in Mountain Time.

**Warning signs:**
- Due dates stored as `DATE` type (no time component) rather than `TIMESTAMPTZ`.
- Scheduling engine uses `new Date()` without explicit time zone handling.
- No `timeZone` field on the user profile table.
- .ics export uses `new Date().toISOString()` without converting to user's local time.

**Phase to address:** Foundation phase (data model) — the `TIMESTAMPTZ` vs `DATE` decision must be made when the schema is created. Changing date column types after data exists is a migration headache.

---

### Pitfall 6: LLM Extraction Brittleness Treated as a Reliability Problem (It's a UX Problem)

**What goes wrong:**
LLM-assisted syllabus parsing is used to extract assignments, due dates, and task types. The output is treated as ground truth and tasks are auto-created without review. The LLM hallucinates due dates, merges two assignments into one, or extracts a reading list item as an assignment. Students then miss real deadlines because the schedule was built on wrong data.

**Why it happens:**
LLM output for structured extraction looks impressive in demos but has a real error rate in production. Developers demo with clean syllabi, ship to production, and users encounter the failure modes.

**How to avoid:**
- The extraction review screen (already in requirements) is the correct architectural response. Treat it as a mandatory step in the user flow, not a "confirm if you want to" optional step.
- Structure the LLM prompt to output JSON with explicit confidence scores per extracted item — surface low-confidence items to the user for manual review.
- Never auto-create calendar blocks from LLM output without user confirmation of the task list.
- Include a "this looks wrong — edit it" affordance on every extracted item, not just a global "looks good" button.
- Validate LLM output against a schema before rendering (e.g., reject any extracted due date that falls outside the term date range).

**Warning signs:**
- The extraction review screen has a single "Confirm All" button with no per-item editing.
- LLM output is passed directly to the task creation function without schema validation.
- No handling for LLM API timeout or rate limit errors (user gets a blank screen).
- Extraction results are stored immediately; the review screen is rendered from the stored data rather than from the LLM response before storage.

**Phase to address:** Syllabus Parsing phase — the LLM prompt design and the review screen are co-developed. The review screen is not polish added at the end; it is the primary correctness mechanism.

---

### Pitfall 7: Supabase Storage Upload Without Size and Type Validation

**What goes wrong:**
Users upload syllabus PDFs. Without server-side validation, a user can upload a 50MB video file, an executable, or a 1000-page document that causes pdf-parse to time out the serverless function. On Vercel's free tier, serverless functions have a 10-second execution limit and a 4.5MB body size limit for the default runtime. A large PDF upload fails with a cryptic error or times out with no user feedback.

**Why it happens:**
Storage policies in Supabase restrict which bucket a user can upload to but don't enforce file type or size at the application layer. Vercel's body size limit is not visible until a real upload fails in production.

**How to avoid:**
- Enforce `max size: 10MB` and `accepted types: application/pdf` on the client upload input AND validate server-side in the API route before passing to storage.
- Use Supabase Storage's built-in `allowedMimeTypes` and `maxFileSize` storage bucket policies as a second layer of defense.
- For PDF processing (text extraction), use a background job or streaming approach rather than blocking the serverless function — or use Supabase Edge Functions which have longer execution limits.
- Show a progress indicator during upload so users know something is happening. A silent hang is worse than a clear error.
- Cap text extraction to the first N pages (e.g., 50) for performance — most syllabi are under 10 pages.

**Warning signs:**
- Upload route handler reads the entire file into memory before processing.
- No `maxSize` check before calling the PDF parser.
- PDF parser is called synchronously inside the Next.js API route with no timeout handling.
- No client-side file type check before upload initiates.

**Phase to address:** Syllabus Upload phase — size/type validation is a Day 1 requirement, not a hardening step.

---

### Pitfall 8: Missing Cascade Behavior in the Data Model

**What goes wrong:**
A student deletes a course. The tasks, time blocks, and scheduled sessions associated with that course remain orphaned in the database. The weekly view renders empty blocks with no associated task. Or worse: the planner tries to reference the deleted course and throws a 500 error. Similarly, deleting a term leaves courses orphaned.

**Why it happens:**
Foreign key constraints are added, but `ON DELETE CASCADE` is not specified. Developers test deletion at the leaf node (task deletion) but not at the parent node (course deletion, term deletion).

**How to avoid:**
- Define cascade behavior for every foreign key relationship at schema creation time: `terms → courses → tasks → time_blocks` should all cascade on parent deletion.
- Decide explicitly: when a course is deleted, should its tasks be deleted (cascade) or reassigned (no cascade)? For this app, cascade is the right answer — a course's tasks are meaningless without the course.
- Write a delete-course integration test that verifies tasks, blocks, and sessions are cleaned up.
- Consider a soft-delete pattern (add `deleted_at` column) for courses and terms so students can recover accidentally deleted items — but commit to this pattern from the start, not as a retrofit.

**Warning signs:**
- Foreign keys defined without `ON DELETE` behavior specified (defaults to RESTRICT which causes 500 errors on deletion).
- No integration test for "delete parent, verify children removed."
- Delete course UI shows a confirmation dialog but doesn't handle the cascade result in the UI (stale data in weekly view).

**Phase to address:** Foundation/Data Model phase — cascade behavior is a schema decision. Changing FK constraints after data exists requires careful migration.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip RLS on "internal" tables (e.g., scheduling_config) | Faster development | Cross-user data leakage if config contains user preferences | Never — apply RLS to all tables from day one |
| Store due dates as plain `DATE` strings | Simpler inserts | Wrong dates for any user not in Mountain Time; .ics export broken | Never — use `TIMESTAMPTZ` from the start |
| Use service-role key in client-side code | Avoids auth token passing complexity | All RLS policies bypassed; complete data exposure | Never |
| Skip the extraction review step for "obvious" syllabus formats | Faster UX flow | Students miss assignments because of silent extraction errors | Never — review step is the correctness safety net |
| Hard-code BYU-Idaho's Mountain Time in the scheduler | No time zone UI needed for MVP | Breaks for any student traveling or using a different locale | Acceptable only in a very early prototype, remove before launch |
| Generate the weekly plan synchronously in the API route | Simpler code | Vercel function timeout on complex schedules; no progress feedback | Acceptable for MVP if schedule generation stays under 5 seconds; add background job when it exceeds that |
| No per-item editing in the extraction review screen | Faster to build | Students who find errors abandon the app rather than fix them | Never — per-item editing is table stakes for the review step |
| Skip cascade DELETE definitions on FKs | Schema is simpler initially | Orphaned data causes UI errors when parents are deleted | Never — define cascade behavior at schema creation |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase Auth + Next.js App Router | Using `createClient` from `@supabase/supabase-js` in a server component without the SSR helper — session is not available server-side | Use `@supabase/ssr` package with `createServerClient` for server components and `createBrowserClient` for client components |
| Supabase Storage + PDF upload | Uploading directly from the browser to storage, then fetching from storage in a server function for parsing — two round trips, and the storage URL may not be publicly accessible | Upload to a server-side API route, parse in-memory, then store the extracted text — not the raw PDF for parsing purposes |
| OpenAI API + serverless | Awaiting a full OpenAI completion in a Next.js API route — times out for long syllabi | Use streaming responses or offload to a background queue; stream the LLM response to the client progressively |
| .ics calendar export | Using `new Date().toISOString()` for DTSTART — produces UTC-only events that display at wrong time in many calendar apps | Use `TZID` parameter on DTSTART/DTEND with the user's time zone identifier (e.g., `America/Boise`) |
| Supabase RLS + server-side data fetching | Using the service-role client for user-scoped queries "because it's server-side and safe" — bypasses all RLS | Use the user's JWT to create a Supabase client in server components: `createServerClient` with the user's session from cookies |
| pdf-parse + Vercel serverless | Large PDFs cause the function to exceed memory or time limits — silent 500 error | Set a page limit on extraction (first 50 pages), add explicit try/catch with user-facing error, test with a 10MB PDF |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recalculating the entire weekly plan on every page load | Weekly view is slow to load, especially for students with many courses | Cache the generated plan in the database (schedule table), invalidate only when tasks or availability change | Noticeable at 5+ courses with 20+ tasks each |
| Fetching all tasks without pagination and filtering in JavaScript | Task list is fast early in the term, slows as the term progresses | Always filter by term_id and status at the database level; use indexes on `due_date` and `status` columns | Noticeable beyond 200 tasks (which is realistic for a full semester) |
| N+1 queries: fetching course for each task in a loop | Dashboard load time grows linearly with task count | Join tasks with courses in a single query; use Supabase's `.select('*, course(*)')` syntax | Noticeable beyond 20 tasks |
| No index on `user_id` foreign keys | Every user-scoped query does a full table scan | Add index on `user_id` for every table (Supabase doesn't do this automatically for FK columns in all cases) | Noticeable beyond 1,000 total rows in a table |
| PDF extraction blocking the request thread | Upload spinner hangs for 10+ seconds with large PDFs | Extract text asynchronously; return a 202 Accepted and poll for completion | Any PDF over 2MB on a slow connection |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing OpenAI API key in client-side environment variable (`NEXT_PUBLIC_OPENAI_KEY`) | Key exposed in browser, can be used to run up charges by anyone who visits the site | Keep as `OPENAI_API_KEY` (no `NEXT_PUBLIC_` prefix); only call OpenAI from server-side route handlers |
| No rate limiting on the syllabus parsing endpoint | Malicious user makes thousands of LLM requests using one account, drives up API bill | Add per-user rate limiting on the parsing endpoint (e.g., max 10 parses per day per user); track usage in the database |
| Serving raw PDF files from Supabase Storage with public bucket | Anyone with the storage URL can download another user's syllabus | Use a private Supabase Storage bucket; generate signed URLs server-side for temporary access |
| No validation that uploaded file belongs to the authenticated user before parsing | User A submits the storage path of User B's PDF to the parse endpoint | Validate on the server that the storage path being parsed belongs to the requesting user's storage folder |
| Missing `httpOnly` and `secure` on session cookies | Session hijacking via XSS | Use Supabase SSR package which sets cookies correctly; do not manually set session cookies |
| Trusting LLM-extracted content without sanitization | If LLM output contains HTML/script tags and is rendered as HTML, XSS is possible | Always render LLM output as plain text, never as `dangerouslySetInnerHTML`; sanitize before storing |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Extraction review screen shows raw extracted JSON for editing | Students are confused by technical format; abandon the app | Show a card-per-task UI with editable fields (title, due date, type, estimated time) — not raw JSON |
| Planning engine runs silently after availability is set | Students don't know a plan was generated; they look for a button | Trigger plan generation explicitly (a "Generate My Plan" button) and show a loading state, then redirect to the weekly view |
| Weekly view shows all tasks including completed ones with no visual distinction | Cognitive overload; students can't tell what needs action | Mark completed tasks visually distinct (strikethrough, muted color) and allow filtering to "active only" |
| Risk badges appear without explanation | Students see a red badge but don't know what to do | Risk badge should link to a tooltip or modal explaining "You have 12 hours of work and only 8 hours available this week. Consider: [options]" |
| Onboarding forces all steps before any value is shown | Students abandon before seeing a plan | Show a preview of what the plan will look like after the first course is added; don't require all syllabi before showing value |
| Auto-reschedule runs without telling the user | Student's Monday plan looks different than it did Sunday with no explanation | When the plan is rescheduled, show a "Your plan was updated — here's what changed" summary notification |
| Calendar export downloads a file with a generic name like `download.ics` | Students aren't sure what the file is | Name the export `blockplan-[term]-[date].ics` |

---

## "Looks Done But Isn't" Checklist

- [ ] **PDF Upload:** Works with a clean PDF you created — but has it been tested with a scanned image PDF, a password-protected PDF, and a PDF with columns? Verify the "no text found" error path.
- [ ] **Extraction Review:** Has a "Confirm All" button — but does each item have an edit affordance? Verify per-item title, date, and type can be changed before confirming.
- [ ] **RLS Policies:** Policies exist on all tables — but are INSERT policies defined alongside SELECT? Verify by creating two test users and confirming cross-user isolation.
- [ ] **Schedule Generation:** Generates a plan for the happy path — but what does it do when total task hours exceed available hours? Verify risk badges appear and no tasks are silently dropped.
- [ ] **Time Zones:** Plan looks correct locally — but has it been tested with the server running in UTC and the user in Mountain Time? Verify due dates and block times display correctly.
- [ ] **Auto-Reschedule:** Reschedules when blocks are missed — but does it notify the user what changed? Verify a "plan updated" message surfaces after reschedule.
- [ ] **"Delete My Data":** Deletes user account — but are all child records (tasks, schedules, uploaded files in storage) also deleted? Verify with a storage bucket audit.
- [ ] **LLM Fallback:** LLM parsing works when the API is up — but what does the user see when the OpenAI API returns a 429 rate limit or 500 error? Verify a graceful error with manual entry fallback.
- [ ] **Calendar Export:** .ics file downloads — but do events appear at the correct time in Google Calendar and Apple Calendar? Verify with TZID on DTSTART/DTEND.
- [ ] **Mobile Responsiveness:** Looks correct on a 375px viewport — but is the weekly grid (7 days) usable on mobile or does it require horizontal scrolling? Verify the weekly view has a mobile-appropriate layout (e.g., day-at-a-time swipe or compressed view).

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS policies missing or wrong after launch | HIGH | Audit all policies against all tables; write and run isolation tests; patch policies in a migration; notify affected users if data was exposed |
| Date storage in naive DATE type instead of TIMESTAMPTZ | HIGH | Write a migration to convert columns; backfill existing data with an assumed offset; test all date display paths; may require user notification to re-confirm due dates |
| Service-role key used for user-scoped queries | HIGH | Audit all server-side Supabase client instantiations; replace with user-JWT-scoped clients; deploy and regression test all protected routes |
| Scheduler silently drops tasks when overloaded | MEDIUM | Add "unscheduled tasks" overflow bucket to the data model; surface these tasks in a "needs scheduling" view; existing data requires a backfill to identify dropped tasks |
| Extraction review auto-confirmed without per-item editing | MEDIUM | Rebuild the review screen with per-item editing (UI work only); existing confirmed tasks remain and users must manually correct them |
| LLM output stored without validation causing bad task data | MEDIUM | Add schema validation to the parsing pipeline; provide a "re-parse this syllabus" option on the course detail page so users can correct bad initial extractions |
| PDF storage bucket is public instead of private | HIGH | Switch bucket to private immediately; audit access logs for unauthorized downloads; generate new signed-URL approach for all existing stored PDFs |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| PDF extraction unreliability | Syllabus Upload & Parsing | Test with 10 real BYU-Idaho syllabi; verify "no text" error path; confirm review screen is mandatory gate |
| Supabase RLS edge cases | Foundation / Auth | Write two-user isolation tests for every table before moving to feature phases |
| Scheduling constraint failures | Planning Engine | Unit tests for: overloaded schedule, past due dates, zero availability, tasks longer than blocks |
| App Router server/client confusion | Foundation / Auth | Auth middleware in place before any feature pages; dynamic flag on all user-data pages |
| Time zone handling | Foundation / Data Model | `TIMESTAMPTZ` columns in initial schema; time zone stored on user profile; test with UTC server clock |
| LLM extraction brittleness | Syllabus Parsing | Review screen has per-item editing; LLM output validated against schema before storage; error handling for API failures |
| File upload without validation | Syllabus Upload | Size/type validation on client AND server before any processing; test with 10MB file and non-PDF file |
| Missing cascade DELETE | Foundation / Data Model | All FKs defined with `ON DELETE CASCADE`; delete-parent integration tests |
| OpenAI key exposure | Foundation / Auth | Environment variable audit: no `NEXT_PUBLIC_` on secret keys; LLM calls only from server routes |
| Raw PDF storage in public bucket | Foundation / Auth | Private bucket policy from day one; signed URL pattern established before upload feature ships |

---

## Sources

- Training knowledge: Next.js App Router documentation patterns (HIGH confidence for documented behaviors, MEDIUM for edge cases)
- Training knowledge: Supabase RLS documentation and known gotchas (MEDIUM confidence — verify against current Supabase docs before implementation)
- Training knowledge: PDF parsing library behaviors (`pdf-parse`, `pdfjs-dist`) (MEDIUM confidence — verify current version behavior and Vercel serverless limits)
- Training knowledge: OpenAI API rate limiting and streaming patterns (MEDIUM confidence — verify current rate limits and streaming API behavior)
- Training knowledge: iCalendar (.ics) TZID specification (MEDIUM confidence — RFC 5545 is stable, implementation details may vary by calendar client)
- Training knowledge: Scheduling algorithm edge cases — derived from the project requirements and general constraint satisfaction problem patterns (MEDIUM confidence)

**Note:** WebSearch and WebFetch were unavailable during this research session. All findings are based on training data (knowledge cutoff August 2025). Before implementation, manually verify:
1. Current Supabase RLS documentation for any new policy syntax
2. Current `@supabase/ssr` package patterns for Next.js App Router
3. Current Vercel free tier limits (body size, execution time, memory)
4. Current `pdf-parse` or `pdfjs-dist` Node.js version compatibility

---
*Pitfalls research for: Student academic planner / syllabus parser / scheduling web app (BlockPlan)*
*Researched: 2026-02-28*
