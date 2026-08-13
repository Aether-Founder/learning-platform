-- ============================================================================
-- TABLE: grades (Student grades and test results)
-- ============================================================================
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  subject_name TEXT NOT NULL,
  teacher_name TEXT,
  test_name TEXT NOT NULL,
  grade DECIMAL(3,1) NOT NULL CHECK (grade >= 1 AND grade <= 10),
  weight DECIMAL(3,2) DEFAULT 1.0,
  period INTEGER CHECK (period IN (1, 2, 3, 4)),
  test_date DATE,
  target_grade DECIMAL(3,1) CHECK (target_grade >= 1 AND target_grade <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_grades_user_id ON public.grades(user_id);
CREATE INDEX idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX idx_grades_period ON public.grades(period);
CREATE INDEX idx_grades_test_date ON public.grades(test_date);

-- Enable RLS
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own grades"
  ON public.grades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grades"
  ON public.grades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grades"
  ON public.grades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grades"
  ON public.grades FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();