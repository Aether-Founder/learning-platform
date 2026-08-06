# Phase 2 — Authentication and Data Compatibility

## Purpose

Move the remaining legacy browser-token and SQLite-auth paths to the configured Supabase project without changing the public page or API behaviour unexpectedly.

## Completed in this increment

- Profile settings now use the Supabase browser session and profile row.
- `PUT /api/users/preferences` accepts a Supabase bearer token or session cookie, validates it with Supabase Auth, and updates only the signed-in user's profile through RLS.
- Profile sign-out now clears the Supabase session instead of deleting legacy local-storage credentials.
- The old preference API response remains `{ user }` so external callers keep the same response envelope.
- Calendar list, create, read, update, and delete endpoints now use Supabase Auth and RLS while preserving the existing `{ events }` / `{ event }` API envelopes.
- Added the pending `002_calendar_event_metadata.sql` migration to retain calendar-only fields not present in the base schema (color, all-day, recurrence, and test-week source).

## Next increments

1. Apply `002_calendar_event_metadata.sql` in the Supabase SQL editor before using the migrated calendar in production.
2. Replace legacy authentication in test-week creation and the historical authentication modal.
3. Retire the legacy JWT/SQLite auth path only after each dependent route has an equivalent Supabase-backed implementation and migration coverage.

## Guardrails

- Do not expose privileged database credentials in browser code or API responses.
- Keep Row Level Security as the authority for ownership checks.
- Preserve existing API shapes during each migration; introduce versioned endpoints if a breaking change is unavoidable.
