-- ============================================================================
-- Phase 3: Subject Pages & Mastery Tracking
-- This migration creates tables for subjects, chapters, topics, and mastery tracking
-- ============================================================================

-- Subjects table (vakken)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT, -- e.g., "WISKB", "NATU"
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'BookOpen',
  description TEXT,
  teacher TEXT,
  exam_relevance TEXT DEFAULT 'normaal', -- normaal, hoog, laag
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapters table (hoofdstukken)
CREATE TABLE IF NOT EXISTS public.subject_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, number)
);

-- Topics table (onderwerpen)
CREATE TABLE IF NOT EXISTS public.subject_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES public.subject_chapters(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  learning_goals TEXT[], -- Array of learning goals
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mastery tracking table
CREATE TABLE IF NOT EXISTS public.mastery_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.subject_topics(id) ON DELETE CASCADE NOT NULL,
  mastery_percentage INTEGER DEFAULT 0 CHECK (mastery_percentage >= 0 AND mastery_percentage <= 100),
  status TEXT DEFAULT 'nieuw' CHECK (status IN ('nieuw', 'leren', 'herhalen', 'beheerst')),
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  total_reviews INTEGER DEFAULT 0,
  correct_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, topic_id)
);

-- Test dates table
CREATE TABLE IF NOT EXISTS public.subject_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  test_date DATE NOT NULL,
  chapters TEXT[], -- Array of chapter IDs covered
  weight_factor INTEGER DEFAULT 1, -- Weegfactor
  required_grade NUMERIC(3,1) DEFAULT 5.5,
  current_mastery INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'laag' CHECK (risk_level IN ('laag', 'gemiddeld', 'hoog')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grades table
CREATE TABLE IF NOT EXISTS public.subject_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  test_id UUID REFERENCES public.subject_tests(id) ON DELETE SET NULL,
  grade NUMERIC(3,1) NOT NULL,
  test_date DATE NOT NULL,
  weight INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_user ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_chapters_subject ON public.subject_chapters(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_topics_chapter ON public.subject_topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_mastery_tracking_user ON public.mastery_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_tracking_topic ON public.mastery_tracking(topic_id);
CREATE INDEX IF NOT EXISTS idx_subject_tests_subject ON public.subject_tests(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_tests_date ON public.subject_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_subject_grades_subject ON public.subject_grades(subject_id);

-- Triggers for updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_subjects_updated_at ON public.subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subject_chapters_updated_at ON public.subject_chapters;
CREATE TRIGGER update_subject_chapters_updated_at BEFORE UPDATE ON public.subject_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subject_topics_updated_at ON public.subject_topics;
CREATE TRIGGER update_subject_topics_updated_at BEFORE UPDATE ON public.subject_topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mastery_tracking_updated_at ON public.mastery_tracking;
CREATE TRIGGER update_mastery_tracking_updated_at BEFORE UPDATE ON public.mastery_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subject_tests_updated_at ON public.subject_tests;
CREATE TRIGGER update_subject_tests_updated_at BEFORE UPDATE ON public.subject_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_grades ENABLE ROW LEVEL SECURITY;

-- Subjects policies
DROP POLICY IF EXISTS "Users can view own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can insert own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can update own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can delete own subjects" ON public.subjects;

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

-- Chapters policies (through subject ownership)
DROP POLICY IF EXISTS "Users can view chapters of own subjects" ON public.subject_chapters;
DROP POLICY IF EXISTS "Users can insert chapters for own subjects" ON public.subject_chapters;
DROP POLICY IF EXISTS "Users can update chapters of own subjects" ON public.subject_chapters;
DROP POLICY IF EXISTS "Users can delete chapters of own subjects" ON public.subject_chapters;

CREATE POLICY "Users can view chapters of own subjects"
  ON public.subject_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_chapters.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chapters for own subjects"
  ON public.subject_chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_chapters.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update chapters of own subjects"
  ON public.subject_chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_chapters.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chapters of own subjects"
  ON public.subject_chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_chapters.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

-- Topics policies (through chapter ownership)
DROP POLICY IF EXISTS "Users can view topics of own chapters" ON public.subject_topics;
DROP POLICY IF EXISTS "Users can insert topics for own chapters" ON public.subject_topics;
DROP POLICY IF EXISTS "Users can update topics of own chapters" ON public.subject_topics;
DROP POLICY IF EXISTS "Users can delete topics of own chapters" ON public.subject_topics;

CREATE POLICY "Users can view topics of own chapters"
  ON public.subject_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subject_chapters sc
      JOIN public.subjects s ON s.id = sc.subject_id
      WHERE sc.id = subject_topics.chapter_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert topics for own chapters"
  ON public.subject_topics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subject_chapters sc
      JOIN public.subjects s ON s.id = sc.subject_id
      WHERE sc.id = subject_topics.chapter_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update topics of own chapters"
  ON public.subject_topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.subject_chapters sc
      JOIN public.subjects s ON s.id = sc.subject_id
      WHERE sc.id = subject_topics.chapter_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete topics of own chapters"
  ON public.subject_topics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.subject_chapters sc
      JOIN public.subjects s ON s.id = sc.subject_id
      WHERE sc.id = subject_topics.chapter_id 
      AND s.user_id = auth.uid()
    )
  );

-- Mastery tracking policies
DROP POLICY IF EXISTS "Users can view own mastery tracking" ON public.mastery_tracking;
DROP POLICY IF EXISTS "Users can insert own mastery tracking" ON public.mastery_tracking;
DROP POLICY IF EXISTS "Users can update own mastery tracking" ON public.mastery_tracking;
DROP POLICY IF EXISTS "Users can delete own mastery tracking" ON public.mastery_tracking;

CREATE POLICY "Users can view own mastery tracking"
  ON public.mastery_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mastery tracking"
  ON public.mastery_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mastery tracking"
  ON public.mastery_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mastery tracking"
  ON public.mastery_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- Tests policies (through subject ownership)
DROP POLICY IF EXISTS "Users can view tests of own subjects" ON public.subject_tests;
DROP POLICY IF EXISTS "Users can insert tests for own subjects" ON public.subject_tests;
DROP POLICY IF EXISTS "Users can update tests of own subjects" ON public.subject_tests;
DROP POLICY IF EXISTS "Users can delete tests of own subjects" ON public.subject_tests;

CREATE POLICY "Users can view tests of own subjects"
  ON public.subject_tests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_tests.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tests for own subjects"
  ON public.subject_tests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_tests.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tests of own subjects"
  ON public.subject_tests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_tests.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tests of own subjects"
  ON public.subject_tests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_tests.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

-- Grades policies (through subject ownership)
DROP POLICY IF EXISTS "Users can view grades of own subjects" ON public.subject_grades;
DROP POLICY IF EXISTS "Users can insert grades for own subjects" ON public.subject_grades;
DROP POLICY IF EXISTS "Users can update grades of own subjects" ON public.subject_grades;
DROP POLICY IF EXISTS "Users can delete grades of own subjects" ON public.subject_grades;

CREATE POLICY "Users can view grades of own subjects"
  ON public.subject_grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_grades.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert grades for own subjects"
  ON public.subject_grades FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_grades.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update grades of own subjects"
  ON public.subject_grades FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_grades.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete grades of own subjects"
  ON public.subject_grades FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE subjects.id = subject_grades.subject_id 
      AND subjects.user_id = auth.uid()
    )
  );
