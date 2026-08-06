# Aether Project Blueprint

## Purpose

This is the delivery plan for **this repository**: the Next.js Aether / Toetsweekvoorbereiding application. The aim is an offline-capable, gamified study platform with a reliable learning engine first and AI features only after the non-AI product is dependable.
v
The UI in `UI-REFERENCE-2` is the visual source of truth. It is a separate TanStack/Vite project and must never become a runtime dependency of this app. Its design tokens, layouts, component styling, spacing, and responsive behavior are adapted into the existing Next.js app while existing APIs, authentication, data, and learning behavior stay intact.

## Current Baseline

| Area | Current implementation | Decision |
| --- | --- | --- |
| Web app | Next.js 14 + TypeScript + Tailwind CSS | Keep; do not migrate frameworks for UI work. |
| Reference UI | `UI-REFERENCE-2` (TanStack Start/Vite) | Use only as the pixel-level visual specification. |
| Shared UI | `components/AppShell.tsx`, `components/ui-kit.tsx`, `app/globals.css` | Make these the single Aether design-system source. |
| Authentication | Supabase provider and auth pages; legacy JWT routes also exist | Consolidate behind one adapter before adding features; do not remove either flow during UI work. |
| Data/API | `app/api/**`, Supabase types/migrations, plus legacy SQLite-oriented libraries | Preserve all current endpoints; inventory and migrate deliberately. |
| Learning engine | `components/learning-platform/**`, Zustand, local progress store, SRS-like scheduling | Keep operational; replace scheduling only through tested compatibility layers. |
| Content | JSON content in `content/` and dynamic content routes | Keep backward-compatible loaders and import paths. |
| Existing product areas | Calendar, test weeks, profile, analytics, classes, homework, achievements | Restyle without changing their API contracts. |

## Non-Negotiable Guardrails

1. UI changes must not alter request URLs, request bodies, authentication headers, database queries, local-storage keys, or learning-progress calculations.
2. Every UI route keeps a functional loading, empty, error, and authenticated state.
3. The reference code is copied only after converting routing primitives (`Link`, route params, page metadata) to Next.js equivalents. No TanStack router, Vite config, or demo data becomes production infrastructure.
4. Existing routes remain available, including content pages, test-week pages, calendar, profile, and API handlers.
5. Use migration scripts and feature flags for data changes. Never silently reinterpret existing progress records.
6. AI is an optional final layer. A user must be able to create, import, schedule, and study content with no AI service enabled.

## Target Architecture

```text
Next.js route + Aether UI shell
  -> page feature component
     -> query / command adapter
        -> Supabase repository (target)
        -> legacy API / data store adapter (during migration)

Learning session
  -> deterministic scheduler
  -> local outbox when offline
  -> server review-log command when online
  -> analytics / XP / streak projections
```

The UI may show optimistic state, but server-confirmed data and append-only review logs are the source of truth. Client-side local storage remains a cache and offline outbox, not the long-term authority for user progress.

## Data Model Direction

The existing `study_sets`, cards/progress, test-week, calendar, analytics, and user models must first be mapped to a canonical schema. Additive migrations should introduce the following concepts; adapt column names rather than breaking live records.

| Canonical entity | Repository mapping / responsibility |
| --- | --- |
| `profiles` | Supabase-auth user profile, username, avatar, timezone, theme, XP, streak counters. |
| `decks` / `study_sets` | Owner, title, subject, visibility, source/import metadata, optional exam date. |
| `cards` | Rich front/back content, media, card type, choices/cloze metadata, timestamps. |
| `user_card_state` | One scheduling state per user/card: state, stability, difficulty, due time, repetitions, lapses, latest revision. |
| `review_logs` | Immutable rating event with state before/after, device/client id, offline sync id, timestamp. |
| `test_weeks` and `test_week_subjects` | Existing exam planning data; link decks and target dates rather than duplicating content. |
| `calendar_events`, `tasks`, `study_plans` | Continue exposing the current API shape while repositories move to Supabase. |
| `achievements`, `leaderboard_periods`, `classrooms` | Derived gamification/social records, not inputs to scheduling. |

Required database protections:

- Row-level policies restrict private decks, progress, logs, tasks, calendar data, and profile updates to the signed-in user.
- Public decks are read-only for non-owners; cloning creates a new owner-owned deck.
- Review-log insertion is idempotent by `(user_id, client_event_id)`.
- Deleting a card keeps or archives its review history according to a documented retention policy.

## Delivery Phases

### Phase 0 — Stabilize and inventory

**Goal:** Establish a reliable baseline before visual or data migrations.

- Inventory each API route in `app/api/**`, the caller, authentication method, storage backend, and response contract.
- Record every persisted browser key used by `store/useLearningPlatformStore.ts` and `lib/learning-platform/progress-store.ts`.
- Add a route matrix covering dashboard, content, learning platform, test weeks, calendar, profile, classes, analytics, and auth.
- Resolve missing production dependencies and make `npm run build` reproducible in a network-enabled CI environment.
- Capture desktop and mobile screenshots of reference routes and matching Next.js routes at the same viewport and browser zoom.

**Definition of done:** a build, type check, and API smoke test run in CI; no backend contract is changed.

### Phase 1 — Pixel-accurate Aether UI foundation

**Goal:** Centralize the reference design system without touching behavior.

- Keep `app/globals.css` aligned with the reference palette, typography, border, radius, tint, dark-mode, and base-element tokens.
- Treat `AppShell`, `PageHeader`, `SectionTitle`, `Meter`, and `ui-kit` primitives as the canonical presentation layer.
- Bring shared navigation, notification menu, search field, mobile navigation, footer, buttons, panels, badges, tabs, inputs, tables, empty states, and charts to the reference measurements.
- Restyle feature routes that do not exist in the reference (calendar, profile, test-week setup, learning platform) with the same tokens and primitives—not a second visual language.
- Use screenshot comparison at 1440×900 and 390×844; verify normal, hover, focus, active, empty, loading, and error states.

**Definition of done:** overlapping routes are visually equivalent to `UI-REFERENCE-2`; non-reference routes use the same shell and primitives; all existing callbacks and API calls still execute.

### Phase 2 — Authentication and data access consolidation

**Goal:** Remove ambiguity between Supabase and legacy authentication/storage without interrupting users.

- Create repository interfaces for users, study sets, cards, progress, test weeks, calendar events, tasks, and analytics.
- Place current implementation behind adapters; callers use the interfaces rather than direct SQLite/JWT or Supabase calls.
- Choose Supabase Auth as the final identity authority, then map legacy user identifiers to Supabase user IDs in an audited migration.
- Keep legacy endpoints as compatibility wrappers until all client calls have moved and telemetry confirms no use.
- Apply RLS and add service-role-only operations for privileged analytics/admin tasks.

**Definition of done:** one logged-in user sees only their own private data through both old-compatible endpoints and new repositories.

### Phase 3 — Canonical study-set and import workflow

**Goal:** Make manual creation and import faster than the current file-centric flow while retaining JSON content compatibility.

- Build a deck editor using the Aether UI primitives: basic cards, rich text, cloze cards, MCQ cards, tags, images, audio, and accessibility labels.
- Connect `StudySetEditor`, import/export helpers, and existing content conversion through one card-normalization layer.
- Support CSV/Excel paste/import, JSON import, and existing `content/*.json` material without data loss.
- Store uploads in Supabase Storage using private paths and generated thumbnails; enforce file-type, dimension, and size limits.
- Add import preview, validation errors, duplicate detection, and an undoable draft flow.

**Definition of done:** a user can create or import a 50-card deck, revisit it, and study it through the existing learning modes.

### Phase 4 — Deterministic scheduling and Toetsweek pacing

**Goal:** Upgrade the local SRS-like implementation to a testable FSRS-based engine without corrupting current progress.

- Use an official, version-pinned FSRS TypeScript implementation. Do not derive formulas from memory or tune them by guesswork.
- Add a scheduler adapter so the current modes call `scheduleReview()` rather than a concrete local algorithm.
- Convert existing progress to an initial safe state; preserve raw historical values for rollback and analytics.
- Write a review command that records the rating, computes next state/due date atomically, and appends a review log.
- Implement daily new/review limits, due/new/mixed/mistake/starred queues, bury/suspend behavior, and timezone-aware day boundaries.
- Connect deck exam dates and existing test-week subjects to a pacing calculation: required new cards/day, catch-up warning, and completion forecast.

**Definition of done:** the same card and rating sequence yields the same schedule in unit tests, client preview, and server command; exam pacing never changes a card schedule without showing the user why.

### Phase 5 — Study experience and offline reliability

**Goal:** Preserve every current study mode while making sessions robust on mobile and unstable networks.

- Keep flashcard, learn, write, test, MCQ, match, and game modes behind a common session contract.
- Preserve current keyboard, touch, image, answer grading, and accessibility behavior when restyling each view.
- Add IndexedDB-backed cache and an idempotent review outbox; sync in order on reconnection and surface recoverable conflicts.
- Implement fuzzy grading for written answers with clear accepted-answer feedback and per-card overrides.
- Measure session performance with 500+ cards and verify no lost answer after refresh/offline use.

**Definition of done:** a completed offline session syncs exactly once, updates the correct card states, and remains usable on a 390px viewport.

### Phase 6 — Gamification, planning, and analytics

**Goal:** Turn existing achievements, calendar, homework, plans, and analytics features into reliable product systems.

- Award XP only from server-validated actions; maintain a transparent XP ledger.
- Calculate streaks from timezone-aware activity days; add freezes only after the rule set and audit trail exist.
- Keep test-week, homework, planner, agenda, and calendar data connected so deadlines become actionable study plans.
- Aggregate review logs for progress, retention, forecast, subject mastery, and teacher/parent-safe reports.
- Use query caching and derived tables/materialized views for dashboards; do not calculate leaderboard-scale aggregates in the browser.

**Definition of done:** XP, streak, plan progress, and analytics reconcile with review logs and remain correct after device changes.

### Phase 7 — Public library, classrooms, and live features

**Goal:** Add sharing only after private study data is secure and stable.

- Provide public-deck search, filters, cloning, attribution, reporting, and moderation controls.
- Complete existing class creation, joining, assignments, discussions, and analytics using explicit teacher/student permissions.
- Build live quiz rooms with isolated realtime channels, server-authoritative timers/scores, reconnect support, and rate limits.
- Add friend/challenge features only with privacy controls, blocking/reporting, and age-appropriate defaults.

**Definition of done:** public cloning does not expose private data, and a room code supports a complete reconnect-safe quiz session.

### Phase 8 — AI as an optional layer

**Goal:** Add assistance that is sourced, bounded, reviewable, and never required for studying.

- Build document ingestion, chunking, metadata, and vector search with strict ownership checks.
- Generate card drafts with exact source references; require user review before publishing to a deck.
- Add OCR/photo import, tutor chat grounded only in the user’s permitted documents/decks, and optionally audio study mode.
- Track cost, latency, prompt/model version, source coverage, and safety feedback for every generated result.
- Ensure all non-AI import, editing, scheduling, and study flows work while AI services are unavailable.

**Definition of done:** every AI card can show its source, be edited before saving, and has no hidden impact on review scheduling.

## Verification Matrix

| Change type | Required checks |
| --- | --- |
| Shared UI | Reference screenshot diff, responsive manual pass, keyboard/focus pass. |
| API-connected page | Existing request/response contract tests, authenticated and unauthenticated cases, loading/error/empty UI states. |
| Database migration | Backup/export, migration test on representative data, RLS tests, rollback procedure. |
| Scheduler change | Golden FSRS cases, timezone tests, idempotency tests, old-progress migration tests. |
| Offline work | Disconnect/reload/reconnect test; duplicate-event and ordering test. |
| Social/realtime work | Permission, reconnect, room isolation, and rate-limit tests. |

## Non-AI MVP Exit Criteria

The platform is ready for AI only when all of the following are true:

1. A signed-in student can create/import a 50-card rich deck, including media, in under five minutes.
2. The scheduler records ratings, survives refreshes, and produces reliable due dates for at least three months.
3. Flashcard, write, test, and matching study flows are responsive and accessible on desktop and mobile.
4. Test-week dates update a visible daily workload forecast without silently altering study history.
5. XP, streak, and analytics reconcile from persisted review logs.
6. Calendar/planner/test-week data remain available through the existing APIs and permissions.
7. The Aether UI matches the reference at agreed desktop and mobile viewports, with no loss of feature behavior.

## Immediate Backlog

1. Complete the Phase 0 API/storage/auth inventory and restore a reproducible production build.
2. Finish Phase 1 screenshot checks route by route, beginning with the dashboard, subjects, agenda, grades, decks, planner, notes, and settings.
3. Add a temporary compatibility test suite for `/api/studysets`, `/api/testweeks`, calendar, content, profile, and analytics before any data-layer refactor.
4. Select and pin the official FSRS implementation, then write golden scheduling tests before replacing the current SRS adapter.

