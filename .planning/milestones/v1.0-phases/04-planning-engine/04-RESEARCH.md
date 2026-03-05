# Phase 4: Planning Engine - Research

**Researched:** 2026-03-01
**Domain:** Scheduling algorithm, date/timezone arithmetic, Supabase JSONB, Next.js Server Actions, plan view UI
**Confidence:** HIGH (architecture from existing codebase + verified docs), MEDIUM (date-fns/tz API specifics, toast pattern)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Planner Configuration**: Settings page section or dedicated `/plan/settings` route for max block length (default 90 min, 25–120 min range), min block length (default 25 min, 15–60 min range), buffer time (default 10 min, 0–30 min range). Settings stored per-user, persist across plan regenerations.
- **Scheduling Algorithm**: Greedy earliest-due-date-first bin packing. Process: collect incomplete tasks sorted by due date → iterate 7-day availability windows → fit tasks into blocks respecting max/min block length and buffer. Tasks with estimated_minutes > max block length split across multiple blocks. Tasks without due dates scheduled after dated tasks. Never schedule past a task's due date. All times in user's local timezone (availability rules are wall-clock times).
- **Plan Generation Trigger**: "Generate Plan" button on plan view page. Replaces existing plan_blocks for user (delete old, insert new). Covers next 7 days from current date. Also triggered automatically after marking blocks as missed (auto-reschedule).
- **Plan View (Minimal for Phase 4)**: Route `/plan` or `/plan/week`. Simple 7-day grid showing scheduled blocks per day. Each block shows: task title, time range, course color/name. Blocks are clickable/tappable to mark as done or missed. "Generate Plan" button at top. Risk badges when tasks can't fit before due dates.
- **Auto-Reschedule**: When user marks a block "missed", system automatically replans. Replan uses same algorithm but starts from current date/time forward. Only reschedules incomplete tasks. Shows brief notification/toast: "Plan updated — X blocks rescheduled."
- **Risk Detection**: After plan generation, check for tasks whose estimated remaining time exceeds available time before due date. Show risk badge (warning icon + text). Risk levels: "At risk" (tight but possible), "Overdue risk" (not enough time). No tasks silently dropped — always show them even if unschedulable.

### Claude's Discretion

- Exact scheduling algorithm implementation details
- Plan view layout (timeline vs grid vs list)
- How to handle timezone edge cases
- Where to store planner settings (JSON column vs separate table)
- Risk badge visual design
- Whether to show "Generate Plan" on dashboard or only on /plan
- Block color coding strategy

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | System generates a plan that schedules tasks into available time blocks before their due dates | Scheduler service pattern in `lib/services/scheduler.ts`; greedy EDD bin packing algorithm; `plan_blocks` table already exists in schema |
| PLAN-02 | Planning respects user-defined availability windows | `availability_rules` table already in schema with `day_of_week`, `start_time` (TIME), `end_time` (TIME), `rule_type` ('available'/'blocked'/'preferred'); wall-clock times already stored |
| PLAN-03 | Planning uses earliest due date first as scheduling priority | Sort tasks by `due_date ASC` before bin-packing; tasks with null due_date go last |
| PLAN-04 | User can configure max block length (default 90 minutes) | Planner settings JSONB column on `users` table (or separate `planner_settings` table) + settings UI section |
| PLAN-05 | User can configure min block length (default 25 minutes) | Same storage as PLAN-04 |
| PLAN-06 | User can configure buffer time between blocks (default 10 minutes) | Same storage as PLAN-04 |
| PLAN-07 | Plan outputs time blocks assigned to specific tasks for the next 7 days | `plan_blocks` table: `task_id`, `start_time TIMESTAMPTZ`, `end_time TIMESTAMPTZ`, `status`; delete-then-insert generation pattern |
| RESC-01 | When user marks blocks as missed, system replans remaining tasks into future availability | `markBlockMissed` Server Action → update block status → call scheduler with current datetime as new start → delete+insert future plan_blocks |
| RESC-02 | System shows risk badges when workload exceeds available time | Scheduler returns `unscheduled: Task[]` (tasks that could not be fit before due date); UI renders risk badges per unschedulable task |
| RESC-03 | Catch-up mode recalculates plan from current state forward | Same scheduler function, different `planStart` parameter (now vs start-of-today); only processes tasks with status != 'done' |
</phase_requirements>

---

## Summary

Phase 4 builds the core scheduling loop: read tasks and availability from Supabase, run a deterministic greedy algorithm to produce time blocks, persist to `plan_blocks`, and render a 7-day view. The `plan_blocks` table already exists in the schema from Phase 1. Availability rules are already stored in the correct format (`day_of_week` int, `start_time TIME`, `end_time TIME`, `rule_type`). The scheduler needs no new database tables beyond a migration to add planner settings storage.

The key technical challenge is timezone arithmetic. Availability rules are wall-clock strings ("07:00", "21:00") per day-of-week. The scheduler must combine these with a concrete date (e.g., Tuesday 2026-04-07) to produce UTC-anchored TIMESTAMPTZ values for `plan_blocks.start_time` and `plan_blocks.end_time`. `date-fns` v4 is already installed and includes first-class timezone support via the separately-installed `@date-fns/tz` package. This is the correct tool — no additional heavy libraries needed.

The scheduling algorithm itself is straightforward: sort incomplete tasks by due date ascending, walk through each available window in the next 7 days, fit tasks into blocks respecting min/max block length and buffer time, split tasks that exceed max block length across multiple blocks. Tasks that cannot be placed before their due date go into a "risk" bucket returned alongside the `ScheduledBlock[]` result. The scheduler must be a pure function (inputs → outputs, no side effects) so it can be unit tested without database access.

**Primary recommendation:** Implement the scheduler as a pure TypeScript function in `lib/services/scheduler.ts`. Represent times internally as UTC Date objects converted from wall-clock strings + user timezone. Persist results using the existing delete-then-insert batch pattern. Store planner settings as JSONB in a `planner_settings` column on the `users` table (or a simple dedicated table — both are valid; JSONB column is simpler and consistent with the `meeting_times` JSONB precedent set in Phase 2).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| date-fns | ^4.1.0 (already installed) | Date arithmetic: addDays, startOfDay, differenceInMinutes, format, getDay | Already in project; v4 has first-class tz support |
| @date-fns/tz | ~1.x (new install) | Timezone-aware date operations via `TZDate` and `tz()` context | Required companion to date-fns v4 for wall-clock→UTC conversion |
| zod | ^3.25.76 (already installed) | Planner settings schema validation | Already in project; consistent with all other validations |
| Supabase JS | ^2.98.0 (already installed) | Persist plan_blocks and read availability_rules | Already in project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^2.x (new install) | Toast notifications for "Plan updated — X blocks rescheduled" | Needed for RESC-01 auto-reschedule notification; lightweight, works with Next.js App Router |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @date-fns/tz | date-fns-tz | date-fns-tz is the v2/v3 companion; @date-fns/tz is the official v4 companion — use the v4-native package since date-fns v4 is already installed |
| JSONB column for settings | Separate `planner_settings` table | Separate table is cleaner for complex schemas; JSONB column is simpler for 3 numeric fields that will never be queried individually — JSONB wins for MVP |
| sonner | react-hot-toast, custom state | Sonner is currently the most recommended toast library for Next.js App Router; integrates cleanly with useActionState and useEffect pattern |

**Installation:**
```bash
npm install @date-fns/tz sonner
```

---

## Architecture Patterns

### Recommended Project Structure

New files this phase adds to the existing structure:

```
lib/
├── services/
│   └── scheduler.ts          # Pure scheduler function (no DB access)
├── validations/
│   └── planner.ts            # Zod schema for planner settings
app/
├── plan/
│   ├── page.tsx              # Server Component: fetch plan_blocks + tasks + courses
│   └── _components/
│       ├── PlanGrid.tsx      # 'use client' — 7-day grid view
│       ├── PlanBlock.tsx     # 'use client' — single block with done/missed buttons
│       └── RiskBadge.tsx     # 'use client' — risk badge component
├── settings/
│   └── page.tsx              # Extend existing settings page with PlannerSettings section
│   └── _components/
│       └── PlannerSettings.tsx  # 'use client' — max/min block length + buffer form
└── api/
    (no new Route Handlers needed — all mutations via Server Actions)
supabase/
└── migrations/
    └── 00002_planner_settings.sql   # Add planner_settings column to users table
```

Server Actions location: `app/plan/actions.ts` — generatePlan, markBlockDone, markBlockMissed, savePlannerSettings

### Pattern 1: Pure Scheduler Function

**What:** The scheduler is a pure TypeScript function — takes inputs, returns outputs, no side effects, no database access.

**When to use:** All plan generation: initial, auto-reschedule, and catch-up.

**Why pure:** Enables unit testing without mocking Supabase. Can verify edge cases (overload, zero availability, past due dates) with `scheduler(inputs)` assertions. Matches the established pattern from `lib/syllabus/parser-rule-based.ts` and `lib/syllabus/parser-llm.ts`.

**Scheduler inputs/outputs:**
```typescript
// lib/services/scheduler.ts

export interface AvailabilityRule {
  day_of_week: number;   // 0 = Sunday, 6 = Saturday
  start_time: string;    // "HH:MM"
  end_time: string;      // "HH:MM"
  rule_type: 'available' | 'blocked' | 'preferred';
}

export interface SchedulableTask {
  id: string;
  title: string;
  course_id: string;
  due_date: string | null;      // ISO string (TIMESTAMPTZ)
  estimated_minutes: number;
  status: 'todo' | 'doing';    // 'done' tasks excluded before calling scheduler
}

export interface PlannerSettings {
  max_block_minutes: number;    // default 90
  min_block_minutes: number;    // default 25
  buffer_minutes: number;       // default 10
}

export interface ScheduledBlock {
  task_id: string;
  start_time: Date;             // UTC Date object
  end_time: Date;               // UTC Date object
}

export interface SchedulerResult {
  blocks: ScheduledBlock[];
  unscheduled: SchedulableTask[];   // tasks that could not fit before due date
  risk_tasks: Array<{               // tasks that fit but with tight margins
    task: SchedulableTask;
    level: 'at_risk' | 'overdue_risk';
  }>;
}

export function generateSchedule(
  tasks: SchedulableTask[],
  availabilityRules: AvailabilityRule[],
  settings: PlannerSettings,
  userTimezone: string,     // e.g., "America/Boise"
  planStart: Date,          // now() or start of today
): SchedulerResult {
  // Implementation below
}
```

### Pattern 2: Wall-Clock to UTC Conversion with @date-fns/tz

**What:** Convert availability rule time strings ("07:00") + a concrete date + user timezone into a UTC Date for `plan_blocks.start_time`.

**When to use:** Inside the scheduler, for every available window slot on each day in the 7-day planning horizon.

**Example:**
```typescript
// Source: https://blog.date-fns.org/v40-with-time-zone-support/
import { TZDate } from "@date-fns/tz";
import { addMinutes, addDays, startOfDay } from "date-fns";
import { tz } from "@date-fns/tz";

// Convert a wall-clock "HH:MM" string to a UTC Date for a given date and timezone
function wallClockToUTC(
  dateInUserTZ: Date,       // the calendar day (any time)
  timeStr: string,          // "07:00" or "21:00"
  userTimezone: string
): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  // Create a TZDate representing midnight of that day in the user's timezone
  const dayStart = startOfDay(dateInUserTZ, { in: tz(userTimezone) });
  // Add hours and minutes to get wall-clock time
  return addMinutes(dayStart, hours * 60 + minutes);
}

// Iterate 7 days from planStart
for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
  const dayDate = addDays(planStart, dayOffset, { in: tz(userTimezone) });
  const dayOfWeek = getDay(dayDate, { in: tz(userTimezone) }); // 0=Sun, 6=Sat

  const rulesForDay = availabilityRules.filter(
    r => r.day_of_week === dayOfWeek && r.rule_type === 'available'
  );

  for (const rule of rulesForDay) {
    const windowStart = wallClockToUTC(dayDate, rule.start_time, userTimezone);
    const windowEnd = wallClockToUTC(dayDate, rule.end_time, userTimezone);
    // Fit tasks into [windowStart, windowEnd]
  }
}
```

### Pattern 3: Greedy EDD Bin Packing with Task Splitting

**What:** The core scheduling logic: sort tasks by due date, walk windows, fill blocks.

**When to use:** Inside `generateSchedule()`.

**Algorithm:**
```typescript
// Pseudocode — implement in lib/services/scheduler.ts
function generateSchedule(...): SchedulerResult {
  // 1. Sort: tasks with due_date ASC, null due_dates go last
  const sorted = [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  // 2. Build list of mutable "remaining minutes" per task
  const remaining = new Map<string, number>(
    sorted.map(t => [t.id, t.estimated_minutes])
  );

  const blocks: ScheduledBlock[] = [];
  const unscheduled: SchedulableTask[] = [];

  // 3. For each task, track if it was fully placed before its due date
  const placedMinutes = new Map<string, number>(
    sorted.map(t => [t.id, 0])
  );

  // 4. Build 7-day window list (sorted by start_time ASC)
  const windows = buildAvailabilityWindows(
    availabilityRules, userTimezone, planStart
  );

  // 5. Cursor tracks current position in time within each window
  let cursorTime: Date = planStart;

  for (const window of windows) {
    if (cursorTime < window.start) cursorTime = window.start;
    if (cursorTime >= window.end) continue;

    // Apply minimum: advance cursor past blocks already placed
    while (cursorTime < window.end) {
      // Find next task with remaining minutes that is schedulable before its due date
      const task = findNextSchedulableTask(sorted, remaining, cursorTime, settings);
      if (!task) break;

      const taskRemaining = remaining.get(task.id)!;

      // Available time in this window slot
      const windowAvailable = differenceInMinutes(window.end, cursorTime);

      // Block duration: min(remaining for task, max_block_minutes, windowAvailable)
      const blockDuration = Math.min(
        taskRemaining,
        settings.max_block_minutes,
        windowAvailable
      );

      // Only place if blockDuration >= min_block_minutes
      if (blockDuration < settings.min_block_minutes) break;

      const blockEnd = addMinutes(cursorTime, blockDuration);

      blocks.push({ task_id: task.id, start_time: cursorTime, end_time: blockEnd });
      remaining.set(task.id, taskRemaining - blockDuration);
      placedMinutes.set(task.id, (placedMinutes.get(task.id) ?? 0) + blockDuration);

      // Advance cursor: blockEnd + buffer
      cursorTime = addMinutes(blockEnd, settings.buffer_minutes);
    }
  }

  // 6. Any task with remaining > 0 and due_date in the past relative to plan = unscheduled risk
  for (const task of sorted) {
    if ((remaining.get(task.id) ?? 0) > 0) {
      unscheduled.push(task);
    }
  }

  return { blocks, unscheduled, risk_tasks: classifyRisk(unscheduled) };
}
```

### Pattern 4: Server Action — Generate Plan

**What:** Server Action that orchestrates: load data → run scheduler → delete old blocks → insert new blocks → revalidate.

**When to use:** "Generate Plan" button click; auto-reschedule after block marked missed.

**Example:**
```typescript
// app/plan/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateSchedule } from '@/lib/services/scheduler'

export async function generatePlan(): Promise<{
  success: boolean;
  blocksScheduled?: number;
  unscheduledCount?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Load tasks (non-done only)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, course_id, due_date, estimated_minutes, status')
    .eq('user_id', user.id)
    .neq('status', 'done');

  // Load availability rules
  const { data: rules } = await supabase
    .from('availability_rules')
    .select('day_of_week, start_time, end_time, rule_type')
    .eq('user_id', user.id);

  // Load planner settings (with defaults)
  const { data: profile } = await supabase
    .from('users')
    .select('planner_settings, timezone')
    .eq('id', user.id)
    .single();

  const settings = {
    max_block_minutes: profile?.planner_settings?.max_block_minutes ?? 90,
    min_block_minutes: profile?.planner_settings?.min_block_minutes ?? 25,
    buffer_minutes: profile?.planner_settings?.buffer_minutes ?? 10,
  };

  const userTimezone = profile?.timezone ?? 'America/Boise';

  const result = generateSchedule(
    tasks ?? [],
    rules ?? [],
    settings,
    userTimezone,
    new Date()
  );

  // Delete existing future plan_blocks, insert new ones
  await supabase
    .from('plan_blocks')
    .delete()
    .eq('user_id', user.id)
    .gte('start_time', new Date().toISOString());

  if (result.blocks.length > 0) {
    await supabase.from('plan_blocks').insert(
      result.blocks.map(b => ({
        user_id: user.id,
        task_id: b.task_id,
        start_time: b.start_time.toISOString(),
        end_time: b.end_time.toISOString(),
        status: 'scheduled',
      }))
    );
  }

  revalidatePath('/plan');
  revalidatePath('/dashboard');

  return {
    success: true,
    blocksScheduled: result.blocks.length,
    unscheduledCount: result.unscheduled.length,
  };
}
```

### Pattern 5: Block Status Toggle with Optimistic UI

**What:** Marking a block done or missed uses the same `useOptimistic` + `useTransition` pattern as `StatusToggle.tsx` from Phase 2.

**When to use:** PlanBlock component — done/missed buttons.

**Example:**
```typescript
// app/plan/_components/PlanBlock.tsx
'use client'
import { useOptimistic, useTransition } from 'react'
import { markBlockDone, markBlockMissed } from '../actions'

export function PlanBlock({ block }: { block: PlanBlockWithTask }) {
  const [optimisticStatus, setOptimistic] = useOptimistic(block.status);
  const [isPending, startTransition] = useTransition();

  const handleDone = () => {
    startTransition(async () => {
      setOptimistic('done');
      await markBlockDone(block.id);
    });
  };

  const handleMissed = () => {
    startTransition(async () => {
      setOptimistic('missed');
      await markBlockMissed(block.id);
      // markBlockMissed Server Action also triggers auto-replan internally
    });
  };

  // render based on optimisticStatus
}
```

### Pattern 6: Toast Notification for Auto-Reschedule

**What:** After `markBlockMissed` triggers a replan, show "Plan updated — X blocks rescheduled" toast.

**When to use:** Auto-reschedule flow only (RESC-01).

**Pattern:** Sonner library + `useEffect` on Server Action state return value.

```typescript
// In PlanBlock (or parent PlanGrid):
import { toast } from 'sonner'
import { useEffect } from 'react'

// markBlockMissed returns { rescheduledCount: number }
// After Server Action resolves, call:
useEffect(() => {
  if (rescheduleResult?.rescheduledCount !== undefined) {
    toast(`Plan updated — ${rescheduleResult.rescheduledCount} blocks rescheduled`);
  }
}, [rescheduleResult]);

// Root layout needs: <Toaster /> from 'sonner'
```

### Pattern 7: Planner Settings Storage — JSONB Column on Users Table

**What:** Store `{ max_block_minutes, min_block_minutes, buffer_minutes }` as JSONB in a `planner_settings` column on the `auth.users`-linked `users` table (or a `public.users` profiles table).

**Decision:** The existing schema does NOT have a `public.users` profiles table. The schema uses `auth.users` directly via `user_id` FK. Recommend: add a `public.user_profiles` table (or a `planner_settings` column on a new `public.user_profiles` table) in the Phase 4 migration. This is simpler than polluting `auth.users`.

**Migration:**
```sql
-- supabase/migrations/00002_planner_settings.sql

-- User profiles table (planner settings + timezone)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'America/Boise',
  planner_settings JSONB NOT NULL DEFAULT '{
    "max_block_minutes": 90,
    "min_block_minutes": 25,
    "buffer_minutes": 10
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Anti-Patterns to Avoid

- **Calling the scheduler inside the render path:** Never run the scheduler synchronously during page load. Scheduler is called from Server Actions triggered by user interaction ("Generate Plan" button or "Mark Missed"). The plan_blocks table is the persistent output — the page reads from that, not from re-running the scheduler.
- **Using naive Date arithmetic for availability windows:** `new Date("2026-04-07 07:00")` produces a local-timezone date on the client but UTC on Vercel servers. Always use `TZDate` or the `tz()` context option from `@date-fns/tz` for all availability window calculations.
- **Silently dropping tasks:** If the scheduler can't place a task before its due date, it must go into `result.unscheduled` — never simply omitted. The UI must surface all unscheduled tasks as risk items (RESC-02).
- **Scheduling blocks in the past:** If `planStart` is now(), skip any availability windows that have already passed. Apply `if (windowEnd <= planStart) continue`.
- **Using delete-all instead of delete-future:** When auto-rescheduling after a missed block, only delete plan_blocks with `start_time >= now()` — don't delete already-done blocks (which are historical records).
- **Re-running scheduler on every page view:** Schedule generation is triggered explicitly. The `/plan` page reads from `plan_blocks` table, not from a live scheduler call.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wall-clock → UTC conversion | Custom timezone offset math | `@date-fns/tz` TZDate + tz() | DST transitions (Mountain Time goes DST in spring) make manual offset arithmetic wrong twice a year |
| Toast notifications | Custom React state + CSS animation | `sonner` | Positioning, stacking, accessibility, auto-dismiss — all solved; ~4KB gzipped |
| Availability overlap checking | Re-implement in scheduler | Already done in `lib/validations/availability.ts` | `availabilityRulesArraySchema` already rejects overlapping rules at save time; scheduler can assume non-overlapping |
| Block time arithmetic | Manual millisecond math | `differenceInMinutes`, `addMinutes` from date-fns | Already installed; avoids DST off-by-one errors |

**Key insight:** The hardest part of this phase is not the algorithm — it is the timezone arithmetic. The greedy EDD algorithm is ~50 lines of TypeScript. Getting `wallClockToUTC()` correct across DST boundaries is where bugs hide. Invest in `@date-fns/tz` rather than custom date math.

---

## Common Pitfalls

### Pitfall 1: Wall-Clock Times Treated as UTC

**What goes wrong:** Availability rules store `start_time = '07:00'` (a TIME column with no timezone). The scheduler combines this with a date using `new Date()` or string concatenation like `new Date("2026-04-07T07:00:00")`, which the Vercel Node.js runtime interprets as UTC — 7 hours off for Mountain Time. Blocks appear at 1 AM instead of 7 AM on the plan view.

**Why it happens:** Postgres `TIME` columns are timezone-naive by design. The connection between a wall-clock time and a concrete UTC timestamp requires knowing the user's timezone.

**How to avoid:** Always use `@date-fns/tz` for combining date + wall-clock time. Store user timezone in `user_profiles.timezone`. Use `startOfDay(date, { in: tz(userTimezone) })` + `addMinutes` to build the UTC Date. Never use `new Date("2026-04-07T07:00:00")` without an explicit timezone.

**Warning signs:** Plan blocks appear at wrong hours. Block times shift by exactly 6 or 7 hours (Utah Mountain offset).

### Pitfall 2: Scheduler Runs Forever on Zero Availability

**What goes wrong:** User has no `availability_rules` with `rule_type = 'available'`. The scheduler's window loop finds zero windows and exits immediately. If the loop has no guard, it silently produces an empty result. All tasks go into `unscheduled`. The user sees no plan and no explanation.

**How to avoid:** Before running the scheduler, check `availabilityRules.filter(r => r.rule_type === 'available').length > 0`. If zero, return early with `{ blocks: [], unscheduled: tasks, risk_tasks: [] }`. Surface a clear UI message: "Add availability windows in Settings before generating a plan."

**Warning signs:** Plan page shows empty 7-day grid with no error message.

### Pitfall 3: Task Splitting Creates Fragments Smaller than min_block_minutes

**What goes wrong:** A task has 100 minutes remaining. Max block = 90 min. After the first 90-minute block, 10 minutes remain. The next available window has only 8 minutes (before buffer runs out). The `blockDuration = min(10, 90, 8) = 8` is below `min_block_minutes = 25`. If the guard is missing, an 8-minute block is scheduled — too short to be useful and violates the user's configuration.

**How to avoid:** When `blockDuration < settings.min_block_minutes`, skip placing a block in this window slot and advance the cursor to the next window. The remaining minutes for that task persist and get placed in the next window that has enough space.

**Warning signs:** Plan shows blocks with durations below the user's configured minimum.

### Pitfall 4: Delete-All Destroys Historical Done Blocks on Replan

**What goes wrong:** Auto-reschedule triggered after a missed block runs `DELETE FROM plan_blocks WHERE user_id = $1` (delete all). This removes already-done blocks, erasing the user's completion history. On the next page load, done blocks from the morning are gone.

**How to avoid:** Replan only deletes `status = 'scheduled'` blocks (or `start_time >= now()`). Done and missed blocks are historical records — never delete them during replan. Use: `DELETE FROM plan_blocks WHERE user_id = $1 AND status = 'scheduled' AND start_time >= now()`.

**Warning signs:** User's "done" blocks disappear after a missed block triggers replan.

### Pitfall 5: Risk Detection Is Post-Hoc and Inaccurate

**What goes wrong:** Risk badges are computed by querying the database after plan generation: "how many tasks have due dates before the last block scheduled for them?" This is complex to query and can produce stale results. Or risk is computed purely by comparing total task hours to total available hours across the whole week — which doesn't account for due dates.

**How to avoid:** The scheduler already knows which tasks are unscheduled. Return `unscheduled: SchedulableTask[]` directly from `generateSchedule()`. Store this information at generation time — either in a separate column on the task, or persist in the `generatePlan` Server Action return value which the UI can use to update state. For Phase 4, the simplest approach: the `generatePlan` Server Action returns `{ unscheduledTaskIds: string[] }` and the plan page uses this to show risk badges in the initial render after generation.

**Warning signs:** Risk badges show for tasks that are actually scheduled, or vice versa.

### Pitfall 6: Plan View Shows Stale Data After Replan

**What goes wrong:** Auto-reschedule completes on the server, `revalidatePath('/plan')` is called, but the Client Component holding the plan grid is not re-rendered because the user hasn't navigated. The toast says "Plan updated" but the grid still shows old blocks.

**How to avoid:** Use `router.refresh()` in the Client Component after the Server Action resolves. This triggers a server re-render and refreshes the RSC payload for the current page without a full navigation. `revalidatePath` handles server cache invalidation; `router.refresh()` triggers the client to request the fresh RSC payload.

**Warning signs:** Plan grid doesn't update after auto-reschedule despite toast notification appearing.

---

## Code Examples

### Availability Window Builder

```typescript
// lib/services/scheduler.ts
import { addDays, addMinutes, differenceInMinutes, startOfDay, getDay } from 'date-fns';
import { tz } from '@date-fns/tz';

interface TimeWindow {
  start: Date;  // UTC
  end: Date;    // UTC
}

function buildAvailabilityWindows(
  rules: AvailabilityRule[],
  userTimezone: string,
  planStart: Date,
): TimeWindow[] {
  const windows: TimeWindow[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const dayDate = addDays(planStart, dayOffset, { in: tz(userTimezone) });
    const dayOfWeek = getDay(dayDate, { in: tz(userTimezone) }); // 0=Sun

    const availableRules = rules.filter(
      r => r.day_of_week === dayOfWeek && r.rule_type === 'available'
    );

    for (const rule of availableRules) {
      const dayStart = startOfDay(dayDate, { in: tz(userTimezone) });
      const [startH, startM] = rule.start_time.split(':').map(Number);
      const [endH, endM] = rule.end_time.split(':').map(Number);

      const windowStart = addMinutes(dayStart, startH * 60 + startM);
      const windowEnd = addMinutes(dayStart, endH * 60 + endM);

      // Skip windows already in the past
      if (windowEnd <= planStart) continue;
      // Trim windows that start before planStart
      windows.push({
        start: windowStart < planStart ? planStart : windowStart,
        end: windowEnd,
      });
    }
  }

  // Sort by start time ascending
  return windows.sort((a, b) => a.start.getTime() - b.start.getTime());
}
```

### Risk Classification

```typescript
// lib/services/scheduler.ts
function classifyRisk(
  unscheduled: SchedulableTask[],
  now: Date
): Array<{ task: SchedulableTask; level: 'at_risk' | 'overdue_risk' }> {
  return unscheduled.map(task => ({
    task,
    // If due date has already passed or due date is within 24 hours: overdue_risk
    // If there's some time but not enough capacity: at_risk
    level: !task.due_date || new Date(task.due_date) <= now
      ? 'overdue_risk'
      : 'at_risk',
  }));
}
```

### Planner Settings Validation

```typescript
// lib/validations/planner.ts
import { z } from 'zod';

export const plannerSettingsSchema = z.object({
  max_block_minutes: z.number().int().min(25).max(120).default(90),
  min_block_minutes: z.number().int().min(15).max(60).default(25),
  buffer_minutes: z.number().int().min(0).max(30).default(10),
}).refine(
  (s) => s.min_block_minutes <= s.max_block_minutes,
  { message: 'Minimum block must be ≤ maximum block', path: ['min_block_minutes'] }
);

export type PlannerSettings = z.infer<typeof plannerSettingsSchema>;
```

### Sonner Setup in Root Layout

```typescript
// app/layout.tsx — add Toaster
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `date-fns-tz` (separate package) | `@date-fns/tz` (official v4 companion) | date-fns v4 release 2024 | `date-fns-tz` still works with v3 but is not the official v4 path; `@date-fns/tz` uses the new `in:` context option API |
| Manual TZ offset math | `TZDate` + `tz()` context from `@date-fns/tz` | date-fns v4 | DST-safe, no manual offset calculation |
| `react-hot-toast` | `sonner` | 2023–2024 | Sonner is now the standard recommendation for React/Next.js toast; more accessible, better animation, smaller bundle |
| Separate scheduler API route | Pure function called from Server Action | App Router pattern | Cleaner: no HTTP overhead, no separate route file, directly testable |

**Deprecated/outdated:**
- `date-fns-tz`: Use `@date-fns/tz` when paired with date-fns v4. The `date-fns-tz` package targets v2/v3.

---

## Open Questions

1. **Does the existing schema have a `public.user_profiles` table or a way to store timezone?**
   - What we know: Phase 1 schema (`00001_initial_schema.sql`) does NOT create a `public.user_profiles` table. All tables reference `auth.users(id)` directly via `user_id` FK.
   - What's unclear: Was a profiles table ever intended but omitted? The PITFALLS.md notes that timezone should be stored on the user profile, but no profile table exists.
   - Recommendation: Create `public.user_profiles` in Phase 4 migration (`00002_planner_settings.sql`) with `timezone` and `planner_settings JSONB`. This is the cleanest approach and avoids polluting `auth.users`. Profile row created automatically when user first uses the plan settings page (upsert pattern).

2. **Should timezone be captured at onboarding or at plan settings time?**
   - What we know: CONTEXT.md says "all times in user's local timezone (availability rules are wall-clock times)." User timezone is not currently captured anywhere in the schema.
   - What's unclear: When should the user set their timezone? Onboarding (Phase 2, already shipped) did not capture it.
   - Recommendation: For Phase 4, auto-detect timezone from browser using `Intl.DateTimeFormat().resolvedOptions().timeZone` when the user first generates a plan. Store on `user_profiles.timezone`. Show the detected timezone in plan settings with an option to change it. This avoids adding a step to the already-complete onboarding flow.

3. **How should unscheduled tasks persist across page loads?**
   - What we know: The `generatePlan` Server Action knows which tasks are unscheduled at generation time. The `plan_blocks` table stores only scheduled blocks (no unscheduled records).
   - What's unclear: When user navigates away and returns to `/plan`, how do risk badges know which tasks are at risk?
   - Recommendation: After plan generation, the Server Action can compute risk inline by comparing tasks not fully covered by `plan_blocks` against their due dates. The `/plan` page Server Component can query: `tasks with (status != 'done') that have no future plan_blocks, or have less total planned minutes than estimated_minutes`. This avoids a separate risk storage column.

---

## Sources

### Primary (HIGH confidence)

- Codebase: `/supabase/migrations/00001_initial_schema.sql` — confirmed `plan_blocks` schema, `availability_rules` schema, all FK patterns, RLS patterns, update triggers
- Codebase: `/lib/validations/availability.ts` — confirmed availability rule types, TIME format, overlap validation already exists
- Codebase: `/app/tasks/_components/StatusToggle.tsx` — confirmed `useOptimistic` + `useTransition` pattern to reuse for block status toggle
- Codebase: `/package.json` — confirmed `date-fns: ^4.1.0` installed, no `@date-fns/tz` yet, no sonner
- Codebase: `/app/syllabi/review/actions.ts`, `/app/tasks/actions.ts` — confirmed Server Action patterns (auth check, defense in depth, revalidatePath)
- Codebase: `.planning/research/ARCHITECTURE.md` — confirmed service layer pattern, pure function services, delete-then-insert batch, DAL pattern
- `@date-fns/tz` npm package — confirmed separate install required for v4 timezone support

### Secondary (MEDIUM confidence)

- [date-fns v4 timezone blog post](https://blog.date-fns.org/v40-with-time-zone-support/) — TZDate, tz() context option API confirmed; not all specific function signatures verified in docs
- [sonner npm](https://www.npmjs.com/package/sonner) + [React toast libraries 2025 comparison](https://blog.logrocket.com/react-toast-libraries-compared-2025/) — sonner confirmed as current standard for Next.js App Router toast
- [WebSearch: Robin Wieruch Server Actions + Toast](https://www.robinwieruch.de/react-server-actions-toast/) — `useActionState` + `useEffect` + toast pattern confirmed as standard approach; `router.refresh()` for RSC re-render confirmed

### Tertiary (LOW confidence)

- Training knowledge: Greedy EDD scheduling algorithm structure — well-established CS algorithm, LOW only because no authoritative TypeScript source verified
- Training knowledge: JSONB default value syntax in Postgres — `'{...}'::jsonb` pattern is standard but specific Supabase migration behavior not verified against current docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all core libraries verified against codebase and npm
- Architecture: HIGH — patterns directly derived from existing codebase (StatusToggle, actions.ts, service layer)
- Scheduling algorithm: MEDIUM — EDD greedy is standard CS algorithm; TypeScript implementation details not verified against existing reference implementation
- Timezone arithmetic: MEDIUM — @date-fns/tz API shape confirmed from blog post and npm; specific function overloads not fully verified in current docs
- Pitfalls: HIGH — derived from existing PITFALLS.md (already researched for this project) + codebase analysis

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable ecosystem; date-fns v4 and sonner are mature)
