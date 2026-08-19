-- ============================================================================
-- Create Artisan Queue Table (without decks FK)
-- This creates the artisan_queue table without the foreign key to decks
-- since the decks table doesn't exist yet
-- ============================================================================

-- Create the enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE artisan_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the artisan_queue table
CREATE TABLE IF NOT EXISTS public.artisan_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  status artisan_status DEFAULT 'pending',
  result_deck_id UUID,
  admin_notes TEXT,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_artisan_queue_status ON public.artisan_queue(status);
CREATE INDEX IF NOT EXISTS idx_artisan_queue_user ON public.artisan_queue(user_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_artisan_queue_updated_at ON public.artisan_queue;
CREATE TRIGGER update_artisan_queue_updated_at BEFORE UPDATE ON public.artisan_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.artisan_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own artisan_queue" ON public.artisan_queue;
DROP POLICY IF EXISTS "Users can insert own artisan_queue" ON public.artisan_queue;
DROP POLICY IF EXISTS "Users can update own artisan_queue" ON public.artisan_queue;
DROP POLICY IF EXISTS "Users can delete own artisan_queue" ON public.artisan_queue;

-- Create RLS policies
CREATE POLICY "Users can view own artisan_queue"
  ON public.artisan_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own artisan_queue"
  ON public.artisan_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own artisan_queue"
  ON public.artisan_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own artisan_queue"
  ON public.artisan_queue FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Note: Once the decks table is created, you can add the FK constraint with:
-- ALTER TABLE public.artisan_queue 
-- ADD CONSTRAINT artisan_queue_result_deck_id_fkey 
-- FOREIGN KEY (result_deck_id) REFERENCES public.decks(id) ON DELETE SET NULL;
-- ============================================================================
