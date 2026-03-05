# Phase 2: Core Data Model - Research

**Researched:** 2026-02-28
**Domain:** Next.js 16 App Router — multi-step wizard, Server Actions, Supabase data access, task management UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Onboarding Wizard Flow**
- Multi-step wizard at `/onboarding` with progress indicator (step dots or progress bar)
- Step 1: Create term (name, start date, end date) — single term for MVP
- Step 2: Add courses (name, optional meeting times) — add multiple, minimum 1
- Step 3: Set availability rules (available windows, blocked times per day of week, preferred study windows)
- Step 4: Choose next action — upload syllabi (Phase 3, disabled until built) or add tasks manually
- After completing onboarding: redirect to `/tasks` page
- Wizard state persists to database after each step (user can resume if they leave mid-flow)
- Returning users who already have a term skip onboarding and go to `/dashboard`

**Term & Course Management**
- Single active term per user for MVP (no term switching UI needed)
- Course list shown on a dedicated page or within onboarding
- Courses can be added/edited/deleted after onboarding from a courses management area
- Meeting times stored as JSONB (day_of_week + start_time + end_time pairs) — optional, informational only for Phase 2

**Availability Rules**
- Visual weekly grid or time-slot picker for setting availability
- Three rule types: `available` (study windows), `blocked` (work, church, class), `preferred` (ideal study times)
- Rules are per day-of-week (recurring weekly) — no one-off date overrides in Phase 2
- Common presets: "BYU-Idaho typical" (Mon-Fri 7-9am, 7-10pm available) as a starting template
- User can add labels to blocked times (e.g., "Work", "Devotional", "Church")

**Task Management**
- Tasks page at `/tasks` showing all tasks across courses
- Create task form: title (required), type (assignment/exam/reading/other), due date, estimated minutes, course assignment
- Default estimated minutes by type: assignment=120, exam=180, reading=60, other=60 — all editable
- Task list with filtering by: course, type, status (todo/doing/done)
- Task list with sorting by: due date, course, status, recently added
- Inline status toggle (todo → doing → done) without opening edit form
- Edit task: same fields as create, accessible via click/tap on task row
- Delete task: confirmation required (simple "Are you sure?" dialog)
- Task status shown with visual indicators (color-coded badges or icons)

**Data Access Layer**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ONBD-01 | User can create a term with name, start date, and end date | Schema already has `terms` table; Server Action + Zod pattern confirmed |
| ONBD-02 | User can add courses to a term with name and optional meeting times | Schema has `courses` table with `meeting_times JSONB`; multi-course add pattern in wizard step 2 |
| ONBD-03 | User can set availability rules (available windows and blocked times per day of week) | Schema has `availability_rules` table with `rule_type`, `day_of_week`, `start_time`, `end_time`; custom grid picker recommended |
| ONBD-04 | User can set preferred study windows within availability | Same `availability_rules` table — `rule_type = 'preferred'`; same step as ONBD-03 |
| ONBD-05 | Onboarding wizard guides user through term → courses → syllabi/tasks → availability setup | Multi-step wizard at `/onboarding` using database-persisted step state; `proxy.ts` routing for new-user redirect |
| TASK-01 | User can manually create tasks with title, type, due date, estimated minutes, and course | `tasks` table exists; Server Action with Zod; course must exist before task creation |
| TASK-02 | Each task has type: assignment, exam, reading, or other | DB constraint already defined: `CHECK (type IN ('assignment', 'exam', 'reading', 'other'))` |
| TASK-03 | Each task has status: todo, doing, or done | DB constraint: `CHECK (status IN ('todo', 'doing', 'done'))`, default `'todo'` |
| TASK-04 | Each task has default estimated minutes based on type heuristic (editable) | Defaults applied in Server Action before insert; user can override in form |
| TASK-05 | User can edit any task's fields | Server Action for update; same Zod schema as create; task edit via inline form |
| TASK-06 | User can delete tasks | Server Action for delete; confirmation dialog in UI before calling action |
| TASK-07 | User can mark tasks as done | Inline status toggle — Server Action updating `status` field; optimistic UI with `useOptimistic` |
| TASK-10 | User can view all tasks across courses with filtering and sorting | Query `tasks` joined with `courses` by `user_id`; URL search params drive filter/sort state |
</phase_requirements>

---

## Summary

Phase 2 builds on the foundation from Phase 1 — the database schema (terms, courses, tasks, availability_rules) is already created with RLS. Phase 2 is entirely about the UI and data access layer: a 4-step onboarding wizard that persists progress to the database, and a task management page with CRUD, filtering, and sorting.

The established patterns from Phase 1 are the law here: Server Actions in `"use server"` files, the Supabase server client (never admin for user data), Zod for validation, `useActionState` for form error feedback, and `revalidatePath`/`updateTag` for cache invalidation after mutations. No new libraries are needed for core functionality.

Two critical discoveries from research: (1) The project is on Next.js 16.1.6, which deprecated `middleware.ts` in favor of `proxy.ts` — the existing `middleware.ts` file needs renaming as part of Phase 2 (or an early task in the plan). (2) The `tasks.course_id` column is `NOT NULL`, meaning onboarding must ensure at least one course exists before the user can reach the task creation step. The wizard's step ordering handles this naturally.

**Primary recommendation:** Use database-persisted wizard step state (check if term/courses/availability exist on page load to determine current step), Client Component wizard shell with `useActionState` for each step's form, and URL `searchParams` for the active step indicator. Do not use `localStorage` or session state — the database already tracks what exists.

---

## Standard Stack

### Core (Already Installed — No New Packages Required for Core)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.1.6 | App Router, Server Actions, proxy routing | Installed; all patterns confirmed in official docs dated 2026-02-27 |
| `@supabase/supabase-js` | ^2.98.0 | Database client, RLS-enforced queries | Installed; Phase 1 pattern proven |
| `@supabase/ssr` | ^0.8.0 | Cookie-based server client for Server Components/Actions | Installed; Phase 1 pattern proven |
| `tailwindcss` | ^4 | Styling | Installed |
| `typescript` | ^5 | Type safety | Installed |

### New Package Required

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| `zod` | ^3.x (NOT v4) | Schema validation for Server Actions | v4 is a breaking release (not backward compatible with v3 API); v3 is current stable; use `npm install zod@^3` |

**Installation:**
```bash
npm install zod
```

> **CRITICAL — Zod Version:** Zod v4 was released recently and is NOT backward compatible with v3. The `safeParse`, `flatten`, and `fieldErrors` patterns documented in Next.js official guides use the v3 API. Install `zod` (which resolves to latest v3.x on the stable channel) NOT `zod@4`. Verify with `npm info zod dist-tags` before installing.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom availability grid | `react-big-calendar` or `DayPilot` | External calendar libs are heavy (200KB+) and opinionated; a custom Tailwind grid is ~50 lines for this use case |
| URL searchParams for filter/sort state | Zustand / React state | URL state is shareable, survives refresh, and works with Server Component rendering; no library needed |
| Database-persisted wizard step | `localStorage` / Zustand persist | DB persistence is already the lock-in mechanism (term/courses exist = step is done); localStorage adds redundancy and drift |

---

## Architecture Patterns

### Recommended Project Structure

```
app/
├── onboarding/
│   ├── page.tsx              # Server Component: loads user state, determines step, renders wizard shell
│   ├── actions.ts            # "use server": createTerm, addCourse, saveAvailability, completeOnboarding
│   └── _components/
│       ├── WizardShell.tsx   # "use client": step navigation, progress indicator
│       ├── StepTerm.tsx      # "use client": step 1 form, useActionState(createTerm)
│       ├── StepCourses.tsx   # "use client": step 2 form, course list, useActionState(addCourse)
│       ├── StepAvailability.tsx # "use client": step 3, availability grid, useActionState(saveAvailability)
│       └── StepNextAction.tsx   # "use client": step 4, choose path forward
├── tasks/
│   ├── page.tsx              # Server Component: fetches tasks + courses, renders task list
│   ├── actions.ts            # "use server": createTask, updateTask, deleteTask, updateTaskStatus
│   └── _components/
│       ├── TaskList.tsx      # "use client": displays filtered/sorted tasks, optimistic status toggle
│       ├── TaskForm.tsx      # "use client": create/edit modal, useActionState
│       ├── TaskFilters.tsx   # "use client": filter/sort controls, updates URL searchParams
│       └── DeleteConfirm.tsx # "use client": confirmation dialog
├── courses/
│   ├── page.tsx              # Server Component: course management after onboarding
│   └── actions.ts            # "use server": updateCourse, deleteCourse
lib/
├── supabase/
│   ├── server.ts             # Already exists — createClient for Server Components/Actions
│   ├── client.ts             # Already exists — createBrowserClient for Client Components
│   └── middleware.ts         # Already exists — used in proxy.ts (see Pitfall 1)
proxy.ts                      # RENAME from middleware.ts (Next.js 16 requirement)
```

### Pattern 1: Database-Driven Wizard Step Detection

**What:** Server Component at `/onboarding/page.tsx` queries Supabase to check what data exists, then computes the current wizard step. No client-side step state.

**When to use:** Multi-step flows where each step's completion writes a DB record. This makes the wizard resumable without any session/localStorage.

**Example:**
```typescript
// app/onboarding/page.tsx
// Source: Next.js official docs, Supabase server client pattern (Phase 1)
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WizardShell } from "./_components/WizardShell";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // Determine wizard step from database state
  const { data: term } = await supabase
    .from("terms")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: courses } = term
    ? await supabase
        .from("courses")
        .select("id")
        .eq("term_id", term.id)
        .limit(1)
    : { data: null };

  const { data: availability } = await supabase
    .from("availability_rules")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  // Compute current step
  const currentStep = !term ? 1
    : !courses?.length ? 2
    : !availability?.length ? 3
    : 4;

  return <WizardShell initialStep={currentStep} termId={term?.id} />;
}
```

### Pattern 2: useActionState for Form Validation and Errors

**What:** Client Component forms wire to Server Actions via `useActionState`. The action returns `{ errors, message }` on failure, or calls `redirect()` on success.

**When to use:** Every mutation form in this phase. This is the canonical Next.js 16 pattern per official docs (2026-02-27).

**Example:**
```typescript
// app/onboarding/actions.ts
"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const termSchema = z.object({
  name: z.string().min(1, "Term name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
});

export async function createTerm(prevState: any, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { errors: { _root: ["Not authenticated"] } };

  const validated = termSchema.safeParse({
    name: formData.get("name"),
    start_date: formData.get("start_date"),
    end_date: formData.get("end_date"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("terms").insert({
    user_id: user.id,
    ...validated.data,
  });

  if (error) return { errors: { _root: [error.message] } };

  revalidatePath("/onboarding");
  // Client component will navigate to next step on success (state.success)
  return { success: true };
}
```

```typescript
// app/onboarding/_components/StepTerm.tsx
"use client";

import { useActionState } from "react";
import { createTerm } from "../actions";

const initialState = { errors: null, success: false };

export function StepTerm({ onNext }: { onNext: () => void }) {
  const [state, formAction, pending] = useActionState(createTerm, initialState);

  // Navigate to next step on success
  if (state.success) onNext();

  return (
    <form action={formAction}>
      <input name="name" type="text" required />
      {state.errors?.name && <p>{state.errors.name[0]}</p>}
      {/* date inputs */}
      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Next"}
      </button>
    </form>
  );
}
```

### Pattern 3: Optimistic Status Toggle for Tasks

**What:** Inline status toggle uses React's `useOptimistic` to update UI immediately while the Server Action commits to Supabase. Prevents 300-500ms lag on every status click.

**When to use:** High-frequency low-stakes mutations like status toggles, where stale state visible to the user for 0.5s is acceptable.

**Example:**
```typescript
// Source: Next.js official docs — useOptimistic pattern (2026-02-27)
"use client";

import { useOptimistic, useTransition } from "react";
import { updateTaskStatus } from "../actions";

const STATUS_ORDER = ["todo", "doing", "done"] as const;
type Status = typeof STATUS_ORDER[number];

export function StatusToggle({ task }: { task: { id: string; status: Status } }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);
  const [isPending, startTransition] = useTransition();

  const nextStatus = STATUS_ORDER[(STATUS_ORDER.indexOf(optimisticStatus) + 1) % 3];

  return (
    <button
      onClick={() => {
        startTransition(async () => {
          setOptimisticStatus(nextStatus);
          await updateTaskStatus(task.id, nextStatus);
        });
      }}
      disabled={isPending}
    >
      {optimisticStatus}
    </button>
  );
}
```

### Pattern 4: URL SearchParams for Filter/Sort State

**What:** Task filters and sort order live in the URL as `?course=uuid&type=assignment&sort=due_date`. The Server Component page reads `searchParams` to filter the Supabase query. Client Component controls push new params via `router.replace`.

**When to use:** Filter/sort state in Next.js App Router. Avoids useState, survives refresh, shareable URL.

**Example:**
```typescript
// app/tasks/page.tsx (Server Component)
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; type?: string; sort?: string; status?: string }>;
}) {
  const params = await searchParams; // Next.js 16 — searchParams is now async
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("tasks")
    .select("*, courses(name)")
    .eq("user_id", user!.id);

  if (params.course) query = query.eq("course_id", params.course);
  if (params.type) query = query.eq("type", params.type);
  if (params.status) query = query.eq("status", params.status);

  // Sort
  const sortColumn = params.sort === "course" ? "courses(name)"
    : params.sort === "status" ? "status"
    : "due_date"; // default
  query = query.order(sortColumn);

  const { data: tasks } = await query;
  // ...
}
```

> **Next.js 16 CRITICAL:** `searchParams` in `page.tsx` is now a `Promise<>` and must be `await`ed. This is a breaking change from Next.js 15. See Async Request APIs section in upgrade guide.

### Pattern 5: Availability Rule Grid (Custom Component)

**What:** A 7-column × time-slot grid built in Tailwind. Each cell represents a 30-minute slot for a day of the week. Clicking a cell toggles its rule type (available/blocked/preferred). No external library needed.

**When to use:** Custom time-blocking UI where external calendar libs are overkill. This availability is recurring weekly, not event-based.

**Data structure for each slot:**
```typescript
type TimeSlot = {
  day: number;       // 0 = Sun, 6 = Sat
  hour: number;      // 0-23
  minute: 0 | 30;
  ruleType: "available" | "blocked" | "preferred" | null;
  label?: string;    // for blocked: "Work", "Church"
};
```

**Saving:** Batch upsert — when user clicks "Save Availability," collect all non-null slots and call a Server Action that deletes existing rules for this user and inserts the new set. This is simpler than tracking individual additions/deletions.

```typescript
// app/onboarding/actions.ts
export async function saveAvailabilityRules(prevState: any, formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { errors: { _root: ["Not authenticated"] } };

  // Receive rules as JSON from hidden input
  const rulesJson = formData.get("rules") as string;
  const rules = JSON.parse(rulesJson) as Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    rule_type: string;
    label?: string;
  }>;

  // Batch replace
  await supabase.from("availability_rules").delete().eq("user_id", user.id);

  if (rules.length > 0) {
    await supabase.from("availability_rules").insert(
      rules.map((r) => ({ ...r, user_id: user.id }))
    );
  }

  revalidatePath("/onboarding");
  return { success: true };
}
```

### Anti-Patterns to Avoid

- **Never use `getSession()` for auth checks in Server Actions:** `getUser()` validates the JWT server-side. `getSession()` reads cookies without verification and is unsafe.
- **Never call the admin client for user-data operations:** The admin client bypasses RLS. Only use it for admin operations (account deletion). All user data reads/writes use the server client.
- **Don't store wizard step in localStorage or Zustand:** The database IS the step state. If a term row exists, step 1 is done. This is the durable, resumable source of truth.
- **Don't redirect from Server Actions after mutating without `revalidatePath` first:** `redirect()` throws a control-flow exception; code after it does not execute. If you need cache invalidation AND a redirect, call `revalidatePath` before `redirect`.
- **Don't use `middleware.ts` for DB checks on every request:** The proxy/middleware layer runs on every request. Database queries here add 50-200ms latency. Instead, check the database in the Server Component page itself and redirect from there.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation functions | `zod` `safeParse` with `flatten().fieldErrors` | Type-safe, catches edge cases, produces structured errors compatible with `useActionState` |
| Pending state in forms | `useState(loading)` + manual management | `useActionState` `pending` boolean (3rd return value) | Built into React 19, works with progressive enhancement |
| Optimistic status toggle | Manual state sync | `useOptimistic` + `useTransition` | Handles race conditions, automatically reverts on error |
| URL filter state | Custom event bus or Zustand | `useSearchParams` + `router.replace` | Native to Next.js App Router, survives refresh, no library |
| Cookie-based auth | Manual JWT parsing | `createClient` from `@/lib/supabase/server` (already exists) | Phase 1 established this; `getUser()` does JWT verification |
| Batch availability save | Diffing old vs new rules | Delete-all + insert-new pattern | Availability is user-defined; replacing the set is atomic and avoids complex diff logic |

**Key insight:** The hardest part of this phase is NOT the database — the schema is already there. It's the wizard state management and the availability grid UX. Both are solvable with native React/Next.js patterns without additional libraries.

---

## Common Pitfalls

### Pitfall 1: proxy.ts vs middleware.ts (CRITICAL — Next.js 16 Breaking Change)

**What goes wrong:** The project has `middleware.ts` at the root. Next.js 16 deprecated this filename in favor of `proxy.ts`. The `middleware.ts` still works in 16.1.6 (deprecated, not removed), but it WILL break in a future minor release. Also, the edge runtime is NOT supported in `proxy.ts` — but the current file uses the Supabase SSR pattern which runs on Node.js anyway.

**Why it happens:** Next.js 16 renamed middleware to proxy to clarify network boundary semantics.

**How to avoid:** Rename `middleware.ts` → `proxy.ts` and rename the exported function from `middleware` to `proxy`. Update `next.config.ts` if using any middleware-specific config keys (`skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`). Run the codemod: `npx @next/codemod@canary upgrade latest`.

**Warning signs:** Vercel console warning: "Middleware file missing" or deprecation warnings during `next dev`.

### Pitfall 2: New-User Routing (Onboarding Gate)

**What goes wrong:** New users sign up and get redirected to `/dashboard` (current auth action behavior) instead of `/onboarding`. Returning users who completed onboarding get redirected to `/onboarding` instead of `/dashboard`.

**Why it happens:** The current `auth/actions.ts` `signup` action hardcodes `redirect("/onboarding")`. The `signin` action hardcodes `redirect("/dashboard")`. Neither checks the database to determine the correct destination.

**How to avoid:** Two approaches:
1. **In the Server Component page:** Both `/dashboard` and `/onboarding` check the database on load and redirect to the correct page. This is the recommended approach — no middleware DB calls.
2. **In the auth actions:** After login, query for existence of a `terms` record and redirect accordingly.

The CONTEXT.md decision is: "Returning users who already have a term skip onboarding and go to `/dashboard`." This check should happen in the `/onboarding/page.tsx` Server Component: if a term exists, `redirect("/dashboard")`. The `/dashboard` page is a stub in Phase 2 — it stays as-is.

### Pitfall 3: tasks.course_id is NOT NULL

**What goes wrong:** Task creation fails with a Supabase constraint error if `course_id` is null or references a non-existent course. In the wizard, a user on step 4 (choose next action) who selects "add tasks manually" gets redirected to `/tasks`, but if they somehow have no courses (e.g., they deleted all courses after completing step 2), the task creation form cannot function.

**Why it happens:** The schema defines `course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE`. This is intentional — tasks must belong to a course.

**How to avoid:** The `/tasks/page.tsx` Server Component must query for `courses` before rendering the task creation form. If no courses exist, show a message directing the user to add a course first. The `createTask` Server Action must validate that `course_id` is provided and belongs to the current user (defense in depth against RLS).

### Pitfall 4: searchParams is Now Async (Next.js 16 Breaking Change)

**What goes wrong:** In Next.js 15, `searchParams` in `page.tsx` was synchronous. In Next.js 16, it's a `Promise`. Accessing `searchParams.course` directly without `await` returns `undefined`.

**Why it happens:** Next.js 16 made all Dynamic APIs (`cookies`, `headers`, `params`, `searchParams`) fully async as a breaking change.

**How to avoid:** Always `await searchParams`:
```typescript
// Next.js 16 pattern
export default async function Page({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams;
}
```

**Warning signs:** Filter/sort state appears to not work — UI controls update the URL but the page always shows all tasks unfiltered.

### Pitfall 5: Availability Grid — Time Zone Mismatch

**What goes wrong:** Availability rules stored as `TIME` (e.g., `07:00:00`) are treated as UTC on the server but rendered in the user's local timezone on the client. A user setting "7am available" in Mountain Time (UTC-7) might see their rule displayed as "2pm" or "midnight" depending on how the conversion is handled.

**Why it happens:** The `availability_rules` table uses `TIME NOT NULL` for `start_time` and `end_time` (not `TIMESTAMPTZ`). `TIME` values have no timezone context. The Phase 1 research noted SECU-03 requires `TIMESTAMPTZ` for "all timestamps" — but `TIME` columns for recurring weekly rules are correctly storing wall-clock time, not timestamps.

**How to avoid:** Treat availability times as wall-clock times throughout — never convert them to UTC or apply timezone offsets. Store `07:00:00` as the user's intended "7am," display it as "7am," and when the planning engine (Phase 4) uses them, interpret them as local wall-clock times relative to the user's timezone (stored separately or derived from the Vercel request).

**Warning signs:** Availability rules appear shifted by several hours on re-load.

### Pitfall 6: Zod v4 API Incompatibility

**What goes wrong:** `zod@4` removes the `.flatten().fieldErrors` pattern used in Next.js official form docs. If zod v4 is accidentally installed (it was recently released), all Server Action error handling breaks silently or throws.

**Why it happens:** npm may resolve `zod` to v4 if installed without a version pin after the v4 release.

**How to avoid:** Pin to zod v3: `npm install zod@^3`. Verify: `npm list zod` should show `3.x.x`.

---

## Code Examples

Verified patterns from official sources:

### Server Action with Zod Validation (Next.js 16 Official Docs)
```typescript
// Source: https://nextjs.org/docs/app/guides/forms (2026-02-27)
"use server";

import { z } from "zod";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["assignment", "exam", "reading", "other"]),
  due_date: z.string().optional(),
  estimated_minutes: z.coerce.number().int().min(1).optional(),
  course_id: z.string().uuid("Course is required"),
});

export async function createTask(prevState: any, formData: FormData) {
  const validated = schema.safeParse(Object.fromEntries(formData));

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  // Insert to Supabase...
  return { success: true };
}
```

### useActionState Pattern (React 19 / Next.js 16)
```typescript
// Source: https://nextjs.org/docs/app/guides/forms (2026-02-27)
"use client";

import { useActionState } from "react"; // React 19 — import from "react", not "react-dom"

export function TaskForm({ action, initialState }: { action: any; initialState: any }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction}>
      <input name="title" required />
      {state.errors?.title && <p aria-live="polite">{state.errors.title[0]}</p>}
      <button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Task"}
      </button>
    </form>
  );
}
```

### Default Estimated Minutes by Task Type
```typescript
// app/tasks/actions.ts — applied in Server Action before insert
const DEFAULT_MINUTES: Record<string, number> = {
  assignment: 120,
  exam: 180,
  reading: 60,
  other: 60,
};

// In createTask action:
const estimatedMinutes = validated.data.estimated_minutes
  ?? DEFAULT_MINUTES[validated.data.type];
```

### Supabase Insert via Server Client (Established Phase 1 Pattern)
```typescript
// Source: Phase 1 established pattern (lib/supabase/server.ts)
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser(); // ALWAYS getUser(), never getSession()

const { error } = await supabase.from("tasks").insert({
  user_id: user!.id,
  course_id: validated.data.course_id,
  title: validated.data.title,
  type: validated.data.type,
  status: "todo",
  estimated_minutes: estimatedMinutes,
  due_date: validated.data.due_date ?? null,
});
```

### proxy.ts (Rename of middleware.ts for Next.js 16)
```typescript
// proxy.ts (renamed from middleware.ts)
// Source: https://nextjs.org/docs/app/guides/upgrading/version-16 (2026-02-27)
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware"; // lib/supabase/middleware.ts stays as-is

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useFormState` from `react-dom` | `useActionState` from `react` | React 19 (Next.js 15+) | All form state hooks must import from `"react"` not `"react-dom"` |
| `middleware.ts` / `export function middleware` | `proxy.ts` / `export function proxy` | Next.js 16 | File rename required; edge runtime no longer supported in proxy |
| Synchronous `searchParams` in `page.tsx` | `async searchParams: Promise<{...}>` | Next.js 16 | Must `await searchParams` in all page components |
| `revalidatePath` only for mutations | `revalidatePath` OR `updateTag` | Next.js 16 | `updateTag` = immediate refresh (read-your-writes); `revalidatePath` = background revalidation |
| `getSession()` for server-side auth | `getUser()` always | Supabase SSR best practice | `getSession()` reads from cookies without JWT verification — security risk |

**Deprecated/outdated:**
- `useFormState` (from `react-dom`): replaced by `useActionState` from `react` in React 19
- `middleware.ts`: deprecated in Next.js 16, renamed to `proxy.ts`
- Synchronous `params`/`searchParams` access in pages: removed in Next.js 16

---

## Open Questions

1. **Course-level navigation after onboarding**
   - What we know: CONTEXT.md says "courses can be added/edited/deleted after onboarding from a courses management area"
   - What's unclear: Is this a `/courses` page, or is course management embedded in a `/settings` page alongside other settings?
   - Recommendation: Create `/courses` as a dedicated page. It keeps routes clean and matches `/tasks`. The planner should decide the nav structure.

2. **Task list pagination or infinite scroll**
   - What we know: TASK-10 requires filtering and sorting — no mention of pagination. Seed data (Spring 2026 term, 3 courses) might have 30-60 tasks.
   - What's unclear: At what volume does a flat list become unusable? No explicit pagination requirement.
   - Recommendation: Implement as a flat list with no pagination in Phase 2. Filtering significantly reduces the visible set. Add pagination if Phase 5/7 feedback shows it's needed. Flag this in the plan.

3. **Onboarding "resume" UX when user returns mid-flow**
   - What we know: "Wizard state persists to database after each step (user can resume if they leave mid-flow)"
   - What's unclear: When a user returns to `/onboarding` and they're on step 2 (term exists, no courses yet), should they see the courses they've already added (e.g., if they added one and then left)?
   - Recommendation: Yes — step 2 should load existing courses from Supabase and show them in the list with the option to add more. The Server Component page pre-fetches and passes them as props to the wizard.

---

## Sources

### Primary (HIGH confidence)
- Next.js official docs (v16.1.6, lastUpdated: 2026-02-27) — `https://nextjs.org/docs/app/guides/forms` — Server Actions, useActionState, Zod validation, pending states, optimistic updates
- Next.js official docs (v16.1.6, lastUpdated: 2026-02-27) — `https://nextjs.org/docs/app/getting-started/updating-data` — Server Functions, revalidatePath, updateTag, redirect, useOptimistic
- Next.js official upgrade guide (v16.1.6, lastUpdated: 2026-02-27) — `https://nextjs.org/docs/app/guides/upgrading/version-16` — proxy.ts rename, async searchParams/params, caching APIs
- Existing codebase — `/supabase/migrations/00001_initial_schema.sql` — confirmed schema for terms, courses, tasks, availability_rules (all tables exist, RLS is in place)
- Existing codebase — `/lib/supabase/server.ts`, `/app/auth/actions.ts`, `/app/settings/actions.ts` — confirmed Phase 1 patterns for Server Actions, Supabase client, getUser(), redirect
- Zod v4 docs — `https://zod.dev/v4` — confirmed v4 is a breaking release; v3 API (`safeParse`, `flatten().fieldErrors`) is incompatible with v4

### Secondary (MEDIUM confidence)
- WebSearch: Next.js 16 middleware→proxy rename — confirmed by multiple sources including official Next.js blog and upgrade guide; that `middleware.ts` is deprecated but not fully removed in 16.1.6
- WebSearch: Zod npm stable version — v4.x recently released, v3.x still on stable tag; install with `npm install zod` resolves to v3.x currently (verify before installing)

### Tertiary (LOW confidence)
- WebSearch: weekly availability time picker React components — none recommended; custom Tailwind grid is the correct approach for this use case based on requirements analysis

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed from Phase 1; only Zod is new, version confirmed
- Architecture: HIGH — patterns sourced from official Next.js docs dated 2026-02-27 (current)
- Pitfalls: HIGH for Next.js 16 breaking changes (official docs verified); MEDIUM for availability time zone (well-known problem, general knowledge)
- Schema: HIGH — read directly from codebase migration file

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (stable ecosystem; Next.js 16.x minor releases may add but not break these patterns)
