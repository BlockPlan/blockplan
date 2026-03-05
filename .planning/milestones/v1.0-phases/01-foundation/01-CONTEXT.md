# Phase 1: Foundation - Context

**Gathered:** 2026-02-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Supabase project setup, database schema with RLS on all tables, auth flows (signup, signin, signout, account deletion), middleware for route protection, and timezone-aware column design. No UI beyond auth pages and a minimal post-auth shell.

</domain>

<decisions>
## Implementation Decisions

### Auth Flow UX
- Combined sign-up / sign-in page at `/auth` with tab toggle between modes
- Email + password only (no OAuth, no magic links for MVP)
- After signup: redirect to `/onboarding` (Phase 2 builds this; Phase 1 provides a placeholder dashboard)
- After signin: redirect to `/dashboard` (or `/onboarding` if user has no term yet)
- Session persistence via Supabase Auth cookies — user stays signed in across refreshes
- Sign out button accessible from app shell (sidebar or header) on every authenticated page
- Auth errors shown inline (wrong password, email taken, etc.) — no toast/modal

### Account Deletion
- "Delete my account" in a settings page (`/settings`)
- Requires confirmation: user types "DELETE" to confirm (prevents accidental deletion)
- Instant deletion — no grace period, no soft delete
- Cascade delete: account removal deletes all terms, courses, tasks, subtasks, plan_blocks, availability_rules, and stored PDFs
- After deletion: redirect to `/auth` with a brief "Account deleted" message

### Database Schema
- UUIDs for all primary keys (matches Supabase auth.users)
- All timestamps as `TIMESTAMPTZ` (timezone-aware) — BYU-Idaho is Mountain Time, Vercel is UTC
- Cascade delete on all foreign keys pointing to `auth.users`
- Table names: `terms`, `courses`, `tasks`, `subtasks`, `availability_rules`, `plan_blocks`
- RLS policies on every table: users can only SELECT/INSERT/UPDATE/DELETE their own rows
- Use `auth.uid()` in RLS policies — never use service role key for user-scoped queries
- Storage bucket `syllabi` with private access (user can only access their own files)

### Post-Auth Landing
- New users (no term): redirect to `/onboarding` placeholder (shows "Onboarding coming in Phase 2")
- Returning users: redirect to `/dashboard` placeholder (shows "Dashboard coming in Phase 5")
- App shell with sidebar navigation present on all authenticated pages (links disabled until features exist)

### Claude's Discretion
- Exact sign-up/sign-in form styling and layout
- Loading states during auth operations
- Password strength requirements (reasonable minimum)
- Middleware redirect logic implementation
- Three Supabase client pattern (server, browser, middleware)
- Error message copy

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User trusts Claude's judgment on all foundation decisions. Follow Supabase + Next.js App Router best practices from research.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-02-28*
