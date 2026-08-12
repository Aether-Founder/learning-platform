-- Preserve the existing calendar API's presentation and planning fields.
-- The base schema intentionally keeps core event fields queryable; this
-- metadata column retains backwards-compatible optional data such as color,
-- recurrence and the source test week.
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
