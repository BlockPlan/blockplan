# Phase 1: Foundation - Research

**Researched:** 2026-02-28
**Phase Goal:** Users can securely create accounts, sign in, and have their data protected by row-level security
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, SECU-01, SECU-02, SECU-03

## Stack & Packages

**Confidence: HIGH**

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 15.x | App Router, server components, middleware |
| `@supabase/supabase-js` | 2.x | Supabase client SDK |
| `@supabase/ssr` | 0.5.x | Cookie-based auth for SSR (replaces deprecated `@supabase/auth-helpers`) |
| `typescript` | 5.x | Type safety |
| `tailwindcss` | 4.x | Styling |

**Key:** The `@supabase/ssr` package is the current recommended approach. The `@supabase/auth-helpers` package is deprecated and should NOT be used.

## Architecture Patterns

### Three Supabase Client Pattern

**Confidence: HIGH**

Supabase with Next.js App Router requires three distinct client utilities:

1. **Browser Client** (`lib/supabase/client.ts`) - Uses `createBrowserClient` from `@supabase/ssr`. For Client Components. Singleton pattern.
2. **Server Client** (`lib/supabase/server.ts`) - Uses `createServerClient` from `@supabase/ssr` with cookie `getAll`/`setAll` handlers via `next/headers`. For Server Components, Server Actions, Route Handlers.
3. **Middleware Client** (`lib/supabase/middleware.ts`) - Uses `createServerClient` from `@supabase/ssr` with `request.cookies` and `response.cookies`. Refreshes auth tokens on every request.

### Middleware Pattern

**Confidence: HIGH**

- Middleware at project root (`middleware.ts`) calls an `updateSession` helper
- The middleware refreshes expired auth tokens by calling `supabase.auth.getUser()` (or `getClaims()` in newer versions)
- Passes refreshed tokens to Server Components via `request.cookies.set`
- Passes refreshed tokens to browser via `response.cookies.set`
- Matcher excludes static files: `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`
- Middleware also handles route protection: redirect unauthenticated users to `/auth`, redirect authenticated users away from `/auth`

### Auth Callback Route

**Confidence: HIGH**

- Route handler at `app/auth/callback/route.ts`
- Exchanges auth code for session after email confirmation
- Uses `createServerClient` to set session cookies
- Redirects to dashboard or error page

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Note: Supabase is transitioning to "publishable keys" (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Either naming works. The anon key naming is still widely supported.

## Auth Flows

### Sign Up (AUTH-01)

**Confidence: HIGH**

- Server Action calls `supabase.auth.signUp({ email, password })`
- On success: Supabase creates user in `auth.users`, sends confirmation email (if enabled) or auto-confirms
- For MVP: disable email confirmation in Supabase dashboard (Auth > Providers > Email > Confirm email OFF) to simplify flow
- Redirect to `/onboarding` placeholder after signup
- Error handling: email already registered, weak password, network errors

### Sign In (AUTH-02)

**Confidence: HIGH**

- Server Action calls `supabase.auth.signInWithPassword({ email, password })`
- On success: session cookie set, redirect to `/dashboard` (or `/onboarding` if no term)
- Error handling: invalid credentials, unconfirmed email, rate limiting

### Session Persistence (AUTH-03)

**Confidence: HIGH**

- `@supabase/ssr` stores session in cookies (not localStorage)
- Middleware refreshes tokens on every request
- Session survives browser refresh, new tabs, server-side rendering
- No additional code needed beyond proper middleware setup

### Sign Out (AUTH-04)

**Confidence: HIGH**

- Server Action calls `supabase.auth.signOut()`
- Clears session cookies
- Redirect to `/auth`
- Sign-out button in app shell (sidebar/header) on all authenticated pages

### Account Deletion (AUTH-05)

**Confidence: MEDIUM**

- Requires `supabase.auth.admin.deleteUser(userId)` which needs service_role key
- Must be called from a Server Action or Route Handler (never expose service_role to client)
- **Critical prerequisite:** Must delete user's storage objects BEFORE deleting user (Supabase constraint)
- Cascade delete on all tables handles data cleanup automatically (via FK constraints)
- After deletion: must sign out the session (JWT remains valid until expiry otherwise)
- Implementation: Server Action → delete storage objects → admin delete user → redirect to `/auth`

**Alternative:** Supabase Edge Function for deletion. But Server Action with service_role is simpler for Next.js.

## Database Schema

### Table Design

**Confidence: HIGH**

All tables for the full application should be created in Phase 1 to establish RLS from the start. Tables:

| Table | Purpose | Phase Used |
|-------|---------|-----------|
| `terms` | Academic terms (name, start, end) | Phase 2 |
| `courses` | Courses within a term | Phase 2 |
| `tasks` | Assignments, exams, readings | Phase 2 |
| `subtasks` | Breakdown of large tasks | Phase 7 |
| `availability_rules` | Weekly availability windows | Phase 2 |
| `plan_blocks` | Scheduled time blocks | Phase 4 |

### Column Standards

- All PKs: `id UUID DEFAULT gen_random_uuid() PRIMARY KEY`
- All user FKs: `user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- All timestamps: `TIMESTAMPTZ` (not `TIMESTAMP`) per SECU-03
- Created/updated: `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ DEFAULT now()`

### RLS Policy Pattern (SECU-02)

**Confidence: HIGH**

For every table, enable RLS and create four policies:

```sql
ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;

-- SELECT: users can only read their own rows
CREATE POLICY "Users can view own {table}" ON public.{table}
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: users can only insert rows for themselves
CREATE POLICY "Users can insert own {table}" ON public.{table}
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can only update their own rows
CREATE POLICY "Users can update own {table}" ON public.{table}
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DELETE: users can only delete their own rows
CREATE POLICY "Users can delete own {table}" ON public.{table}
  FOR DELETE USING (auth.uid() = user_id);
```

**Performance:** Index the `user_id` column on every table. Missing indexes on columns referenced in RLS policies is the top performance killer.

### Storage Bucket (SECU-01)

**Confidence: HIGH**

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('syllabi', 'syllabi', false);

-- RLS on storage: user can only access their own folder
CREATE POLICY "Users can upload own syllabi" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own syllabi" ON storage.objects
  FOR SELECT USING (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own syllabi" ON storage.objects
  FOR DELETE USING (bucket_id = 'syllabi' AND auth.uid()::text = (storage.foldername(name))[1]);
```

Pattern: files stored as `{user_id}/{filename}` so the folder-based RLS policy works.

## Project Initialization

**Confidence: HIGH**

Since no code exists yet, Phase 1 must bootstrap the entire Next.js project:

1. `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS, ESLint
2. Install `@supabase/supabase-js` and `@supabase/ssr`
3. Create `.env.local` with Supabase credentials
4. Set up the three-client pattern in `lib/supabase/`
5. Create Supabase migration files for schema + RLS

### Supabase CLI for Migrations

**Confidence: HIGH**

- Use `supabase init` to create `supabase/` directory
- Migrations in `supabase/migrations/` as timestamped SQL files
- `supabase db push` or `supabase db reset` to apply
- Schema and RLS policies defined in migration files (not in dashboard)

## Pitfalls & Gotchas

1. **`getSession()` is unsafe for auth checks** — Use `getUser()` or `getClaims()` instead. `getSession()` reads from cookies without JWT verification. Always validate server-side with `getUser()`.

2. **Server Components cannot write cookies** — This is why the middleware proxy pattern is required. Server Components can only READ cookies; middleware handles the WRITE.

3. **Storage objects block user deletion** — Must delete all storage objects for a user BEFORE calling `auth.admin.deleteUser()`. Otherwise Supabase throws an error.

4. **Service role key must never reach the client** — Only use in Server Actions, Route Handlers, or Edge Functions. Never import in Client Components or pass via props.

5. **RLS testing must use client SDK** — The Supabase SQL Editor uses the service role and bypasses RLS. Test RLS policies from the actual client.

6. **Cascade delete requires `ON DELETE CASCADE` on FK** — Must be set at table creation time. Adding later requires migration.

7. **JWT remains valid after deletion** — After deleting a user account, explicitly sign out to clear the session cookie. The JWT is valid until its expiry otherwise.

8. **Middleware matcher must exclude static routes** — Without proper matcher config, middleware runs on every request including static assets, causing performance issues.

## Decision Points for Planner

1. **Email confirmation:** Recommend DISABLED for MVP (simplifies signup flow). Can enable later.
2. **Migration approach:** SQL migration files in `supabase/migrations/` (infrastructure as code).
3. **Project structure:** Follow Next.js App Router conventions with `app/` directory.
4. **UI library:** Tailwind CSS only (no shadcn/ui unless explicitly requested). Keep Phase 1 UI minimal.
5. **Supabase project:** User must have a Supabase project created. Credentials go in `.env.local`.

---

## RESEARCH COMPLETE

Phase 1 research covers all 8 requirements (AUTH-01 through AUTH-05, SECU-01 through SECU-03). No blockers identified. All patterns are well-documented with HIGH confidence. The stack is mature and the Supabase + Next.js integration is well-established.
