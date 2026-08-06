import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

declare global {
  // eslint-disable-next-line no-var
  var __learningPlatformDb: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __learningPlatformDbInitialized: boolean | undefined;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'learning-platform.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = globalThis.__learningPlatformDb ?? new Database(DB_PATH, { timeout: 10000 });
globalThis.__learningPlatformDb = db;

try {
  db.pragma('busy_timeout = 10000');
  db.pragma('journal_mode = WAL');
} catch (error) {
  if ((error as { code?: string }).code !== 'SQLITE_BUSY') {
    throw error;
  }
  console.warn('SQLite database is busy while setting pragmas; continuing with existing settings.');
}

function ensureColumn(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Initialize database schema
export function initializeDatabase() {
  if (globalThis.__learningPlatformDbInitialized) return;
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      preferences JSON,
      subscription TEXT DEFAULT 'free',
      school TEXT,
      grade TEXT
    )
  `);

  // Test weeks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_weeks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Test week subjects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_week_subjects (
      id TEXT PRIMARY KEY,
      test_week_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_week_id) REFERENCES test_weeks(id) ON DELETE CASCADE
    )
  `);

  // Study sets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_sets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT DEFAULT 'General',
      terms JSON DEFAULT '[]',
      visibility TEXT DEFAULT 'private',
      is_public BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      folder_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  ensureColumn("study_sets", "subject", "TEXT DEFAULT 'General'");
  ensureColumn("study_sets", "terms", "JSON DEFAULT '[]'");
  ensureColumn("study_sets", "visibility", "TEXT DEFAULT 'private'");
  ensureColumn("study_sets", "is_public", "BOOLEAN DEFAULT 0");
  ensureColumn("study_sets", "folder_id", "TEXT");

  db.exec(`
    CREATE TABLE IF NOT EXISTS study_cards (
      id TEXT PRIMARY KEY,
      study_set_id TEXT NOT NULL,
      term TEXT NOT NULL,
      definition TEXT NOT NULL,
      front TEXT,
      back TEXT,
      card_type TEXT DEFAULT 'basic',
      image_url TEXT,
      audio_url TEXT,
      tags JSON DEFAULT '[]',
      cloze_text TEXT,
      occlusions JSON DEFAULT '[]',
      suspended BOOLEAN DEFAULT 0,
      buried_until TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (study_set_id) REFERENCES study_sets(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS card_progress (
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      status TEXT DEFAULT 'unstudied',
      next_review_at TIMESTAMP,
      interval_days REAL DEFAULT 0,
      ease_factor REAL DEFAULT 2.5,
      difficulty REAL DEFAULT 5,
      stability REAL DEFAULT 1,
      retrievability REAL DEFAULT 1,
      review_count INTEGER DEFAULT 0,
      lapse_count INTEGER DEFAULT 0,
      correct_attempts INTEGER DEFAULT 0,
      total_attempts INTEGER DEFAULT 0,
      last_grade TEXT,
      last_reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, card_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS review_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      card_id TEXT NOT NULL,
      study_set_id TEXT NOT NULL,
      mode TEXT NOT NULL,
      grade TEXT,
      is_correct BOOLEAN NOT NULL,
      user_answer TEXT,
      correct_answer TEXT,
      time_spent INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES study_cards(id) ON DELETE CASCADE,
      FOREIGN KEY (study_set_id) REFERENCES study_sets(id) ON DELETE CASCADE
    )
  `);

  // Classes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      name TEXT NOT NULL,
      school TEXT,
      subject TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Class students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS class_students (
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (class_id, student_id),
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Assignments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      study_set_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TIMESTAMP NOT NULL,
      points INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    )
  `);

  // Homework table
  db.exec(`
    CREATE TABLE IF NOT EXISTS homework (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT NOT NULL,
      due_date TIMESTAMP NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      estimated_time INTEGER,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      test_week_id TEXT,
      related_study_set_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Calendar events table
  db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      start TIMESTAMP NOT NULL,
      end TIMESTAMP,
      all_day BOOLEAN DEFAULT 0,
      description TEXT,
      subject_id TEXT,
      test_week_id TEXT,
      color TEXT,
      completed BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Study plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      test_week_id TEXT NOT NULL,
      name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (test_week_id) REFERENCES test_weeks(id) ON DELETE CASCADE
    )
  `);

  // Study plan sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      study_plan_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      scheduled_date TIMESTAMP NOT NULL,
      duration INTEGER NOT NULL,
      topics JSON,
      completed BOOLEAN DEFAULT 0,
      actual_duration INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
    )
  `);

  // Streak data table
  db.exec(`
    CREATE TABLE IF NOT EXISTS streak_data (
      user_id TEXT PRIMARY KEY,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_study_date DATE,
      streak_history JSON,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Achievements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TIMESTAMP,
      progress INTEGER DEFAULT 0,
      max_progress INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, achievement_id)
    )
  `);

  // Create indexes for better performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_test_weeks_user_id ON test_weeks(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_test_week_subjects_test_week_id ON test_week_subjects(test_week_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_study_sets_user_id ON study_sets(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_study_cards_study_set_id ON study_cards(study_set_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_card_progress_next_review ON card_progress(next_review_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_review_logs_user_id ON review_logs(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_homework_user_id ON homework(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_homework_due_date ON homework(due_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id)`);
  globalThis.__learningPlatformDbInitialized = true;
}

// Initialize database on import
try {
  initializeDatabase();
} catch (error) {
  if ((error as { code?: string }).code !== 'SQLITE_BUSY') {
    throw error;
  }
  console.warn('SQLite database is busy during schema initialization; it will be retried on next server use.');
}

export default db;
