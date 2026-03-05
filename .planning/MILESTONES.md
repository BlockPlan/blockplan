# Milestones

## v1.0 MVP (Shipped: 2026-03-05)

**Phases completed:** 8 phases, 22 plans
**Timeline:** 8 days (2026-02-25 → 2026-03-05)
**Codebase:** 98 files, 14,359 lines TypeScript/TSX
**Requirements:** 45/45 satisfied
**Audit:** PASSED (45/45 requirements, 6/6 E2E flows)

**Key accomplishments:**
- Supabase foundation with 6-table schema, RLS on all tables, email/password auth with session persistence and account deletion
- 4-step onboarding wizard (term → courses → availability grid → next action) with BYU-Idaho presets
- Syllabus PDF pipeline with server-side extraction, rule-based + LLM parsing, and full review/edit/confirm screen
- Greedy EDD scheduler generating 7-day time-blocked plans with auto-reschedule on missed blocks and risk badges
- Weekly/daily/dashboard views with CalendarView, today dashboard, and shared NavHeader navigation
- Study session generation from pasted notes (summaries, key terms, practice questions) with mock mode fallback
- Calendar export (.ics download), auto-suggested subtasks with work-back scheduling, and mobile-responsive design

**Archives:** `milestones/v1.0-ROADMAP.md`, `milestones/v1.0-REQUIREMENTS.md`, `milestones/v1.0-MILESTONE-AUDIT.md`

---
