-- ============================================================================
-- Inbox Migration
-- Adds table for Inbox (quick notes, tasks, reminders)
-- ============================================================================

-- ============================================================================
-- TABLE: inbox
-- ============================================================================
CREATE TABLE public.inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_inbox_user_id ON public.inbox(user_id);
CREATE INDEX idx_inbox_completed ON public.inbox(completed);
CREATE INDEX idx_inbox_created_at ON public.inbox(created_at DESC);

-- Enable RLS
ALTER TABLE public.inbox ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own inbox"
  ON public.inbox FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inbox"
  ON public.inbox FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inbox"
  ON public.inbox FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inbox"
  ON public.inbox FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_inbox_updated_at BEFORE UPDATE ON public.inbox
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  ✅ Inbox Migration Complete!
  ============================================================================
  
  New Table Created:
  - inbox (quick notes, tasks, reminders)
  
  Security:
  - Row Level Security (RLS) enabled
  - Policies configured for user data isolation
  
  ============================================================================
  ';
END $$;
