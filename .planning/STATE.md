# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-09)

**Core value:** Students always know exactly what to work on next and when — the plan adapts to them, not the other way around.
**Current focus:** Post-v1.0 feature work — AI study tools, UX polish, pricing. No formal milestone yet.

## Current Position

Phase: v1.0 complete (8 phases, 22 plans) + 37 ad-hoc commits
Status: Post-v1.0 feature development (no formal v1.1 milestone defined)
Last activity: 2026-03-09 — Flashcard confidence buttons, diagram rendering fixes

Progress: [████████████████████] 100% (v1.0)
Post-v1.0: 37 commits adding AI features, UX polish, pricing

## Post-v1.0 Features Added (ad-hoc, not in a formal milestone)

### AI Study Help Enhancements
- ELI5 Mode — simplified summaries with everyday analogies
- Practice Problems — step-by-step solutions with difficulty levels
- AI Tutor Chat — conversational Q&A about study material
- Visual Diagrams — AI-generated mind maps, flowcharts, concept maps (Mermaid.js)
- Flashcard Study Mode — spaced repetition with Leitner box system (5 boxes)
- Flashcard confidence buttons — Got It / Still Learning in regular viewer
- Inline flashcard editing — pencil icon on each card
- Regenerate study materials per section
- PPT/PPTX upload support
- Export study sessions to PDF
- Share study sessions (requires account)

### UX & Polish
- Quick Notes dashboard widget and task notes
- Guided tour for new users and empty state guidance
- Drag-and-drop to reschedule study blocks in Week view
- Loading skeletons, error boundaries, confirmation dialogs
- Profile page (consolidated Settings/Help/Pricing)
- 12-hour time format across all views
- Compact calendar blocks with full task names
- Removed Grades feature (out of scope)

### Business
- Pricing page with Free ($0), Pro ($1.99/mo), MAX ($5/mo) tiers
- Beta testing mode: all users get MAX plan access (Stripe not yet wired)

## Accumulated Context

### Decisions

- Mermaid.js chosen for diagrams (client-side, zero infra cost)
- OpenAI structured output requires split schemas (generation vs storage)
- Leitner box spaced repetition for flashcard study mode
- Hardcoded MAX plan for beta testing (revert when Stripe is live)
- Grades feature removed entirely (FERPA, not core to planning)
- PPT/PPTX support via parseOffice toText()

### Pending Todos

- Stripe billing integration (pricing page exists, payments not wired)
- Re-enable DB-based subscription plan lookup (lib/subscription.ts)
- Consider formal v1.1 milestone for remaining work

### Blockers/Concerns

- `preview_start` tool has persistent EPERM error in this project directory (workaround: use `npx next build` and existing dev server)
- OpenAI structured output doesn't support optional fields (worked around with schema split)

## Session Continuity

Last session: 2026-03-09
Stopped at: Updated resource pages (PROJECT.md, STATE.md, ROADMAP.md) with post-v1.0 features
Resume file: None
Next step: /gsd:new-milestone for v1.1 planning, or continue ad-hoc feature work
