# Architecture Research

**Domain:** Student academic planner / syllabus-to-plan web app
**Researched:** 2026-02-28
**Confidence:** HIGH (Next.js App Router patterns from official docs v16.1.6, current as of 2026-02-27)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Auth Pages  │  │  Onboarding  │  │   App Shell / Nav    │   │
│  │  (login/reg) │  │  Wizard      │  │   (Client Component) │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │             Interactive UI Layer (Client Components)      │    │
│  │  CalendarView │ TaskEditor │ ScheduleGrid │ StudySession  │    │
│  └──────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                     Next.js Server Layer                          │
│  ┌────────────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │ Server Actions │  │ Route Handlers│  │  Middleware         │  │
│  │ (mutations)    │  │ /api/* (PDF,  │  │  (auth check +     │  │
│  │                │  │  ICS export)  │  │   session refresh)  │  │
│  └────────────────┘  └───────────────┘  └────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Server Components (data fetching)            │    │
│  │  DashboardPage │ WeeklyPlanPage │ TaskListPage            │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Data Access Layer (DAL)                      │    │
│  │  verifySession() │ getUser() │ getTasks() │ getSchedule() │    │
│  └──────────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────────┤
│                       Service Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PDF Parser  │  │  Planning    │  │  Study Session        │   │
│  │  Service     │  │  Engine      │  │  Generator            │   │
│  │  (pdf-parse) │  │  (scheduler) │  │  (OpenAI, optional)  │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├──────────────────────────────────────────────────────────────────┤
│                     Supabase (Backend)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Auth        │  │  Postgres DB │  │  Storage             │   │
│  │  (sessions)  │  │  (RLS on)    │  │  (PDF uploads)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| Middleware | Auth session check on every request, redirect unauthenticated users, refresh session cookie | `middleware.ts` at project root — reads JWT from cookie, fast path (no DB call) |
| Server Components (pages) | Fetch user data from Supabase server-side, render initial HTML, pass data to Client Components | `app/(app)/*/page.tsx` — async Server Components |
| Client Components | Handle interactivity: form inputs, calendar drag-drop, task toggles, optimistic UI | `'use client'` components for anything with state/events |
| Server Actions | Handle all data mutations: create task, mark complete, reschedule, confirm extraction | `app/lib/actions/*.ts` with `'use server'` directive |
| Route Handlers | Handle binary/streaming responses: PDF upload endpoint, `.ics` file download | `app/api/*/route.ts` — used where Server Actions cannot return raw file data |
| Data Access Layer (DAL) | Centralized auth verification + typed Supabase queries — every data access goes through here | `app/lib/dal.ts` — uses `React.cache()` for request deduplication |
| PDF Parser Service | Server-side extraction of text from PDF uploads using `pdf-parse` | `app/lib/services/pdf-parser.ts` — runs only in Route Handler or Server Action |
| Planning Engine | Deterministic scheduler: takes tasks + availability → produces time-blocked weekly plan | `app/lib/services/scheduler.ts` — pure TypeScript, no external deps |
| Study Session Generator | LLM call to OpenAI to produce summaries, key terms, practice questions from pasted notes | `app/lib/services/study-session.ts` — feature-flagged, graceful degradation |
| Supabase Clients | Three distinct clients: server-side (cookies), browser-side, middleware | `app/lib/supabase/server.ts`, `browser.ts`, `middleware.ts` |

## Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Route group: public auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (app)/                   # Route group: protected app pages
│   │   ├── layout.tsx           # Shared app shell (nav, sidebar)
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Today view: top 5 tasks, next block
│   │   ├── onboarding/
│   │   │   └── page.tsx         # Multi-step wizard (term, courses, syllabi, availability)
│   │   ├── courses/
│   │   │   ├── page.tsx         # Course list
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx     # Course detail, syllabus upload
│   │   │       └── tasks/
│   │   │           └── page.tsx # Task review + confirmation screen
│   │   ├── plan/
│   │   │   ├── page.tsx         # Weekly schedule view
│   │   │   └── [week]/
│   │   │       └── page.tsx     # Specific week view
│   │   ├── settings/
│   │   │   └── page.tsx         # Availability, block length, delete data
│   │   └── study/
│   │       └── page.tsx         # Study session generator
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts         # PDF upload handler (multipart/form-data)
│   │   ├── parse/
│   │   │   └── route.ts         # PDF text extraction + LLM parsing trigger
│   │   └── export/
│   │       └── route.ts         # .ics calendar file generation + download
│   ├── layout.tsx               # Root layout (html, body, providers)
│   └── globals.css
├── lib/
│   ├── supabase/
│   │   ├── server.ts            # createServerClient() for Server Components/Actions
│   │   ├── browser.ts           # createBrowserClient() for Client Components
│   │   └── middleware.ts        # createServerClient() for middleware
│   ├── dal.ts                   # Data Access Layer: verifySession, getUser, getTasks, etc.
│   ├── actions/
│   │   ├── auth.ts              # signup, login, logout Server Actions
│   │   ├── tasks.ts             # createTask, updateTask, deleteTask, markComplete
│   │   ├── schedule.ts          # triggerReschedule, confirmBlock, missBlock
│   │   └── courses.ts           # createCourse, uploadSyllabus, confirmExtraction
│   ├── services/
│   │   ├── pdf-parser.ts        # pdf-parse wrapper, text extraction
│   │   ├── syllabus-extractor.ts # Rule-based + OpenAI extraction logic
│   │   ├── scheduler.ts         # Planning engine: tasks + availability → schedule
│   │   ├── study-session.ts     # OpenAI study session generator
│   │   └── ics-generator.ts    # .ics file construction from schedule
│   ├── types/
│   │   ├── database.ts          # Generated Supabase types (supabase gen types)
│   │   └── app.ts               # Application-level types (Task, Course, Block, etc.)
│   └── utils/
│       ├── date.ts              # Date arithmetic helpers
│       └── time-blocks.ts       # Block overlap detection, availability parsing
├── components/
│   ├── ui/                      # Primitive UI components (Button, Input, Modal)
│   ├── layout/                  # Nav, Sidebar, AppShell
│   ├── calendar/                # WeeklyGrid, DayColumn, TimeBlock
│   ├── tasks/                   # TaskCard, TaskForm, TaskList
│   ├── onboarding/              # WizardStep, AvailabilityPicker, CourseForm
│   └── study/                   # StudySessionPanel, NotesInput, ResultsDisplay
└── middleware.ts                 # Auth session check (runs on every request)
```

### Structure Rationale

- **`(auth)` and `(app)` route groups:** Route groups let the auth pages and app pages have different layouts (no nav bar on login/signup) without affecting the URL. The `(app)` layout wraps every protected page with the nav/shell and performs an auth check via the DAL.
- **`lib/dal.ts` as single entry point for data:** All data access goes through the DAL. Every query calls `verifySession()` first. This ensures no page or Server Action can accidentally read another user's data.
- **`lib/services/` for domain logic:** The PDF parser, scheduler, and study session generator are pure service functions with no HTTP/framework coupling. They can be tested independently and swapped without touching route files.
- **`lib/supabase/` split into three clients:** Supabase requires different client configurations for Server Components (cookie-based), browser (anonymous), and middleware (cookie mutation). Separating them prevents accidentally using the wrong client context.
- **`app/api/` Route Handlers for binary responses only:** Server Actions cannot return raw file streams or binary data. Route Handlers handle PDF upload (multipart form) and `.ics` export (binary download). Everything else uses Server Actions.

## Architectural Patterns

### Pattern 1: Server Component + Client Island

**What:** Pages are Server Components that fetch data from Supabase and pass it as props to small, focused Client Components ("islands") for interactivity.

**When to use:** All primary views. The weekly plan page fetches schedule server-side; the interactive task-check-off component is a Client Island.

**Trade-offs:** Fast initial load, no client-side data waterfall, reduced JS bundle. Downside: optimistic updates require explicit handling (useOptimistic or state management).

**Example:**
```typescript
// app/(app)/plan/page.tsx — Server Component
import { ScheduleGrid } from '@/components/calendar/ScheduleGrid'
import { getWeeklySchedule } from '@/lib/dal'

export default async function PlanPage() {
  const schedule = await getWeeklySchedule() // fetches from Supabase server-side
  return <ScheduleGrid schedule={schedule} /> // ScheduleGrid is 'use client'
}

// components/calendar/ScheduleGrid.tsx — Client Component
'use client'
import { useState } from 'react'
export function ScheduleGrid({ schedule }) {
  const [optimisticSchedule, setOptimistic] = useState(schedule)
  // handles drag/drop, task completion clicks
}
```

### Pattern 2: Server Actions for All Mutations

**What:** Form submissions and data mutations use Server Actions — async functions marked `'use server'` that run on the server, directly calling the DAL/Supabase.

**When to use:** Every mutation: creating tasks, confirming syllabus extraction, marking blocks complete, rescheduling. Avoids building a separate REST API layer.

**Trade-offs:** Simpler than REST (no API route + fetch pair needed). Integrated with Next.js caching (revalidatePath). Limitation: dispatched one at a time (not parallel). For parallel writes, use a Route Handler.

**Example:**
```typescript
// lib/actions/tasks.ts
'use server'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/lib/dal'
import { createServerClient } from '@/lib/supabase/server'

export async function markTaskComplete(taskId: string) {
  const { userId } = await verifySession() // auth check first
  const supabase = await createServerClient()

  await supabase
    .from('tasks')
    .update({ status: 'complete' })
    .eq('id', taskId)
    .eq('user_id', userId) // RLS belt-and-suspenders

  revalidatePath('/dashboard')
  revalidatePath('/plan')
}
```

### Pattern 3: Data Access Layer with React.cache()

**What:** All Supabase queries are wrapped in a DAL module. Each query function calls `verifySession()` first and is wrapped with `React.cache()` for deduplication.

**When to use:** Every data read. No page or Server Action should construct raw Supabase queries outside the DAL.

**Trade-offs:** Adds a layer of indirection, but provides a single place to audit security, change queries, and enforce auth. `React.cache()` means the same query called in a layout AND a page in the same request only hits Supabase once.

**Example:**
```typescript
// lib/dal.ts
import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export const verifySession = cache(async () => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { userId: user.id }
})

export const getTasksForCourse = cache(async (courseId: string) => {
  const { userId } = await verifySession()
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', userId)
    .order('due_date', { ascending: true })
  return data ?? []
})
```

### Pattern 4: PDF Upload via Route Handler + Storage

**What:** PDF uploads use a Route Handler (`/api/upload`) that receives a multipart form, validates the file, uploads to Supabase Storage, then triggers text extraction server-side.

**When to use:** File uploads — Server Actions cannot handle multipart form data reliably for large files. Route Handlers handle streaming uploads properly.

**Trade-offs:** Requires a separate API endpoint, but gives full control over file validation, storage path, and post-upload triggers. Keep upload and parse as separate endpoints to allow retries on parsing failures.

**Example:**
```typescript
// app/api/upload/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'

export async function POST(request: Request) {
  const { userId } = await verifySession()
  const formData = await request.formData()
  const file = formData.get('syllabus') as File

  // Validate: PDF only, max 10MB
  if (!file.type.includes('pdf') || file.size > 10_000_000) {
    return Response.json({ error: 'Invalid file' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const path = `${userId}/${crypto.randomUUID()}.pdf`

  await supabase.storage
    .from('syllabi')
    .upload(path, file, { contentType: 'application/pdf' })

  return Response.json({ path })
}
```

### Pattern 5: Middleware for Session Refresh (Not Auth Gate)

**What:** Middleware reads the Supabase session cookie on every request and refreshes it if near expiry. It does NOT perform database queries — it only reads from the cookie.

**When to use:** Always — this is the Supabase-recommended pattern for Next.js. The actual auth check happens in the DAL, not middleware.

**Trade-offs:** Supabase JWTs expire frequently (1 hour default). Without middleware refreshing cookies, users get silently logged out during long sessions. Middleware adds ~1ms per request but is critical for session health.

## Data Flow

### Request Flow: View Weekly Plan

```
User navigates to /plan
    ↓
middleware.ts
  → reads session cookie
  → refreshes JWT if near expiry
  → passes request to Next.js
    ↓
app/(app)/plan/page.tsx (Server Component)
  → calls getWeeklySchedule() from DAL
    ↓
lib/dal.ts: getWeeklySchedule()
  → calls verifySession() [React.cache — may be no-op if already verified]
  → calls Supabase Postgres with user_id filter (RLS also enforces this)
  → returns typed schedule data
    ↓
page.tsx renders <ScheduleGrid schedule={data} />
  → ScheduleGrid is 'use client'
  → RSC Payload sent to browser
  → Client hydrates ScheduleGrid for interactivity
    ↓
User sees interactive weekly grid
```

### Request Flow: Upload + Parse Syllabus

```
User uploads PDF in onboarding
    ↓
Client Component collects file → POSTs to /api/upload (Route Handler)
    ↓
/api/upload/route.ts
  → verifySession() — auth check
  → validate: PDF, < 10MB
  → upload to Supabase Storage: syllabi/{userId}/{uuid}.pdf
  → return { storagePath }
    ↓
Client receives storagePath → calls parseSyllabus() Server Action
    ↓
lib/actions/courses.ts: parseSyllabus(storagePath)
  → verifySession()
  → download PDF from Storage
  → pass text to pdf-parser service
  → pass extracted text to syllabus-extractor service
    → rule-based extraction first
    → LLM extraction if feature flag enabled + user on paid tier
  → insert extracted tasks into DB (status: 'pending_confirmation')
  → revalidatePath('/courses/[courseId]/tasks')
    ↓
User redirected to task confirmation screen
  → reviews extracted tasks, edits any errors
  → confirms → markTasksConfirmed() Server Action
    → tasks.status = 'confirmed'
    → triggers scheduler (planning engine)
```

### Request Flow: Planning Engine Trigger

```
markTasksConfirmed() Server Action
    ↓
lib/services/scheduler.ts: generateWeeklyPlan(userId)
  → load all confirmed tasks (due dates, estimated minutes, status)
  → load user availability (windows, blocked times, preferred hours)
  → sort tasks by due_date ASC (closest deadline scheduled first)
  → fit tasks into available time blocks
    → respect block length (25–90 min, user-configured)
    → respect buffer time between blocks
    → flag overloaded days with risk badges
  → return ScheduledBlock[]
    ↓
upsert schedule_blocks table in Supabase
  → one row per block: task_id, date, start_time, end_time, status
revalidatePath('/plan')
revalidatePath('/dashboard')
```

### State Management

BlockPlan uses server-state-first: most data lives in Supabase and is fetched fresh on each navigation. Client state is minimal.

```
Supabase Postgres (source of truth)
    ↓ (Server Components fetch at render time)
Page Props → Client Components
    ↓ (user interacts)
Server Action called
  → DB updated
  → revalidatePath() called
  → Next.js re-fetches affected Server Components
  → New RSC Payload sent to client
```

For optimistic UI (task check-off feels instant), use `useOptimistic` from React in Client Components. Supabase Realtime is not needed for MVP — polling on navigation is sufficient for a student planner.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1K users | Current architecture — Supabase free tier, Vercel hobby, no changes needed |
| 1K-10K users | Supabase Pro tier for connection pooling (PgBouncer), Vercel Pro for Edge Functions, add rate limiting to PDF upload endpoint |
| 10K-100K users | Move PDF parsing to background job queue (Vercel Queue, Inngest) to avoid Vercel 60s function timeout on large syllabi, add Redis caching layer for schedule data |
| 100K+ users | Not a concern for Fall 2026 launch; revisit if product-market fit confirmed |

### Scaling Priorities

1. **First bottleneck — PDF parsing timeout:** Vercel serverless functions have a 60-second limit. A complex syllabus parsed via LLM can take 15-45 seconds. At scale, fire-and-forget with a job queue (Inngest) and poll for completion. This needs solving before 1K users, not at launch.

2. **Second bottleneck — Supabase connections:** Supabase free tier uses direct connections (no pooler). At ~50 concurrent users, connection exhaustion occurs. Supabase Pro includes PgBouncer (connection pooling). Upgrade when user count warrants.

## Anti-Patterns

### Anti-Pattern 1: Auth Check in Middleware Only

**What people do:** Rely on middleware to redirect unauthenticated users and assume that means server code is secure.

**Why it's wrong:** Middleware only performs optimistic checks (cookie read). It can be bypassed. Server Actions and Route Handlers are directly callable HTTP endpoints — if they don't call `verifySession()`, any user can trigger them.

**Do this instead:** Every Server Action and Route Handler must call `verifySession()` from the DAL before touching data. Middleware is a UX convenience (redirect to /login), not a security gate.

### Anti-Pattern 2: Querying Supabase Outside the DAL

**What people do:** Import the Supabase client directly into page components or actions and construct queries inline.

**Why it's wrong:** Auth checks get skipped or forgotten. Queries become scattered. When RLS policies change or the user model changes, there's no single place to update.

**Do this instead:** All Supabase queries go in `lib/dal.ts`. Each function is tested, cached, and auth-checked. Pages and actions call DAL functions only.

### Anti-Pattern 3: Running the Planning Engine in the Request Path

**What people do:** Trigger full schedule regeneration synchronously inside a Server Action that the user awaits.

**Why it's wrong:** The planning engine iterates over all tasks and all availability slots. For a student with 6 courses and 200 tasks across a semester, this is slow. Running it synchronously blocks the UI and risks Vercel's function timeout.

**Do this instead:** Run the scheduler synchronously for now (MVP, small data set), but structure it as a pure function that can be moved to a background job (Inngest) with minimal refactoring when needed.

### Anti-Pattern 4: Using a Single Supabase Client Everywhere

**What people do:** Create one Supabase client instance and import it into Server Components, Client Components, and middleware alike.

**Why it's wrong:** Supabase requires different client configuration in each context. The server client reads cookies from the Next.js request context. The browser client uses the user's session from `localStorage`. Using the wrong client in server code causes session cookies to not be sent, leading to 401 errors.

**Do this instead:** Maintain three separate client files: `lib/supabase/server.ts` (for Server Components + Actions), `lib/supabase/browser.ts` (for Client Components), `lib/supabase/middleware.ts` (for middleware). Never mix them.

### Anti-Pattern 5: Skipping RLS and Relying on `user_id` Filters in Code

**What people do:** Add `WHERE user_id = $1` in queries but disable Row Level Security in Supabase, trusting that application code always adds the filter.

**Why it's wrong:** A bug, missed filter, or service key leak would expose all users' data. Defense in depth requires both application-level filters and database-level RLS.

**Do this instead:** Enable RLS on every table with a policy like `auth.uid() = user_id`. Keep the application-level `user_id` filter in DAL queries as belt-and-suspenders. Both must pass.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Supabase Auth | `@supabase/ssr` package, cookie-based session — middleware refreshes JWT | Use `getUser()` not `getSession()` for server-side auth checks (getUser validates with Supabase server) |
| Supabase Postgres | Server client in Server Components/Actions, RLS on all tables | Enable connection pooling (Transaction mode) when on Pro tier |
| Supabase Storage | Server-side upload from Route Handler using `service_role` key for server uploads, signed URLs for serving PDFs privately | Keep syllabi bucket private — never public |
| OpenAI API | Server-side only, called from `lib/services/syllabus-extractor.ts` and `study-session.ts`, feature-flagged | Wrap in try/catch with rule-based fallback; never expose API key to client |
| Vercel | Automatic deploys, Edge Middleware for session refresh, serverless functions for Server Actions/Route Handlers | Monitor function timeout (10s hobby, 60s pro) — PDF parsing is the at-risk operation |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Server Components → DAL | Direct async function calls, no HTTP | Use `React.cache()` on DAL functions to deduplicate per-request |
| Client Components → Server | Server Actions (mutations), RSC props (reads) | Client Components never call Supabase directly — route through Server Actions |
| Server Actions → Services | Direct function calls (`scheduler.ts`, `pdf-parser.ts`) | Services are pure functions with no HTTP calls — easily unit testable |
| Route Handlers → DAL | Direct function calls for auth, Supabase client for storage ops | Upload handler uses service role key for Storage write |
| Middleware → Supabase | Cookie read/write only, no DB queries | Middleware MUST NOT query Postgres — only refresh JWT from Auth |

## Suggested Build Order

Dependencies drive order: each layer depends on the one below it being stable.

1. **Foundation (build first):** Supabase project setup, database schema, RLS policies, three Supabase client files, middleware, DAL skeleton with `verifySession()`. Without this, nothing is secure.

2. **Auth layer (build second):** Login, signup, logout pages and Server Actions. Validates the full request cycle (browser → middleware → Server Component → DAL → Supabase Auth).

3. **Core data model (build third):** Courses, tasks, availability tables + DAL functions. This is the data that all features depend on.

4. **Onboarding wizard (build fourth):** Creates the term, courses, availability. This is the user's entry point — building it early reveals UX issues in the data model.

5. **PDF upload + parsing pipeline (build fifth):** Upload Route Handler, pdf-parse service, rule-based extractor, task confirmation screen. Complex but self-contained; doesn't depend on the scheduler.

6. **Planning engine (build sixth):** Scheduler service + schedule_blocks table. Depends on tasks and availability being set. Can be tested with seed data before the UI is built.

7. **Dashboard + weekly/daily views (build seventh):** Depends on the scheduler producing data. These are the core "value delivery" screens.

8. **Auto-reschedule + risk badges (build eighth):** Refinement of the scheduler — build on top of the working scheduler from step 6.

9. **Study session generator (build last):** OpenAI-backed, feature-flagged. Not on the critical path; can be added once core planning loop is working.

## Sources

- Next.js App Router Official Docs (v16.1.6, updated 2026-02-27): https://nextjs.org/docs/app
- Next.js Authentication Guide: https://nextjs.org/docs/app/guides/authentication
- Next.js Server Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Server Actions: https://nextjs.org/docs/app/getting-started/updating-data
- Next.js Data Fetching: https://nextjs.org/docs/app/getting-started/fetching-data
- Next.js Layouts and Pages: https://nextjs.org/docs/app/getting-started/layouts-and-pages
- Supabase + Next.js integration: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs (WebFetch unavailable, patterns derived from official Next.js docs + Supabase SSR package conventions — MEDIUM confidence)
- Supabase Storage patterns: https://supabase.com/docs/guides/storage (WebFetch unavailable, storage patterns from official docs knowledge — MEDIUM confidence for storage-specific details)

---
*Architecture research for: BlockPlan — student academic planner (Next.js App Router + Supabase)*
*Researched: 2026-02-28*
