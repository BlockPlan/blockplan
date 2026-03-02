# Phase 7: Export and Polish - Research

**Researched:** 2026-03-02
**Domain:** Calendar export (.ics), auto-subtask suggestions, mobile responsive polish
**Confidence:** HIGH

## Summary

Phase 7 covers three distinct capabilities: (1) .ics calendar export using `ical-generator`, (2) auto-suggested subtasks with work-back scheduling for large tasks, and (3) mobile-responsive polish across all screens. The existing codebase already has partial responsive patterns (PlanGrid uses `grid-cols-1 sm:grid-cols-7`) and the `subtasks` table exists in the database schema from Phase 1. The primary new dependency is `ical-generator` for .ics file creation.

The calendar export is a server-side operation: query plan_blocks, build .ics with proper timezone support using `ical-generator` + `@date-fns/tz` (already in project), and return as a downloadable file. Subtask auto-suggestion is a pure function triggered when creating tasks with type "assignment" and estimated_minutes >= 240. Mobile responsive work is CSS-only using Tailwind breakpoints already in the project.

**Primary recommendation:** Implement in 3 plans — (1) calendar export API + UI button, (2) subtask suggestion logic + UI, (3) mobile responsive audit and fixes across all screens.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- "Export to Calendar" button on the plan view page
- Downloads an .ics file containing all scheduled plan_blocks as calendar events
- Each event: task title as summary, course name in description, correct start/end times in user's timezone
- Use `ical-generator` package
- File downloads via browser (Content-Disposition header or blob download)
- Export covers the current 7-day plan (same scope as plan view)
- When user creates a task of type "assignment" with estimated_minutes >= 240 (4+ hours), auto-suggest subtasks
- Subtask suggestions: "Outline", "First Draft", "Revise", "Final Submit" (for papers/projects)
- Work-back scheduling: subtask due dates calculated backwards from parent due date (Final Submit: parent due date, Revise: 3 days before, First Draft: 7 days before, Outline: 10 days before)
- Suggestions shown as a prompt/dialog — user can accept, modify, or dismiss
- Uses the existing `subtasks` table from Phase 1 schema
- Audit and fix all screens for 375px width
- Key areas: onboarding wizard, task list, plan grid, dashboard, study session, settings
- No horizontal scroll, no overlapping elements
- Navigation: hamburger menu or bottom nav on mobile
- Forms should stack vertically on narrow screens
- Plan grid: single-column scrollable on mobile (not 7-column grid)

### Claude's Discretion
- Exact .ics file format details
- Subtask suggestion UI (modal, inline, toast)
- Which screens need the most responsive work
- Mobile navigation pattern (hamburger vs bottom nav)
- Whether to add a "Download" button or auto-download

### Deferred Ideas (OUT OF SCOPE)
None — this is the final phase
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CALX-01 | User can export their plan as an .ics file download | ical-generator library generates RFC 5545 compliant .ics; serve via Next.js API route with Content-Disposition header |
| TASK-08 | For large tasks (papers/projects), system auto-suggests subtasks | Pure function checks task type + estimated_minutes >= 240, generates 4 subtask suggestions; existing subtasks table ready |
| TASK-09 | Subtasks have work-back scheduling from the parent due date | Date arithmetic using date-fns (already installed) to compute backwards from parent due_date |
| RESP-01 | All screens are responsive and usable on mobile (375px+) | Tailwind responsive breakpoints (sm:, md:, lg:) already available; NavHeader needs hamburger menu for mobile |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ical-generator | ^10.0.0 | Generate .ics calendar files | 248K weekly downloads, supports native Date objects, RFC 5545 compliant |
| date-fns | ^4.1.0 | Date arithmetic for work-back scheduling | Already in project, used throughout |
| @date-fns/tz | ^1.4.1 | Timezone-aware date handling for .ics events | Already in project, used by scheduler |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | ^4 | Responsive breakpoints and mobile styles | Already in project, all responsive work |
| sonner | ^2.0.7 | Toast notifications for export feedback | Already in project, use for download success/error |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ical-generator | ics (npm) | ics is simpler but less flexible; ical-generator has better timezone support and is more actively maintained |
| Hamburger menu | Bottom nav | Hamburger is more standard for web apps; bottom nav better for native-feel but adds complexity |

**Installation:**
```bash
npm install ical-generator
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── api/plan/export/route.ts    # GET handler returns .ics file
├── plan/_components/
│   ├── PlanGrid.tsx            # Add "Export" button (modify existing)
│   └── ExportButton.tsx        # Client component for download trigger
├── tasks/actions.ts            # Add subtask suggestion logic (modify existing)
├── tasks/_components/
│   ├── TaskForm.tsx            # Modify to trigger subtask suggestions
│   └── SubtaskSuggestionDialog.tsx  # New: modal for accept/modify/dismiss
lib/
├── services/subtask-suggestions.ts  # Pure function: generate subtask suggestions
├── validations/subtask.ts           # Zod schema for subtask input
components/
├── MobileNav.tsx               # Hamburger menu for mobile nav
```

### Pattern 1: .ics File Download via API Route
**What:** Next.js Route Handler serves .ics as a downloadable file
**When to use:** Calendar export endpoint
**Example:**
```typescript
// app/api/plan/export/route.ts
import ical, { ICalCalendar } from "ical-generator";

export async function GET() {
  const calendar = ical({ name: "BlockPlan" });

  // Add events from plan_blocks...
  calendar.createEvent({
    start: startTime,
    end: endTime,
    summary: taskTitle,
    description: courseName,
    timezone: userTimezone,
  });

  return new Response(calendar.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="blockplan.ics"',
    },
  });
}
```

### Pattern 2: Client-Side File Download Trigger
**What:** Button triggers fetch to API route, browser downloads the file
**When to use:** Export button on plan view
**Example:**
```typescript
// Client component
const handleExport = async () => {
  const res = await fetch("/api/plan/export");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "blockplan.ics";
  a.click();
  URL.revokeObjectURL(url);
};
```

### Pattern 3: Subtask Suggestion as Pure Function
**What:** Deterministic function that takes task params and returns suggested subtasks
**When to use:** After task creation when type is "assignment" and estimated_minutes >= 240
**Example:**
```typescript
// lib/services/subtask-suggestions.ts
import { subDays } from "date-fns";

interface SubtaskSuggestion {
  title: string;
  due_date: Date;
  estimated_minutes: number;
  sort_order: number;
}

export function generateSubtaskSuggestions(
  parentDueDate: Date,
  parentEstimatedMinutes: number,
): SubtaskSuggestion[] {
  return [
    { title: "Outline", due_date: subDays(parentDueDate, 10), estimated_minutes: Math.round(parentEstimatedMinutes * 0.15), sort_order: 0 },
    { title: "First Draft", due_date: subDays(parentDueDate, 7), estimated_minutes: Math.round(parentEstimatedMinutes * 0.40), sort_order: 1 },
    { title: "Revise", due_date: subDays(parentDueDate, 3), estimated_minutes: Math.round(parentEstimatedMinutes * 0.30), sort_order: 2 },
    { title: "Final Submit", due_date: parentDueDate, estimated_minutes: Math.round(parentEstimatedMinutes * 0.15), sort_order: 3 },
  ];
}
```

### Pattern 4: Hamburger Menu for Mobile Nav
**What:** Collapsed navigation menu on small screens, expand on tap
**When to use:** NavHeader component at < 640px (sm breakpoint)
**Example:**
```typescript
// Show/hide nav links based on state + screen size
<nav className="hidden sm:flex items-center gap-4">
  {/* Desktop nav links */}
</nav>
<button className="sm:hidden" onClick={() => setOpen(!open)}>
  {/* Hamburger icon */}
</button>
{open && (
  <div className="absolute top-full left-0 right-0 bg-white border-b sm:hidden">
    {/* Mobile nav links stacked vertically */}
  </div>
)}
```

### Anti-Patterns to Avoid
- **Manual .ics string construction:** Use ical-generator instead of building RFC 5545 format by hand — timezone handling, escaping, and folding are error-prone
- **Hardcoded pixel breakpoints:** Use Tailwind responsive prefixes (sm:, md:, lg:) consistently
- **Fixed-width containers on mobile:** Always use max-w-* with px-4 padding, never fixed px widths
- **Hiding content on mobile:** Stack and reflow, don't hide important functionality

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| .ics file generation | String template for VCALENDAR/VEVENT | ical-generator | Timezone VTIMEZONE blocks, line folding, escaping special characters, recurrence rules |
| Date subtraction for work-back | Manual Date arithmetic | date-fns subDays | Handles month boundaries, DST transitions correctly |
| Responsive navigation | Custom media query JS listeners | Tailwind sm: prefix + React state | Consistent with existing patterns, no JS resize listeners needed |
| File download from API | window.location redirect | fetch + blob + createObjectURL | Allows error handling, loading states, custom filename |

**Key insight:** The .ics format (RFC 5545) has subtle requirements around timezone blocks, line length folding (75 octets), and character escaping that make hand-rolling unreliable.

## Common Pitfalls

### Pitfall 1: Timezone Mismatch in .ics Events
**What goes wrong:** Events show at wrong times in Google Calendar or Apple Calendar
**Why it happens:** .ics times stored as UTC but displayed without timezone context, or timezone specified incorrectly
**How to avoid:** Use ical-generator's timezone parameter on each event; use the user's timezone from user_profiles table (already stored as IANA timezone string like "America/Boise")
**Warning signs:** Events shift by timezone offset when imported

### Pitfall 2: Subtask Due Dates Before Task Creation Date
**What goes wrong:** Work-back scheduling produces subtask due dates in the past
**Why it happens:** Parent task due date is less than 10 days away
**How to avoid:** Clamp subtask due dates to not be earlier than today; if all subtasks would be in the past, show warning or compress the schedule proportionally
**Warning signs:** Subtask with past due date on creation

### Pitfall 3: NavHeader Overflow on Mobile
**What goes wrong:** Nav links overflow and cause horizontal scroll
**Why it happens:** 6+ nav items in a horizontal flex row at 375px
**How to avoid:** Hide desktop nav below sm breakpoint, show hamburger menu instead
**Warning signs:** Horizontal scrollbar appears on mobile

### Pitfall 4: Form Inputs Too Small on Mobile
**What goes wrong:** Input fields and buttons are hard to tap on mobile
**Why it happens:** Default sizing designed for desktop mouse interaction
**How to avoid:** Ensure all touch targets are at least 44px tall; use `text-base` (16px) on inputs to prevent iOS zoom on focus
**Warning signs:** iOS auto-zooms when input is focused (happens when font-size < 16px)

### Pitfall 5: Plan Grid 7-Column Cramped on Tablet
**What goes wrong:** Blocks become unreadably narrow between 640px and 768px
**Why it happens:** sm:grid-cols-7 kicks in at 640px but 7 columns at 640px = ~80px per column
**How to avoid:** Use md:grid-cols-7 instead of sm:grid-cols-7, keep single column until 768px+
**Warning signs:** Truncated text, tiny tap targets in plan blocks

## Code Examples

### .ics Export API Route (Full Pattern)
```typescript
// app/api/plan/export/route.ts
import { createClient } from "@/lib/supabase/server";
import ical from "ical-generator";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Get user timezone
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const timezone = profile?.timezone ?? "America/Boise";

  // Get scheduled plan blocks with task info
  const { data: blocks } = await supabase
    .from("plan_blocks")
    .select("*, tasks(title, course_id, courses(name))")
    .eq("user_id", user.id)
    .eq("status", "scheduled")
    .order("start_time", { ascending: true });

  const calendar = ical({
    name: "BlockPlan Study Schedule",
    timezone,
  });

  for (const block of blocks ?? []) {
    const task = block.tasks as { title: string; courses: { name: string } | null } | null;
    if (!task) continue;

    calendar.createEvent({
      start: new Date(block.start_time),
      end: new Date(block.end_time),
      summary: task.title,
      description: task.courses?.name ?? "",
      timezone,
    });
  }

  return new Response(calendar.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="blockplan.ics"',
    },
  });
}
```

### Subtask Suggestion with Clamping
```typescript
import { subDays, isAfter, startOfDay } from "date-fns";

export function generateSubtaskSuggestions(
  parentDueDate: Date,
  parentEstimatedMinutes: number,
): SubtaskSuggestion[] {
  const today = startOfDay(new Date());
  const clamp = (d: Date) => isAfter(d, today) ? d : today;

  return [
    { title: "Outline", due_date: clamp(subDays(parentDueDate, 10)), estimated_minutes: Math.round(parentEstimatedMinutes * 0.15), sort_order: 0 },
    { title: "First Draft", due_date: clamp(subDays(parentDueDate, 7)), estimated_minutes: Math.round(parentEstimatedMinutes * 0.40), sort_order: 1 },
    { title: "Revise", due_date: clamp(subDays(parentDueDate, 3)), estimated_minutes: Math.round(parentEstimatedMinutes * 0.30), sort_order: 2 },
    { title: "Final Submit", due_date: parentDueDate, estimated_minutes: Math.round(parentEstimatedMinutes * 0.15), sort_order: 3 },
  ];
}
```

### Hamburger Nav Pattern
```typescript
"use client";
import { useState } from "react";

export default function NavHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="text-lg font-semibold">BlockPlan</Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-4">
          <NavLink href="/dashboard">Dashboard</NavLink>
          {/* ... other links ... */}
        </nav>

        {/* Mobile hamburger */}
        <button className="sm:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <nav className="border-t border-gray-100 bg-white px-4 py-2 sm:hidden">
          <NavLink href="/dashboard">Dashboard</NavLink>
          {/* ... stacked vertically ... */}
        </nav>
      )}
    </header>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Build .ics strings manually | ical-generator v10 | 2024 | Full RFC 5545 compliance, timezone support |
| Media query JS listeners | Tailwind responsive prefixes | Standard | No JS needed for breakpoint changes |
| Fixed mobile breakpoint 320px | 375px minimum (iPhone SE) | 2023 | iPhone SE is smallest mainstream device |

## Open Questions

1. **Subtask suggestion UI pattern**
   - What we know: User said modal/dialog/toast — their discretion
   - Recommendation: Use a modal dialog (consistent with existing project patterns like DeleteConfirm). Show suggested subtasks in a table, allow editing due dates and estimated minutes, with "Accept All", "Dismiss" buttons.

2. **Mobile nav: hamburger vs bottom nav**
   - What we know: User left this to Claude's discretion
   - Recommendation: Hamburger menu. Simpler to implement, standard web pattern, doesn't take permanent screen space on mobile. Bottom nav is better for native apps but adds complexity for a web app.

3. **Export button placement**
   - What we know: User said "on the plan view page"
   - Recommendation: Add as secondary button next to "Generate Plan" button in PlanGrid header row. Use outline style to differentiate from primary action.

## Sources

### Primary (HIGH confidence)
- [ical-generator npm](https://www.npmjs.com/package/ical-generator) - v10.0.0, 248K weekly downloads, supports native Date + timezone
- [ical-generator GitHub](https://github.com/sebbo2002/ical-generator) - API documentation, examples
- Project codebase analysis - Existing patterns in app/plan/, lib/services/, schema in migrations

### Secondary (MEDIUM confidence)
- Tailwind CSS v4 responsive design patterns - Applied from existing project usage
- RFC 5545 (iCalendar specification) - Standard for .ics format

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - ical-generator is well-established, all other libraries already in project
- Architecture: HIGH - Follows existing patterns (API routes, Server Actions, Tailwind)
- Pitfalls: HIGH - Well-documented timezone and responsive issues

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable domain, no fast-moving dependencies)
