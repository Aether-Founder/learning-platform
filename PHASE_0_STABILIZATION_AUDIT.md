# Phase 0 — Stabilization Audit

**Status:** Complete on 2026-08-06  
**Scope:** Inventory and build stabilization only. No API URL, request body, response shape, local-storage key, scheduling calculation, or database data was intentionally changed.

## Verified Baseline

| Check | Result |
| --- | --- |
| Type check (`npx tsc --noEmit`) | Passes |
| Production build (`npm run build`) | Passes; 34 rendered pages and 33 dynamic API routes |
| Reference Aether tokens under Tailwind v3 | Generated and verified |
| Runtime dependencies required by legacy API routes | Declared and installed |

## Inventory

### Product routes

- Dashboard and Aether routes: `/`, `/agenda`, `/cijfers`, `/decks`, `/groepen`, `/instellingen`, `/lessen`, `/notities`, `/planner`, `/statistieken`, `/vakken`.
- Learning/content routes: `/learning-platform`, `/toetsweekvoorbereiding`, `/toetsweekvoorbereiding/[page]`, `/[page]`, `/[page]/copy`, `/[page]/raw`, `/[page]/ai`.
- Account/product routes: `/login`, `/register`, `/reset-password`, `/reset-password/confirm`, `/profile`, `/calendar`, `/testweek/[id]`, `/admin/analytics`.

### API contract groups

| Group | Routes | Current storage/auth path |
| --- | --- | --- |
| Achievements, streaks, analytics | `/api/achievements`, `/api/streaks`, `/api/analytics/**` | Legacy JWT + SQLite-oriented libraries; analytics dashboard reads local JSON. |
| Calendar, homework, plans, test weeks | `/api/calendar/**`, `/api/homework/**`, `/api/studyplans/**`, `/api/testweeks/**` | Legacy JWT + SQLite-oriented libraries. |
| Study sets and content | `/api/studysets/**`, `/api/content/**` | Legacy JWT + SQLite-oriented libraries; JSON content loaders remain in use. |
| Classes | `/api/classes/**` | Legacy JWT + SQLite-oriented libraries. |
| LLM | `/api/llm/[page]` | Existing optional service route; out of scope until Phase 8. |
| Supabase client layer | `lib/supabase/**`, auth pages/hooks, query helpers | Supabase Auth and PostgreSQL schema/types. |

There are currently 33 route handlers. The public API contract is therefore treated as frozen until the repository adapters planned in Phase 2 exist.

### Persistence inventory

| Store | Current owner | Notes |
| --- | --- | --- |
| Supabase | `supabase/migrations/001_initial_schema.sql` | Profiles, subjects, study sets, flashcards, sessions, card reviews, achievements, calendar events, bookmarks, reading progress, analytics. |
| Legacy local database | `lib/db.ts` and domain libraries | Users, sets/cards/progress/review logs, calendar, homework, test weeks, classes, plans, streaks, and achievements. |
| Static content | `content/*.json` | Used by dynamic reading/content and learning-platform flows. |
| Browser progress | `learning-platform-progress-v1` | Per-study-set progress cache in local storage. |
| Browser sessions | `learning-platform-sessions-v1` | Last 50 sessions per study set in local storage. |
| Browser settings | `learning-platform-settings-v1` | Per-study-set session settings including scheduling choice/exam date. |
| Analytics files | `data/analytics/*.json` | Used by the administrator analytics dashboard. |

### Scheduler baseline

`lib/learning-platform/srs.ts` contains a deterministic SM-2-like scheduler and an explicitly labelled **FSRS-like** approximation. It is client-local and is called through `lib/learning-platform/progress-store.ts` / `store/useLearningPlatformStore.ts`. It is not an official FSRS implementation and must remain unchanged until Phase 4 introduces a tested adapter and migration path.

## Stabilization Changes Made

1. Declared and installed missing legacy runtime dependencies: `bcrypt`, `jsonwebtoken`, `better-sqlite3`, and their type packages.
2. Updated the Supabase wrapper files to use the installed package's `createBrowserClient` / `createServerClient` APIs while preserving the existing exported wrapper functions.
3. Completed the generated database type shape with relationship metadata and the currently used `increment` RPC contract, restoring typed Supabase writes.
4. Marked header-dependent analytics route handlers as explicitly dynamic so they are not evaluated during static generation.
5. Wrapped the login page’s `useSearchParams()` consumer in `Suspense`, fixing the Next.js prerender requirement.

## Deferred Risks / Phase 2 Inputs

- Supabase Auth and legacy JWT authentication coexist. They must be bridged behind adapters before either is removed.
- The legacy local database and Supabase schema represent overlapping domains. No automated data migration has been run.
- The `increment` RPC is used by a query helper but is not defined in the checked-in migration. Phase 2 must verify it in the live project or add a formally migrated replacement.
- The Supabase service-role environment variable must be rotated if it has ever been exposed outside secure deployment configuration. This audit does not print or modify secrets.
- `npm audit` reported seven high-severity dependency advisories. Remediation is deferred until an impact review so no breaking upgrades are introduced during stabilization.

## Exit Criteria Met

- [x] The build and type check are reproducible with the declared dependencies.
- [x] Existing APIs remain dynamic server routes and compile.
- [x] Current persistence locations and browser keys are documented.
- [x] The scheduler is identified as a protected compatibility boundary.
- [x] The next phase can focus on visual comparison without masking platform build errors.

