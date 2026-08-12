-- ============================================================================
-- Aether Study Platform - Supabase Database Schema
-- ============================================================================
-- This file contains all table definitions, indexes, and RLS policies
-- Run this in your Supabase SQL Editor after providing the schema
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  grade_level TEXT DEFAULT NULL,
  track TEXT DEFAULT NULL,
  grade_confirmed_year TEXT DEFAULT NULL,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster username lookups
CREATE INDEX idx_users_username ON public.users(username);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- TABLE: subjects
-- ============================================================================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  level TEXT DEFAULT 'VWO 4',
  color TEXT,
  icon TEXT,
  mastery INTEGER DEFAULT 0 CHECK (mastery >= 0 AND mastery <= 100),
  topics INTEGER DEFAULT 0,
  topics_done INTEGER DEFAULT 0,
  due_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Indexes
CREATE INDEX idx_subjects_user_id ON public.subjects(user_id);
CREATE INDEX idx_subjects_slug ON public.subjects(slug);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subjects"
  ON public.subjects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subjects"
  ON public.subjects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: study_sets
-- ============================================================================
CREATE TABLE public.study_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  content_json JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Indexes
CREATE INDEX idx_study_sets_user_id ON public.study_sets(user_id);
CREATE INDEX idx_study_sets_subject_id ON public.study_sets(subject_id);
CREATE INDEX idx_study_sets_public ON public.study_sets(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_study_sets_content_json ON public.study_sets USING GIN(content_json);

-- Enable RLS
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own and public sets"
  ON public.study_sets FOR SELECT
  USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own sets"
  ON public.study_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sets"
  ON public.study_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sets"
  ON public.study_sets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: flashcards
-- ============================================================================
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_set_id UUID NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  number TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  order_index INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_flashcards_study_set_id ON public.flashcards(study_set_id);
CREATE INDEX idx_flashcards_order ON public.flashcards(study_set_id, order_index);

-- Enable RLS
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherit from study_sets)
CREATE POLICY "Users can view flashcards from accessible sets"
  ON public.flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sets
      WHERE study_sets.id = flashcards.study_set_id
      AND (study_sets.user_id = auth.uid() OR study_sets.is_public = TRUE)
    )
  );

CREATE POLICY "Users can manage flashcards in own sets"
  ON public.flashcards FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.study_sets
      WHERE study_sets.id = flashcards.study_set_id
      AND study_sets.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: study_sessions
-- ============================================================================
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  study_set_id UUID REFERENCES public.study_sets(id) ON DELETE SET NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  cards_studied INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  cards_incorrect INTEGER DEFAULT 0,
  session_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX idx_study_sessions_started_at ON public.study_sessions(started_at DESC);
CREATE INDEX idx_study_sessions_subject_id ON public.study_sessions(subject_id);

-- Enable RLS
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions"
  ON public.study_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: card_reviews
-- ============================================================================
CREATE TABLE public.card_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.study_sessions(id) ON DELETE SET NULL,
  was_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5),
  reviewed_at TIMESTAMPTZ DEFAULT NOW(),
  next_review_date TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_card_reviews_user_id ON public.card_reviews(user_id);
CREATE INDEX idx_card_reviews_flashcard_id ON public.card_reviews(flashcard_id);
CREATE INDEX idx_card_reviews_session_id ON public.card_reviews(session_id);
CREATE INDEX idx_card_reviews_next_review ON public.card_reviews(next_review_date) WHERE next_review_date IS NOT NULL;

-- Enable RLS
ALTER TABLE public.card_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own reviews"
  ON public.card_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON public.card_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: achievements
-- ============================================================================
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  unlocked_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_type ON public.achievements(achievement_type);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own achievements"
  ON public.achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON public.achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- TABLE: calendar_events
-- ============================================================================
CREATE TABLE public.calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('toets', 'examen', 'huiswerk', 'les', 'project', 'other')),
  event_date DATE NOT NULL,
  event_time TIME,
  end_time TIME,
  location TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  reminder_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_date ON public.calendar_events(event_date DESC);
CREATE INDEX idx_calendar_events_type ON public.calendar_events(event_type);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own events"
  ON public.calendar_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
  ON public.calendar_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
  ON public.calendar_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
  ON public.calendar_events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: bookmarks
-- ============================================================================
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  study_set_id UUID NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  paragraph_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, study_set_id, paragraph_id)
);

-- Indexes
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_study_set_id ON public.bookmarks(study_set_id);

-- Enable RLS
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own bookmarks"
  ON public.bookmarks FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: reading_progress
-- ============================================================================
CREATE TABLE public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  study_set_id UUID NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  paragraph_id TEXT NOT NULL,
  percentage INTEGER DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  last_position TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, study_set_id, paragraph_id)
);

-- Indexes
CREATE INDEX idx_reading_progress_user_id ON public.reading_progress(user_id);
CREATE INDEX idx_reading_progress_study_set_id ON public.reading_progress(study_set_id);

-- Enable RLS
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own reading progress"
  ON public.reading_progress FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: analytics_events
-- ============================================================================
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_data ON public.analytics_events USING GIN(event_data);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own analytics"
  ON public.analytics_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics"
  ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_sets_updated_at BEFORE UPDATE ON public.study_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_progress_updated_at BEFORE UPDATE ON public.reading_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username, full_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate study set stats
CREATE OR REPLACE FUNCTION get_user_study_stats(user_uuid UUID)
RETURNS TABLE (
  total_sets BIGINT,
  total_cards BIGINT,
  cards_studied_today BIGINT,
  study_streak_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT ss.id)::BIGINT as total_sets,
    COUNT(DISTINCT f.id)::BIGINT as total_cards,
    COUNT(DISTINCT CASE 
      WHEN DATE(sess.started_at) = CURRENT_DATE 
      THEN cr.id 
    END)::BIGINT as cards_studied_today,
    0 as study_streak_days -- TODO: implement streak calculation
  FROM public.study_sets ss
  LEFT JOIN public.flashcards f ON f.study_set_id = ss.id
  LEFT JOIN public.study_sessions sess ON sess.user_id = user_uuid
  LEFT JOIN public.card_reviews cr ON cr.user_id = user_uuid
  WHERE ss.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for subject analytics
CREATE OR REPLACE VIEW subject_analytics AS
SELECT
  s.id as subject_id,
  s.user_id,
  s.name,
  s.slug,
  COUNT(DISTINCT ss.id) as total_sets,
  COUNT(DISTINCT f.id) as total_cards,
  COUNT(DISTINCT sess.id) as total_sessions,
  SUM(sess.duration_minutes) as total_study_minutes,
  ROUND(AVG(CASE 
    WHEN sess.cards_studied > 0 
    THEN (sess.cards_correct::DECIMAL / sess.cards_studied * 100)
    ELSE 0 
  END), 2) as average_accuracy
FROM public.subjects s
LEFT JOIN public.study_sets ss ON ss.subject_id = s.id
LEFT JOIN public.flashcards f ON f.study_set_id = ss.id
LEFT JOIN public.study_sessions sess ON sess.subject_id = s.id
GROUP BY s.id, s.user_id, s.name, s.slug;

-- ============================================================================
-- SEED DATA (Optional Demo Data)
-- ============================================================================

-- Note: This will be populated after user registration
-- You can manually add demo subjects for testing

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  ✅ Aether Study Platform Database Schema Created Successfully!
  ============================================================================
  
  Tables Created:
  - users (with auth trigger)
  - subjects
  - study_sets
  - flashcards
  - study_sessions
  - card_reviews
  - achievements
  - calendar_events
  - bookmarks
  - reading_progress
  - analytics_events
  
  Security:
  - Row Level Security (RLS) enabled on all tables
  - Policies configured for user data isolation
  - Automated user profile creation on signup
  
  Next Steps:
  1. Verify all tables in Supabase Table Editor
  2. Test RLS policies with test user
  3. Update Next.js app with Supabase client
  4. Import existing content to study_sets
  
  ============================================================================
  ';
END $$;
