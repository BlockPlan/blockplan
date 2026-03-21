# Roadmap: BlockPlan

## Milestones

- ✅ **v1.0 MVP** — Phases 1-8 (shipped 2026-03-05)
- 🚧 **Post-v1.0** — Ad-hoc feature work (2026-03-05 → 2026-03-09, 37 commits, no formal milestone)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-8) — SHIPPED 2026-03-05</summary>

- [x] Phase 1: Foundation (4/4 plans) — Supabase schema, RLS, auth flows, middleware
- [x] Phase 2: Core Data Model (3/3 plans) — Term/course/task structure, onboarding wizard, availability
- [x] Phase 3: Syllabus Pipeline (3/3 plans) — PDF upload, extraction, LLM parsing, review screen
- [x] Phase 4: Planning Engine (3/3 plans) — Scheduler, settings, 7-day plan view, auto-reschedule
- [x] Phase 5: Views and Dashboard (3/3 plans) — Weekly/daily views, today dashboard, NavHeader
- [x] Phase 6: Study Sessions (2/2 plans) — LLM study aids, mock mode, entry points
- [x] Phase 7: Export and Polish (3/3 plans) — .ics export, subtask suggestions, mobile responsive
- [x] Phase 8: Integration Fixes (1/1 plan) — Study links in CalendarView, NavHeader on upload, dead code removal

Full details: `milestones/v1.0-ROADMAP.md`

</details>

<details open>
<summary>🚧 Post-v1.0 Ad-Hoc Work (37 commits, 2026-03-05 → 2026-03-09)</summary>

**AI Study Help Enhancements:**
- [x] ELI5 Mode — simplified summaries with everyday analogies
- [x] Practice Problems — step-by-step solutions with difficulty levels
- [x] AI Tutor Chat — conversational Q&A about study material
- [x] Visual Diagrams — mind maps, flowcharts, concept maps (Mermaid.js)
- [x] Flashcard Study Mode — spaced repetition (Leitner box system)
- [x] Flashcard confidence buttons (Got It / Still Learning)
- [x] Inline flashcard editing
- [x] Regenerate study materials per section
- [x] PPT/PPTX upload support
- [x] Export study sessions to PDF
- [x] Share study sessions

**UX & Polish:**
- [x] Quick Notes dashboard widget and task notes
- [x] Guided tour for new users
- [x] Drag-and-drop reschedule in Week view
- [x] Loading skeletons, error boundaries, confirmation dialogs
- [x] Profile page (consolidated nav)
- [x] 12-hour time format, compact calendar blocks
- [x] Removed Grades feature

**Business:**
- [x] Pricing page (Free / Pro $1.99 / MAX $5)
- [x] Beta testing mode (all users get MAX)
- [ ] Stripe billing integration
- [ ] DB-based subscription plan lookup

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v1.0 | 4/4 | Complete | 2026-02-28 |
| 2. Core Data Model | v1.0 | 3/3 | Complete | 2026-03-01 |
| 3. Syllabus Pipeline | v1.0 | 3/3 | Complete | 2026-03-01 |
| 4. Planning Engine | v1.0 | 3/3 | Complete | 2026-03-01 |
| 5. Views and Dashboard | v1.0 | 3/3 | Complete | 2026-03-02 |
| 6. Study Sessions | v1.0 | 2/2 | Complete | 2026-03-02 |
| 7. Export and Polish | v1.0 | 3/3 | Complete | 2026-03-02 |
| 8. Integration Fixes | v1.0 | 1/1 | Complete | 2026-03-05 |
| Post-v1.0 Ad-Hoc | — | 37 commits | In Progress | — |
