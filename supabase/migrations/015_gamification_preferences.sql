-- Add gamification preferences to users table
-- User can opt-in to gamification features (XP, streaks, etc.)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gamification_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_study_date DATE;

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_total_xp ON public.users(total_xp DESC) WHERE gamification_enabled = TRUE;

-- Add comment
COMMENT ON COLUMN public.users.gamification_enabled IS 'Whether user has opted into gamification features (XP, streaks, etc.)';
COMMENT ON COLUMN public.users.total_xp IS 'Total XP points earned across all activities';
COMMENT ON COLUMN public.users.current_streak IS 'Current consecutive days studied';
COMMENT ON COLUMN public.users.longest_streak IS 'Longest streak achieved';
COMMENT ON COLUMN public.users.last_study_date IS 'Last date the user studied';
