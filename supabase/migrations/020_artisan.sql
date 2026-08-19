-- ============================================================================
-- Artisan Ingestion Engine Migration
-- Adds table for Artisan queue and storage policies
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM: artisan_status
-- ============================================================================
CREATE TYPE artisan_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- ============================================================================
-- TABLE: artisan_queue
-- ============================================================================
CREATE TABLE public.artisan_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in the 'artisan-inbox' bucket
  file_size_bytes BIGINT NOT NULL,
  status artisan_status DEFAULT 'pending',
  result_deck_id UUID REFERENCES public.decks(id) ON DELETE SET NULL, -- Linked once completed
  admin_notes TEXT, -- Optional notes from the founder
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_artisan_queue_status ON public.artisan_queue(status);
CREATE INDEX idx_artisan_queue_user ON public.artisan_queue(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_artisan_queue_updated_at BEFORE UPDATE ON public.artisan_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies for artisan_queue
-- ============================================================================
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

-- ============================================================================
-- STORAGE BUCKET: artisan-inbox
-- ============================================================================
-- Note: This needs to be created manually in Supabase dashboard or via API
-- Bucket Name: artisan-inbox
-- Public: false
-- File Size Limit: 50MB
-- Allowed MIME types: application/pdf, image/jpeg, image/png, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- ============================================================================
-- STORAGE RLS Policies
-- ============================================================================
-- Users can ONLY upload to their own folder (user_id prefix)
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'artisan-inbox' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can ONLY view/delete their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'artisan-inbox' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'artisan-inbox' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  ✅ Artisan Ingestion Engine Migration Complete!
  ============================================================================
  
  New Table Created:
  - artisan_queue (upload tracking queue)
  
  New ENUM Created:
  - artisan_status (pending, processing, completed, failed)
  
  Storage Configuration Required:
  - Create bucket "artisan-inbox" in Supabase dashboard
  - Set bucket to private
  - Set file size limit to 50MB
  - Allowed MIME types: PDF, JPEG, PNG, DOCX
  
  Security:
  - Row Level Security (RLS) enabled on artisan_queue
  - Storage RLS policies configured for user isolation
  
  ============================================================================
  ';
END $$;
