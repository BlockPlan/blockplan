# Phase 5: Views and Dashboard - Research

**Researched:** 2026-03-01
**Domain:** Next.js 16 Server Components, React 19 UI views, Supabase data queries
**Confidence:** HIGH

## Summary

Phase 5 builds three views on top of the existing Phase 4 infrastructure: a weekly view (enhancing the existing `/plan` page), a daily view (`/plan/day`), and a today dashboard (replacing the `/dashboard` placeholder). The project already has a working 7-day PlanGrid with PlanBlock components that support done/missed actions via optimistic UI. The weekly view (VIEW-01) is largely satisfied by Phase 4's `/plan` page — this phase enhances it and adds the daily view and dashboard.

The tech stack is fully established: Next.js 16 with Server Components, React 19 with `useOptimistic`/`useTransition`, Supabase for data, Tailwind CSS 4 for styling, `sonner` for toasts, and `date-fns` with `@date-fns/tz` for timezone-aware date handling. No new dependencies are needed.

**Primary recommendation:** Reuse and extend existing components (PlanBlock, RiskBadge) across all three views. Extract a shared layout component with consistent navigation. Focus on server-side data queries for each view, keeping client interactivity minimal and targeted.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Weekly View (VIEW-01, VIEW-04): Route `/plan/week` or enhance existing `/plan` page. 7-day column layout. Each block shows task title, time range, course name/color. Blocks interactive — mark done/missed. Reuses PlanBlock from Phase 4.
- Daily View (VIEW-02, VIEW-04): Route `/plan/day` or accessed by clicking a day in weekly view. Timeline/list of today's blocks. Top priorities section. Estimated time remaining calculation. Mark blocks done/missed.
- Today Dashboard (VIEW-03): Route `/dashboard` (replace placeholder). Top 5 priority items. Next scheduled block. Risk alerts from planning engine. Quick navigation to other views. Landing page for returning authenticated users.
- Navigation: Consistent nav header across all views. Links: Dashboard, Plan (weekly), Tasks, Courses, Settings. Active state indicator.

### Claude's Discretion
- Exact layout and visual design for all three views
- Whether weekly view is a new page or enhances existing /plan
- How to display "estimated time remaining"
- Dashboard card layout and information density
- Color coding for courses/block states
- Whether daily view is a separate route or modal/overlay
- Mobile adaptations for all views

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIEW-01 | Weekly view shows blocks per day with assigned tasks | Existing PlanGrid already provides 7-day grid; enhance with better layout, day navigation |
| VIEW-02 | Daily view shows top priorities and estimated time remaining today | New route `/plan/day` with server-side query for today's blocks, priority calculation, time remaining |
| VIEW-03 | "Today" dashboard shows top 5 items, next scheduled block, and risk alerts | Replace `/dashboard` placeholder with real data queries, card-based layout |
| VIEW-04 | User can mark plan blocks as done or missed from the view | Already implemented in PlanBlock component; reuse across all views |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router, Server Components, Server Actions | Already in project |
| React | 19.2.3 | UI rendering, useOptimistic, useTransition | Already in project |
| @supabase/ssr | 0.8.0 | Server-side Supabase client | Already in project |
| date-fns | 4.1.0 | Date formatting, comparison | Already in project |
| @date-fns/tz | 1.4.1 | Timezone-aware date operations | Already in project |
| Tailwind CSS | 4.x | Utility-first styling | Already in project |
| sonner | 2.0.7 | Toast notifications | Already in project |

### Supporting
No new libraries needed. All dependencies are already installed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom date formatting | Intl.DateTimeFormat | Already used in PlanGrid — stick with it for consistency |
| Separate daily route | Modal/overlay | Separate route is simpler, works with Server Components, supports direct linking |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── dashboard/
│   └── page.tsx              # Today dashboard (replace placeholder) — VIEW-03
├── plan/
│   ├── page.tsx              # Weekly view (enhance existing) — VIEW-01, VIEW-04
│   ├── day/
│   │   └── page.tsx          # Daily view — VIEW-02, VIEW-04
│   ├── _components/
│   │   ├── PlanBlock.tsx     # Existing — reuse
│   │   ├── PlanGrid.tsx      # Existing — may enhance
│   │   ├── RiskBadge.tsx     # Existing — reuse
│   │   ├── DayTimeline.tsx   # NEW: daily view timeline
│   │   └── NavHeader.tsx     # NEW: shared navigation
│   └── actions.ts            # Existing Server Actions — reuse
├── layout.tsx                # Root layout (unchanged)
```

### Pattern 1: Shared Navigation Component
**What:** Extract navigation into a reusable component used by all pages
**When to use:** Every authenticated page needs consistent navigation with active state
**Example:**
```typescript
// NavHeader component with active link detection
// Use Next.js usePathname() in a client component for active state
// Keep the existing header style: border-b, bg-white, max-w-5xl
```

### Pattern 2: Server Component Data Queries
**What:** Each page.tsx is a Server Component that queries Supabase and passes data to client components
**When to use:** All three views follow this pattern (already established in Phase 4)
**Example:**
```typescript
// Server Component (page.tsx) — queries data
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: blocks } = await supabase
    .from("plan_blocks")
    .select("*, tasks(title, type, estimated_minutes, due_date, course_id, courses(name))")
    .eq("user_id", user.id);
  // Pass to client components
  return <DashboardContent blocks={blocks} riskTasks={riskTasks} />;
}
```

### Pattern 3: Reuse PlanBlock for Done/Missed Actions
**What:** The existing PlanBlock component already handles optimistic done/missed state with Server Actions
**When to use:** VIEW-04 requires done/missed from weekly AND daily views — PlanBlock already does this
**Example:** Import PlanBlock into DayTimeline just as PlanGrid already imports it

### Anti-Patterns to Avoid
- **Duplicating Server Actions:** Do NOT create new markBlockDone/markBlockMissed in separate action files. Reuse from `app/plan/actions.ts`.
- **Client-side data fetching:** Do NOT use useEffect+fetch for initial data. Use Server Components (established pattern).
- **Inline navigation in every page:** Do NOT copy-paste the header into each page. Extract a shared component.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date formatting | Custom date string manipulation | `Intl.DateTimeFormat` and `date-fns` | Already established in PlanGrid; timezone edge cases |
| Active nav state | Manual URL comparison | `usePathname()` from `next/navigation` | Handles nested routes, client-side nav |
| Time remaining calc | Complex duration formatting | `differenceInMinutes` from date-fns | Already imported, handles DST |
| Risk classification | Duplicate risk logic | Reuse from `scheduler.ts` or from `plan/page.tsx` | Already has correct at_risk/overdue_risk logic |

**Key insight:** Phase 4 already built 80% of the infrastructure. This phase is about reorganizing and presenting existing data in new views, not building new backend logic.

## Common Pitfalls

### Pitfall 1: Duplicating the Risk Calculation
**What goes wrong:** Each view re-implements risk badge logic differently, leading to inconsistent risk alerts across views
**Why it happens:** Risk calculation is currently inline in `/plan/page.tsx` rather than extracted
**How to avoid:** Extract risk calculation into a shared utility function or compute it once in a shared data-loading function
**Warning signs:** Copy-pasting the riskTasks computation from plan/page.tsx into dashboard/page.tsx

### Pitfall 2: Navigation Inconsistency
**What goes wrong:** Each page has slightly different navigation links, active states, or layout
**Why it happens:** Headers are currently inline in each page.tsx
**How to avoid:** Create one NavHeader component, import it everywhere
**Warning signs:** Finding `<header>` blocks in more than one page file

### Pitfall 3: Timezone Bugs in "Today" Calculations
**What goes wrong:** "Today's blocks" query returns wrong blocks because Date comparison ignores user timezone
**Why it happens:** `new Date()` uses server timezone, but blocks were scheduled in user's timezone
**How to avoid:** Use the user's timezone from `user_profiles.timezone` when filtering "today" blocks. Use `startOfDay` with `tz()` context from `@date-fns/tz`.
**Warning signs:** Dashboard shows yesterday's or tomorrow's blocks depending on server timezone vs user timezone

### Pitfall 4: Stale Data After Done/Missed Actions
**What goes wrong:** Marking a block done on the daily view doesn't update the dashboard or weekly view
**Why it happens:** `revalidatePath("/plan")` only revalidates that specific path
**How to avoid:** revalidatePath for all affected routes, or use `revalidatePath("/", "layout")` to revalidate everything
**Warning signs:** Block shows as done on daily view but still scheduled on dashboard

### Pitfall 5: "Estimated Time Remaining" Off by One
**What goes wrong:** Time remaining calculation counts done blocks as still remaining
**Why it happens:** Forgetting to filter out `status === "done"` blocks before summing remaining minutes
**How to avoid:** Filter blocks to only `status === "scheduled"` before calculating remaining time
**Warning signs:** Completing a block doesn't reduce the "time remaining" counter

## Code Examples

### Filtering Today's Blocks (Timezone-Aware)
```typescript
import { startOfDay, endOfDay } from 'date-fns';
import { tz } from '@date-fns/tz';

// Get today's boundaries in user timezone
const userTz = tz(profile.timezone ?? 'America/Boise');
const todayStart = startOfDay(new Date(), { in: userTz });
const todayEnd = endOfDay(new Date(), { in: userTz });

// Query blocks for today
const { data: todayBlocks } = await supabase
  .from("plan_blocks")
  .select("*, tasks(title, type, estimated_minutes, due_date, course_id, courses(name))")
  .eq("user_id", user.id)
  .gte("start_time", todayStart.toISOString())
  .lte("start_time", todayEnd.toISOString())
  .order("start_time", { ascending: true });
```

### Estimated Time Remaining Calculation
```typescript
// Sum minutes from scheduled (not done/missed) blocks for today
const remainingMinutes = todayBlocks
  .filter((b) => b.status === "scheduled")
  .reduce((sum, b) => {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    return sum + (end.getTime() - start.getTime()) / 60000;
  }, 0);

const hours = Math.floor(remainingMinutes / 60);
const mins = Math.round(remainingMinutes % 60);
```

### Top 5 Priority Items (Earliest Due Date)
```typescript
// Query incomplete tasks ordered by due date
const { data: priorityTasks } = await supabase
  .from("tasks")
  .select("id, title, type, due_date, estimated_minutes, status, course_id, courses(name)")
  .eq("user_id", user.id)
  .neq("status", "done")
  .order("due_date", { ascending: true, nullsFirst: false })
  .limit(5);
```

### Active Navigation Link
```typescript
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`text-sm ${isActive ? "font-medium text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
    >
      {children}
    </Link>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side routing for views | Server Components with data pre-fetched | Next.js 13+ (App Router) | No loading spinners, SEO, faster initial render |
| useEffect + useState for data | Server Component async queries | React 18+ Server Components | Simpler code, no loading states for initial data |
| Manual optimistic updates | React 19 useOptimistic | React 19 | Built-in rollback, cleaner than manual state management |

## Open Questions

1. **revalidatePath scope**
   - What we know: Currently `revalidatePath("/plan")` is called after block actions. Dashboard lives at `/dashboard`.
   - What's unclear: Whether marking a block done from the daily view should also revalidate dashboard.
   - Recommendation: Add `revalidatePath("/dashboard")` alongside `revalidatePath("/plan")` in the existing Server Actions. Minimal cost, ensures consistency.

2. **Weekly view: new route or enhance existing?**
   - What we know: Phase 4's `/plan` already shows a 7-day grid with all VIEW-01 requirements.
   - What's unclear: Whether a separate `/plan/week` route adds value.
   - Recommendation: Keep `/plan` as the weekly view. It already satisfies VIEW-01. Add a link to daily view from there. No need for `/plan/week`.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `app/plan/page.tsx`, `app/plan/_components/PlanGrid.tsx`, `app/plan/_components/PlanBlock.tsx`, `app/plan/actions.ts` — existing Phase 4 implementation
- Codebase analysis: `app/dashboard/page.tsx` — current placeholder with "Dashboard coming in Phase 5"
- Codebase analysis: `lib/services/scheduler.ts` — risk classification, scheduling types
- Codebase analysis: `package.json` — all dependencies confirmed

### Secondary (MEDIUM confidence)
- Next.js App Router patterns for multi-view apps with shared navigation
- React 19 useOptimistic patterns for cross-component state

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in project, no new dependencies
- Architecture: HIGH - extends established patterns from Phase 4
- Pitfalls: HIGH - identified from direct codebase analysis of existing code

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (stable — no dependency changes expected)
