# Stack Research

**Domain:** Student academic planner / syllabus-to-plan web app
**Researched:** 2026-02-28
**Confidence:** HIGH (core stack verified via npm registry; library choices verified against live package metadata)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | Full-stack React framework | App Router is the standard for server-first Next.js apps; React Server Components reduce client bundle; Server Actions eliminate custom API routes for form mutations |
| TypeScript | 5.9.3 | Type safety across the stack | Required — Supabase generates typed schemas, Zod infers types, prevents runtime errors from LLM-parsed data |
| Tailwind CSS | 4.2.1 | Utility-first styling | v4 is now stable; PostCSS plugin replaces the old config; mobile-first responsive design with no custom CSS overhead |
| Supabase (`@supabase/supabase-js`) | 2.98.0 | Postgres database, auth, file storage | All-in-one: row-level security for per-user isolation, Storage for PDF uploads, Auth for email/password sessions, real-time subscriptions available |
| `@supabase/ssr` | 0.8.0 | Supabase auth in Next.js Server Components | Required adapter for App Router — handles cookie-based sessions in both Server Components and API routes |

### Supporting Libraries

#### PDF Text Extraction

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `unpdf` | 1.4.0 | Server-side PDF text extraction | Primary choice — built for any JS runtime including Vercel Node.js functions, no native binaries, wraps pdfjs-dist internally, actively maintained by UnJS ecosystem (same team as Nitro/Nuxt) |

**Why not `pdf-parse` v1.x (the historically popular choice):** The original `pdf-parse@1.1.1` was last updated in 2018 and uses an outdated pdfjs-dist. The npm package was subsequently taken over (same npm package name `pdf-parse`, now at v2.4.5) by a different author who rewrote it completely with `@napi-rs/canvas` as a native dependency — this will break on Vercel serverless. Avoid both the old v1.x (abandoned) and the new v2.x (requires native canvas bindings incompatible with serverless).

**Why not `pdfjs-dist` directly:** Mozilla's pdfjs-dist (5.4.624) is the underlying engine but requires significant boilerplate to use for text extraction. `unpdf` wraps it cleanly for server environments.

#### Date Handling

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | 4.1.0 | Date arithmetic, formatting, parsing | All date math: calculating due date proximity, scheduling blocks, week boundaries, time comparisons |
| `date-fns-tz` | 3.2.0 | Timezone-aware date operations | User availability windows — BYU-Idaho is Mountain Time; store UTC in Postgres, display in local timezone |
| `chrono-node` | 2.9.0 | Natural language date parsing | Parsing date strings extracted from syllabi ("Due April 15", "Week 3 Monday") — the LLM fallback when regex fails |

**Why date-fns over dayjs/luxon:** date-fns v4 is fully tree-shakeable, TypeScript-first with no separate `@types` package needed, and ships pure functions rather than mutable objects. `date-fns-tz` v3.2.0 explicitly supports date-fns v3 and v4. Luxon is heavier and dayjs plugins add complexity without benefit here.

**Note on Temporal API:** The TC39 Temporal proposal is still in Stage 3 (not yet in any runtime without polyfills as of early 2026). Do not use it — use date-fns + date-fns-tz instead.

#### Calendar Export

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ical-generator` | 10.0.0 | Generate .ics calendar files | Producing downloadable .ics files from scheduled task blocks — supports alarms, recurring events, proper RFC 5545 compliance |

**Why not `ics` (3.8.1):** The `ics` package is simpler but last updated September 2024 and has yup as a runtime dependency (mixing validation libs into the output). `ical-generator` v10.0.0 (released October 2025) has zero runtime dependencies, full TypeScript types, and active development with v10.0.1 in progress as of February 2026.

#### Form Validation

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 4.3.6 | Schema validation and type inference | All user input validation: forms, server action payloads, LLM API response parsing, Supabase query results |
| `react-hook-form` | 7.71.2 | Client-side form state management | Multi-step onboarding wizard, availability editor, task edit forms — reduces re-renders vs controlled inputs |
| `@hookform/resolvers` | 5.2.2 | Bridge between react-hook-form and Zod | Lets Zod schemas drive react-hook-form validation without manual glue code |

**Why Zod 3.x over Zod 4:** Zod v4 is in active beta (dist-tag `beta: 4.1.13-beta.0`, canary builds through Jan 2026). The stable latest is v4.3.6 — wait, this IS v4 stable. Confirmed: `npm show zod version` returns `4.3.6` as latest stable. Zod v4 has significant performance improvements and is safe to use.

**Note on `next-safe-action`:** Version 8.1.4 (updated Feb 2026) adds type-safe middleware around Server Actions with Zod validation built in. Worth adopting for Server Actions to avoid manual error handling boilerplate.

#### LLM Integration

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `ai` (Vercel AI SDK) | 6.0.105 | Unified LLM API with streaming | Preferred over raw `openai` SDK — handles streaming, structured output, tool calling, and is model-agnostic if you switch from OpenAI |
| `@ai-sdk/openai` | 3.0.37 | OpenAI provider for Vercel AI SDK | Pairs with `ai` package; use `openai('gpt-4o-mini')` for cost-effective syllabus parsing |

**Why Vercel AI SDK over raw `openai` (6.25.0):** The raw OpenAI SDK is lower-level and does not handle streaming responses, structured output coercion to Zod schemas, or fallback logic. The Vercel AI SDK `generateObject()` function parses LLM output directly into Zod-validated TypeScript objects — exactly what syllabus parsing needs.

#### UI Components

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (via CLI) | Latest | Accessible, composable component primitives | Onboarding wizard, modals, forms, calendar week view — copy-paste component library built on Radix UI + Tailwind |
| `lucide-react` | 0.575.0 | Icon library | Icons throughout the UI — pairs natively with shadcn/ui |
| `clsx` | 2.1.1 | Conditional class merging | Utility for conditional Tailwind classes |
| `tailwind-merge` | 3.5.0 | Intelligent Tailwind class deduplication | Prevents class conflicts in component variants |

**Note:** shadcn/ui is not an npm package — it's a CLI that copies component source into your project. Run `npx shadcn@latest init` and `npx shadcn@latest add [component]`. Components live in `src/components/ui/`.

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| ESLint | 10.0.2 | Code linting | Use `eslint-config-next` (bundled with Next.js) as base config |
| Prettier | 3.8.1 | Code formatting | Add `prettier-plugin-tailwindcss` for automatic class sorting |
| TypeScript | 5.9.3 | Type checking | `strict: true` in tsconfig — non-negotiable with LLM output parsing |
| Husky | 9.1.7 | Git hooks | Pre-commit: lint + type-check. Prevents broken code from entering main |

## Installation

```bash
# Core (already decided)
npm install next@16.1.6 react react-dom typescript @types/node @types/react @types/react-dom

# Supabase
npm install @supabase/supabase-js@2.98.0 @supabase/ssr@0.8.0

# PDF extraction
npm install unpdf@1.4.0

# Date handling
npm install date-fns@4.1.0 date-fns-tz@3.2.0 chrono-node@2.9.0

# Calendar export
npm install ical-generator@10.0.0

# Validation & forms
npm install zod@4.3.6 react-hook-form@7.71.2 @hookform/resolvers@5.2.2 next-safe-action@8.1.4

# LLM integration
npm install ai@6.0.105 @ai-sdk/openai@3.0.37

# UI
npm install lucide-react@0.575.0 clsx@2.1.1 tailwind-merge@3.5.0

# Dev dependencies
npm install -D eslint prettier prettier-plugin-tailwindcss husky lint-staged

# shadcn/ui (run separately, not npm install)
npx shadcn@latest init
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `unpdf` | `pdfjs-dist` directly | Only if you need PDF rendering (canvas output) — for text-only extraction, unpdf is the cleaner wrapper |
| `ical-generator` | `ics` | If you only need simple single-event .ics with minimal features and don't care about active maintenance |
| `date-fns` | `luxon` | If your app has heavy timezone-aware calendar math across many zones — luxon's API is more explicit for complex tz scenarios |
| `date-fns` | `dayjs` | Almost never — dayjs requires plugins that add complexity equal to date-fns but with worse TypeScript support |
| Vercel AI SDK (`ai`) | `openai` raw SDK | If you know you will never stream responses and only call OpenAI — saves one dependency but loses structured output tooling |
| `react-hook-form` | Controlled inputs | For very simple 2-3 field forms only; any multi-step form (like the onboarding wizard) will benefit from RHF |
| `next-safe-action` | Manual Server Action try/catch | If the team prefers minimal abstractions — next-safe-action reduces boilerplate significantly for validated server actions |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `pdf-parse@1.x` | Abandoned since 2018, uses pdfjs-dist v1, known issues with Vercel cold starts and certain PDF structures | `unpdf` |
| `pdf-parse@2.x` | Requires `@napi-rs/canvas` native bindings — will fail to build/deploy on Vercel serverless functions | `unpdf` |
| `pdfjs-dist` (raw) | Requires significant boilerplate for text extraction; not designed for server-only use | `unpdf` |
| Zod v3 (`zod@3.x`) | Zod v4 (stable at 4.3.6) has 2-10x performance improvements and better error messages; v3 is legacy | `zod@4.3.6` |
| Temporal API polyfill | Stage 3 proposal, not runtime-native, polyfill adds significant bundle size | `date-fns` + `date-fns-tz` |
| `moment.js` | Deprecated by maintainers, not tree-shakeable, 67kb min+gzip | `date-fns` |
| `langchain` | Extremely heavy dependency (1.1.29) with enormous transitive dep tree; overkill for syllabus parsing | Vercel AI SDK |
| `drizzle-orm` | Adds ORM complexity over Supabase's already-excellent typed client; Supabase PostgREST client handles all query patterns needed | `@supabase/supabase-js` directly |
| `multer` / `formidable` | Not compatible with Next.js App Router — file uploads must use the native `request.formData()` API | Native `Request.formData()` in Route Handlers |
| `node-schedule` | Server-side task scheduler — BlockPlan's scheduling is a pure function (compute plan from data), not a background job runner | Pure TypeScript scheduling function |

## Stack Patterns by Variant

**PDF upload flow (App Router):**
- Use a Next.js Route Handler (`app/api/upload/route.ts`) — NOT a Server Action — for file uploads
- Server Actions have a 1MB payload limit; Route Handlers handle multipart/form-data
- Upload PDF to Supabase Storage first, then extract text with `unpdf` from the stored file buffer
- Return extraction result to client; never store raw PDF text long-term (just tasks)

**Server Action validation pattern:**
```typescript
// app/actions/tasks.ts
import { createSafeActionClient } from 'next-safe-action'
import { z } from 'zod'

const action = createSafeActionClient()

const schema = z.object({
  title: z.string().min(1).max(200),
  dueDate: z.string().datetime(),
  estimatedMinutes: z.number().int().min(5).max(480),
})

export const createTask = action
  .schema(schema)
  .action(async ({ parsedInput }) => {
    // parsedInput is fully typed by Zod schema
  })
```

**LLM structured output pattern:**
```typescript
// app/lib/parse-syllabus.ts
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const TaskSchema = z.object({
  tasks: z.array(z.object({
    title: z.string(),
    type: z.enum(['assignment', 'exam', 'reading', 'other']),
    dueDate: z.string().nullable(),
    estimatedMinutes: z.number().nullable(),
  }))
})

export async function parseSyllabus(text: string) {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: TaskSchema,
    prompt: `Extract all tasks from this syllabus:\n\n${text}`,
  })
  return object // fully typed as z.infer<typeof TaskSchema>
}
```

**Scheduling algorithm (pure function, no library needed):**
- The planning engine is a custom TypeScript function, not a library
- Input: tasks with due dates + user availability windows
- Algorithm: greedy due-date-first bin packing into available time slots
- Output: array of `{ taskId, date, startTime, endTime }` schedule entries
- No scheduling library needed — the logic is ~200 lines of pure TypeScript

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `date-fns@4.1.0` | `date-fns-tz@3.2.0` | date-fns-tz v3.2.0 explicitly supports date-fns v3 and v4 |
| `zod@4.3.6` | `@hookform/resolvers@5.2.2` | resolvers v5 supports Zod v4; do not use resolvers v4 with Zod v4 |
| `ai@6.0.105` | `@ai-sdk/openai@3.0.37` | Always install matching major versions of ai + @ai-sdk/* packages |
| `next@16.1.6` | `tailwindcss@4.2.1` | Tailwind v4 uses new PostCSS plugin; follow Next.js v16 setup guide |
| `@supabase/supabase-js@2.98.0` | `@supabase/ssr@0.8.0` | Both actively updated February 2026; pin together |

## Sources

- npm registry (live metadata) — all versions verified 2026-02-28 via `npm show`
- `unpdf@1.4.0` — https://github.com/unjs/unpdf (UnJS ecosystem, published 2025-10-31)
- `pdf-parse@2.x` native dependency issue — verified via `@napi-rs/canvas` in dependencies
- `ical-generator@10.0.0` — zero-dependency ICS generation, published 2025-10-28
- `date-fns-tz@3.2.0` — peer deps confirm `^3.0.0 || ^4.0.0` date-fns support
- Zod v4 stability — `latest` dist-tag at `4.3.6` confirmed stable
- `ai@6.0.105` — Vercel AI SDK v6, updated continuously through February 2026
- `@supabase/supabase-js@2.98.0` — updated 2026-02-26 (2 days before this research)
- `next-safe-action@8.1.4` — updated 2026-02-26

---
*Stack research for: BlockPlan — student academic planner / syllabus-to-plan web app*
*Researched: 2026-02-28*
