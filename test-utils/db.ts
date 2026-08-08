import db from '@/lib/db';

const ALL_TABLES = [
  'users',
  'test_weeks',
  'test_week_subjects',
  'study_sets',
  'study_cards',
  'card_progress',
  'review_logs',
  'classes',
  'class_members',
  'assignments',
  'homework',
  'calendar_events',
  'study_plans',
  'study_sessions',
  'streak_data',
  'achievements',
  'content',
  'user_data',
];

export function resetDatabase() {
  db.exec('PRAGMA foreign_keys = OFF');
  for (const table of ALL_TABLES) {
    db.exec(`DELETE FROM ${table}`);
  }
  db.exec('PRAGMA foreign_keys = ON');
}

export { db };
