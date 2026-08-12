-- Test-week planning was previously stored only in the local SQLite database.
-- These tables retain its public API model while moving ownership enforcement
-- to Supabase Row Level Security.
CREATE TABLE IF NOT EXISTS public.test_weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT test_weeks_date_order CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_test_weeks_user_start ON public.test_weeks(user_id, start_date);

CREATE TABLE IF NOT EXISTS public.test_week_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_week_id UUID NOT NULL REFERENCES public.test_weeks(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(test_week_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_test_week_subjects_week ON public.test_week_subjects(test_week_id);

ALTER TABLE public.test_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_week_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own test weeks"
  ON public.test_weeks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage subjects in own test weeks"
  ON public.test_week_subjects FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.test_weeks
    WHERE test_weeks.id = test_week_subjects.test_week_id
      AND test_weeks.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.test_weeks
    WHERE test_weeks.id = test_week_subjects.test_week_id
      AND test_weeks.user_id = auth.uid()
  ));

CREATE TRIGGER update_test_weeks_updated_at BEFORE UPDATE ON public.test_weeks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
