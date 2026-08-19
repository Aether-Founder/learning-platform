-- ============================================================================
-- Fix Artisan Queue - Remove decks FK since decks table doesn't exist yet
-- This migration removes the foreign key constraint on result_deck_id
-- ============================================================================

-- Drop the foreign key constraint if it exists
ALTER TABLE public.artisan_queue DROP CONSTRAINT IF EXISTS artisan_queue_result_deck_id_fkey;

-- Remove the foreign key from the column definition by recreating the table without it
-- First, backup data if any exists
CREATE TEMP TABLE artisan_queue_backup AS SELECT * FROM public.artisan_queue;

-- Drop the table
DROP TABLE IF EXISTS public.artisan_queue;

-- Recreate without the decks FK
CREATE TABLE public.artisan_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in the 'artisan-inbox' bucket
  file_size_bytes BIGINT NOT NULL,
  status artisan_status DEFAULT 'pending',
  result_deck_id UUID, -- Will be linked to decks once that table exists
  admin_notes TEXT, -- Optional notes from the founder
  card_count INTEGER DEFAULT 0, -- Number of cards generated
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_artisan_queue_status ON public.artisan_queue(status);
CREATE INDEX idx_artisan_queue_user ON public.artisan_queue(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_artisan_queue_updated_at BEFORE UPDATE ON public.artisan_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.artisan_queue ENABLE ROW LEVEL SECURITY;

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

-- Restore data if any existed
INSERT INTO public.artisan_queue SELECT * FROM artisan_queue_backup;
DROP TABLE artisan_queue_backup;

-- ============================================================================
-- Note: Once the decks table is created, you can add the FK constraint with:
-- ALTER TABLE public.artisan_queue 
-- ADD CONSTRAINT artisan_queue_result_deck_id_fkey 
-- FOREIGN KEY (result_deck_id) REFERENCES public.decks(id) ON DELETE SET NULL;
-- ============================================================================
