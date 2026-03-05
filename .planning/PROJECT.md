# BlockPlan

## What This Is

BlockPlan is a web app that turns BYU-Idaho students' syllabi into adaptive weekly plans with time-blocked study schedules. Students upload syllabus PDFs, confirm extracted tasks, set their availability around work and church commitments, and get a generated weekly plan that reschedules automatically when life happens.

## Core Value

Students always know exactly what to work on next and when — the plan adapts to them, not the other way around.

## Requirements

### Validated

- ✓ Email/password authentication with session persistence — v1.0
- ✓ Account deletion with cascade cleanup — v1.0
- ✓ Onboarding wizard: create term, add courses, upload syllabi, set availability — v1.0
- ✓ PDF syllabus upload with server-side text extraction — v1.0
- ✓ Rule-based + LLM-assisted syllabus parsing (assignments, exams, readings) — v1.0
- ✓ Extraction review screen where students confirm/edit parsed items — v1.0
- ✓ Task model: assignment, exam, reading, other — with due dates, estimated minutes, status — v1.0
- ✓ Auto-suggested subtask breakdown for large tasks (papers/projects) with work-back scheduling — v1.0
- ✓ Planning engine: schedule tasks into available time blocks using due-date priority — v1.0
- ✓ User-defined availability windows with blocked times and preferred study windows — v1.0
- ✓ Configurable block length (25–90 min) and buffer time — v1.0
- ✓ Weekly view with blocks per day and assigned tasks — v1.0
- ✓ Daily view: top priorities + estimated time remaining today — v1.0
- ✓ "Today" dashboard: top 5 items, next scheduled block, risk alerts — v1.0
- ✓ Auto-reschedule: replan remaining tasks when blocks are missed (catch-up mode) — v1.0
- ✓ Risk badges when workload exceeds available time — v1.0
- ✓ Study session generation from pasted notes/headings (summaries, key terms, practice questions) — v1.0
- ✓ Calendar export as .ics download — v1.0
- ✓ Responsive web design (mobile-friendly, no native app) — v1.0
- ✓ Private per-user storage with RLS on all tables — v1.0

### Active

(None yet — define in next milestone)

### Out of Scope

- LMS API integration (Canvas/Blackboard) — complex auth, per-institution setup, not MVP
- Essay writing / homework completion features — ethical boundary, not a cheating tool
- Native mobile app — web-first responsive approach covers mobile use cases
- Group/collaboration features — individual planning tool, social adds complexity
- Google Calendar direct sync — .ics export covers this for MVP
- Stripe billing integration — freemium model but payment infra deferred past initial launch
- Dark mode — defer until core UX is stable
- Email/push notifications — in-app dashboard surfaces urgency without infra burden
- Two-way calendar sync — .ics export covers MVP; OAuth maintenance deferred
- Grade tracking — opens FERPA liability, not core to planning

## Context

- **Target users**: BYU-Idaho students (freshman to senior) juggling school + part-time jobs + church commitments. They need to convert passive LMS deadlines into active, time-blocked plans.
- **Competitive landscape**: Existing planners (Notion, Google Calendar, paper planners) are manual. LMS systems (Canvas) are passive notification tools. No tool converts syllabi into executable plans.
- **Business model**: Freemium — free core planning features (onboarding, task management, weekly plan, calendar export). Paid tier unlocks LLM-powered features (syllabus parsing, study session generation). LLM API costs baked into subscription pricing.
- **Launch target**: Fall 2026 semester. Enough runway to build all MVP features properly.
- **Current state**: v1.0 MVP shipped (2026-03-05). 98 TypeScript/TSX files, 14,359 LOC. Deployed on Vercel with Supabase backend. All 45 v1 requirements satisfied. Tech stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase (auth, Postgres, storage) + Vercel.
- **Known tech debt**: Phases 5, 6, 7 missing VERIFICATION.md files (non-blocking). Single active term per user (MVP limitation).

## Constraints

- **Tech stack**: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (auth, Postgres, storage)
- **Deployment**: Vercel (free tier to start, scale as needed)
- **LLM**: OpenAI API, feature-flagged — app must function without LLM (manual task entry fallback)
- **PDF processing**: Server-side text extraction (no client-side PDF parsing)
- **Security**: Private per-user storage, no cross-user data access, RLS on all Supabase tables
- **Ethical**: No features that do students' work for them — study aids only (summaries, practice questions, never answers to graded work)
- **Budget**: Startup budget — minimize infrastructure costs, leverage free tiers (Vercel, Supabase)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over custom backend | Auth + Postgres + storage in one platform, generous free tier, fast to build | ✓ Good — single platform simplified all phases |
| Vercel deployment | Best-in-class Next.js hosting, free tier, automatic deploys from git | ✓ Good — zero DevOps burden |
| Due-date priority (EDD) for scheduling | Closest deadline gets scheduled first — matches student mental model of urgency | ✓ Good — intuitive ordering |
| Freemium with paid LLM features | Free planning gets users; paid parsing/study sessions covers API costs | — Pending (not yet launched) |
| No LMS integration in MVP | Per-institution OAuth complexity; syllabus PDF upload is universal | ✓ Good — PDF approach works |
| Zod v3 (not v4) | flatten().fieldErrors pattern used throughout; v4 is breaking | ✓ Good — stable across all phases |
| proxy.ts (Next.js 16 convention) | Middleware renamed to proxy per Next.js 16 | ✓ Good — forward-compatible |
| unpdf for PDF extraction | Serverless-compatible; pdf-parse incompatible with Vercel | ✓ Good — works in Edge/serverless |
| Feature-flagged LLM | App functions without API key at every phase | ✓ Good — graceful degradation |
| XHR for upload progress | fetch does not expose upload progress events | ✓ Good — granular progress UX |
| Signed URL upload pattern | Client uploads directly to Supabase Storage, bypasses Vercel 4.5 MB limit | ✓ Good — no body size issues |
| vitest (not jest) | Zero config, ESM-native | ✓ Good — instant setup |
| CalendarView over PlanGrid | Single component handles week/day toggle; superseded separate components | ⚠️ Revisit — caused integration gaps (fixed in Phase 8) |
| Service role key for signed URLs | createSignedUploadUrl requires admin privileges, not anon key | ✓ Good — fixed production upload bug |

---
*Last updated: 2026-03-05 after v1.0 milestone*
