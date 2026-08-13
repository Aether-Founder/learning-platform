-- Artisan AI Queue Table
-- Tracks user uploads for the "Wizard of Oz" AI processing workflow

CREATE TABLE IF NOT EXISTS artisan_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result_deck_id UUID REFERENCES study_sets(id) ON DELETE SET NULL,
  result_json JSONB,
  error_message TEXT,
  request_type TEXT DEFAULT 'flashcards' CHECK (request_type IN ('flashcards', 'podcast', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_artisan_queue_user_id ON artisan_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_artisan_queue_status ON artisan_queue(status);
CREATE INDEX IF NOT EXISTS idx_artisan_queue_created_at ON artisan_queue(created_at DESC);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_artisan_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_artisan_queue_updated_at
  BEFORE UPDATE ON artisan_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_artisan_queue_updated_at();

-- Enable RLS
ALTER TABLE artisan_queue ENABLE ROW LEVEL SECURITY;

-- Users can view their own queue entries
CREATE POLICY "Users can view own artisan queue"
  ON artisan_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own queue entries
CREATE POLICY "Users can insert own artisan queue"
  ON artisan_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin (founder) can view all entries
-- Assumes there's an is_admin column in users table or similar
-- For now, we'll allow service role to manage
CREATE POLICY "Service role can manage artisan queue"
  ON artisan_queue FOR ALL
  USING (auth.role() = 'service_role');
