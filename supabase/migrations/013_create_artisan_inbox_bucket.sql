-- Create artisan-inbox storage bucket for AI file uploads
-- This is a private bucket where users upload heavy files for processing
-- Founder downloads locally, processes, then purges the original file

INSERT INTO storage.buckets (id, name, public)
VALUES ('artisan-inbox', 'artisan-inbox', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Users can upload to artisan-inbox
CREATE POLICY "Users can upload to artisan-inbox"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artisan-inbox' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own files
CREATE POLICY "Users can view own artisan-inbox files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'artisan-inbox'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
CREATE POLICY "Users can delete own artisan-inbox files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artisan-inbox'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role (admin) can do everything
CREATE POLICY "Service role full access artisan-inbox"
  ON storage.objects FOR ALL
  USING (auth.role() = 'service_role');
