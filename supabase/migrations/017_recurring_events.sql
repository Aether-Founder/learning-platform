-- Add recurring events to calendar
-- Enhances calendar_events table for recurring event support

ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_rule TEXT, -- 'daily', 'weekly', 'monthly', 'yearly'
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;

-- Index for recurring events
CREATE INDEX IF NOT EXISTS idx_calendar_events_is_recurring ON public.calendar_events(is_recurring);

-- Add comment
COMMENT ON COLUMN public.calendar_events.is_recurring IS 'Whether this event recurs';
COMMENT ON COLUMN public.calendar_events.recurrence_rule IS 'Recurrence pattern: daily, weekly, monthly, yearly';
COMMENT ON COLUMN public.calendar_events.recurrence_end_date IS 'When recurrence should end (optional)';
COMMENT ON COLUMN public.calendar_events.recurrence_count IS 'Maximum number of occurrences (optional)';
