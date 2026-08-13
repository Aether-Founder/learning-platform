-- ============================================================================
-- Add avatar_url to users table if not exists
-- ============================================================================
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
