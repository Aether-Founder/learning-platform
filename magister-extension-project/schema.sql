-- Magister Sync Schema
-- This schema supports syncing data from Magister via Chrome Extension
-- using a sync_token (UUID) for authentication instead of email matching

-- ============================================
-- Table: user_magister_mappings
-- Purpose: Links platform users to their Magister accounts via sync_token
-- ============================================

CREATE TABLE user_magister_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  magister_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- One mapping per user
);

-- Index for fast lookup by sync_token (used by Chrome Extension)
CREATE INDEX idx_user_magister_mappings_sync_token ON user_magister_mappings(sync_token);

-- Index for user_id lookups
CREATE INDEX idx_user_magister_mappings_user_id ON user_magister_mappings(user_id);

-- RLS Policies for user_magister_mappings
ALTER TABLE user_magister_mappings ENABLE ROW LEVEL SECURITY;

-- Users can only view their own mapping
CREATE POLICY "Users can view own magister mapping"
  ON user_magister_mappings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own mapping
CREATE POLICY "Users can insert own magister mapping"
  ON user_magister_mappings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own mapping
CREATE POLICY "Users can update own magister mapping"
  ON user_magister_mappings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own mapping
CREATE POLICY "Users can delete own magister mapping"
  ON user_magister_mappings
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- Table: magister_events
-- Purpose: Stores calendar events/items from Magister
-- ============================================

CREATE TABLE magister_events (
  id TEXT PRIMARY KEY, -- Using Magister's event ID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  raw_payload JSONB NOT NULL, -- Stores complete Magister API response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user_id and time-based queries
CREATE INDEX idx_magister_events_user_id ON magister_events(user_id);
CREATE INDEX idx_magister_events_start_time ON magister_events(start_time);
CREATE INDEX idx_magister_events_user_time ON magister_events(user_id, start_time);

-- RLS Policies for magister_events
ALTER TABLE magister_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own events
CREATE POLICY "Users can view own magister events"
  ON magister_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own magister events"
  ON magister_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own magister events"
  ON magister_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own magister events"
  ON magister_events
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- Table: magister_grades
-- Purpose: Stores grades from Magister
-- ============================================

CREATE TABLE magister_grades (
  id TEXT PRIMARY KEY, -- Using Magister's grade ID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  grade_value TEXT NOT NULL, -- Text to handle different grade formats (numbers, letters, etc.)
  raw_payload JSONB NOT NULL, -- Stores complete Magister API response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for user_id and subject queries
CREATE INDEX idx_magister_grades_user_id ON magister_grades(user_id);
CREATE INDEX idx_magister_grades_subject ON magister_grades(subject);
CREATE INDEX idx_magister_grades_user_subject ON magister_grades(user_id, subject);

-- RLS Policies for magister_grades
ALTER TABLE magister_grades ENABLE ROW LEVEL SECURITY;

-- Users can only view their own grades
CREATE POLICY "Users can view own magister grades"
  ON magister_grades
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own grades
CREATE POLICY "Users can insert own magister grades"
  ON magister_grades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own grades
CREATE POLICY "Users can update own magister grades"
  ON magister_grades
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own grades
CREATE POLICY "Users can delete own magister grades"
  ON magister_grades
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================
-- Functions for automatic updated_at timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_user_magister_mappings_updated_at
  BEFORE UPDATE ON user_magister_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_magister_events_updated_at
  BEFORE UPDATE ON magister_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_magister_grades_updated_at
  BEFORE UPDATE ON magister_grades
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- Helper function: Get user_id from sync_token
-- This is useful for the Chrome Extension to validate sync_token
-- ============================================

CREATE OR REPLACE FUNCTION get_user_id_from_sync_token(token UUID)
RETURNS UUID AS $$
  SELECT user_id FROM user_magister_mappings WHERE sync_token = token;
$$ LANGUAGE SQL SECURITY DEFINER;
