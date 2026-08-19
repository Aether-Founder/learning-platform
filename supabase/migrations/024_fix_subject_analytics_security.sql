-- Fix subject_analytics view to use SECURITY INVOKER to respect RLS
-- This migration drops and recreates the view with proper security settings

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.subject_analytics;

-- Recreate view with SECURITY INVOKER
CREATE VIEW public.subject_analytics
WITH (security_invoker = on)
AS
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
