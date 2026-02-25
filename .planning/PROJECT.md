# BlockPlan

## What This Is

BlockPlan is a web app that turns BYU-Idaho students' syllabi into adaptive weekly plans with time-blocked study schedules. Students upload syllabus PDFs, confirm extracted tasks, set their availability around work and church commitments, and get a generated weekly plan that reschedules automatically when life happens.

## Core Value

Students always know exactly what to work on next and when — the plan adapts to them, not the other way around.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Email/password authentication with session persistence
- [ ] Onboarding wizard: create term, add courses, upload syllabi, set availability
- [ ] PDF syllabus upload with server-side text extraction
- [ ] Rule-based + LLM-assisted syllabus parsing (assignments, exams, readings)
- [ ] Extraction review screen where students confirm/edit parsed items
- [ ] Task model: assignment, exam, reading, other — with due dates, estimated minutes, status
- [ ] Auto-suggested subtask breakdown for large tasks (papers/projects) with work-back scheduling
- [ ] Planning engine: schedule tasks into available time blocks using due-date priority
- [ ] User-defined availability windows with blocked times and preferred study windows
- [ ] Configurable block length (25–90 min) and buffer time
- [ ] Weekly view with blocks per day and assigned tasks
- [ ] Daily view: top priorities + estimated time remaining today
- [ ] "Today" dashboard: top 5 items, next scheduled block, risk alerts
- [ ] Auto-reschedule: replan remaining tasks when blocks are missed (catch-up mode)
- [ ] Risk badges when workload exceeds available time
- [ ] Study session generation from pasted notes/headings (summaries, key terms, practice questions)
- [ ] Calendar export as .ics download
- [ ] "Delete my data" option
- [ ] Responsive web design (mobile-friendly, no native app)

### Out of Scope

- LMS API integration (Canvas/Blackboard) — complex auth, per-institution setup, not MVP
- Essay writing / homework completion features — ethical boundary, not a cheating tool
- Native mobile app — web-first responsive approach covers mobile use cases
- Group/collaboration features — individual planning tool, social adds complexity
- Google Calendar direct sync — .ics export covers this for MVP
- Stripe billing integration — freemium model but payment infra deferred past initial launch

## Context

- **Target users**: BYU-Idaho students (freshman to senior) juggling school + part-time jobs + church commitments. They need to convert passive LMS deadlines into active, time-blocked plans.
- **Competitive landscape**: Existing planners (Notion, Google Calendar, paper planners) are manual. LMS systems (Canvas) are passive notification tools. No tool converts syllabi into executable plans.
- **Business model**: Freemium — free core planning features (onboarding, task management, weekly plan, calendar export). Paid tier unlocks LLM-powered features (syllabus parsing, study session generation). LLM API costs baked into subscription pricing.
- **Launch target**: Fall 2026 semester. Enough runway to build all MVP features properly.
- **Seed test data**: Spring 2026 term (Apr 6–Jul 24), courses BIO 180 / REL 200 / ENG 150, availability Mon–Fri 7–9am and 7–10pm, work Tue/Thu 4–9pm, devotional Tue 11:30am–1pm blocked.

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
| Due-date priority for scheduling conflicts | Closest deadline gets scheduled first — matches student mental model of urgency | — Pending |
| Freemium with paid LLM features | Free planning gets users; paid parsing/study sessions covers API costs | — Pending |
| Supabase over custom backend | Auth + Postgres + storage in one platform, generous free tier, fast to build | — Pending |
| Vercel deployment | Best-in-class Next.js hosting, free tier, automatic deploys from git | — Pending |
| No LMS integration in MVP | Per-institution OAuth complexity; syllabus PDF upload is universal | — Pending |
| Fall 2026 launch | Enough time to build properly rather than rush for Spring 2026 | — Pending |

---
*Last updated: 2026-02-25 after initialization*
